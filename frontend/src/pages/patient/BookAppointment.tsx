import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctorApi, getSlotsApi, lockSlotApi, unlockSlotApi } from '../../api/doctor.api'
import { bookAppointmentApi } from '../../api/appointment.api'
import useSocket from '../../hooks/useSocket'
import Toast from '../../components/Toast'
import useToast from '../../hooks/useToast'
import type { Slot } from '../../types'
import { useAuth } from '../../context/AuthContext'

// ─── Lock countdown hook ──────────────────────────────────────────────────────
const LOCK_DURATION_MS = 2 * 60 * 1000 // 2 minutes (matches backend)

const useLockCountdown = (lockedAt: number | null) => {
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    if (!lockedAt) {
      setRemaining(0)
      return
    }

    const tick = () => {
      const elapsed = Date.now() - lockedAt
      const left = Math.max(0, LOCK_DURATION_MS - elapsed)
      setRemaining(left)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedAt])

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  return { remaining, label: `${mm}:${ss}` }
}

// ─── Component ────────────────────────────────────────────────────────────────
const BookAppointment = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) { navigate('/'); return null }

  const queryClient = useQueryClient()
  const { toast, showToast, hideToast } = useToast()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [lockLockedAt, setLockLockedAt] = useState<number | null>(null)

  const lockedSlotRef = useRef<{ slotId: string; date: string } | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const { remaining: lockRemaining, label: lockLabel } = useLockCountdown(lockLockedAt)

  const socket = useSocket(id)

  // ── Expiry timer ──────────────────────────────────────────────────────────
  const clearExpiryTimer = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }

  const startExpiryTimer = useCallback((slotDate: string, slotId: string) => {
    clearExpiryTimer()
    expiryTimerRef.current = setTimeout(() => {
      // tell the server to release the lock so other users see it as available
      unlockSlotApi(id!, slotId).catch(() => {})
      setSelectedSlot(null)
      lockedSlotRef.current = null
      setLockLockedAt(null)
      queryClient.invalidateQueries({ queryKey: ['slots', id, slotDate] })
      showToast('Your slot reservation expired. Please select again.', 'error')
    }, LOCK_DURATION_MS)
  }, [id, queryClient, showToast])

  // ── API mutations ──────────────────────────────────────────────────────────
  const { mutate: lock } = useMutation({
    mutationFn: ({ slotId, date }: { slotId: string; date: string }) =>
      lockSlotApi(id!, slotId, date),
    // backend auto-unlocks previous slot atomically — no need to call unlock first
    onSuccess: (_, vars) => {
      lockedSlotRef.current = vars
      setLockLockedAt(Date.now())
      startExpiryTimer(vars.date, vars.slotId)
      // no invalidateQueries here — socket notifies other users, our local state is already set
    },
    onError: (err: any) => {
      // rollback: slot couldn't be locked, clear selection
      setSelectedSlot(null)
      lockedSlotRef.current = null
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
      showToast(err.response?.data?.message || 'Slot could not be locked. It may have been taken.', 'error')
    },
  })

  const { mutate: unlock } = useMutation({
    // only called on: deselect, date change, unmount — NOT on slot switch
    mutationFn: ({ slotId }: { slotId: string }) => unlockSlotApi(id!, slotId),
    onSettled: () => {
      clearExpiryTimer()
      lockedSlotRef.current = null
      setLockLockedAt(null)
      // no invalidateQueries — socket notifies other users
    },
  })

  const { mutate: bookSlot, isPending } = useMutation({
    mutationFn: bookAppointmentApi,
    onSuccess: () => {
      clearExpiryTimer()
      lockedSlotRef.current = null
      setLockLockedAt(null)
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] })
      showToast('Appointment booked successfully!')
      setTimeout(() => navigate('/appointments'), 1500)
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Booking failed. Please try again.', 'error')
    },
  })

  // ── Slot selection ────────────────────────────────────────────────────────
  const handleSlotSelect = useCallback((slot: Slot) => {
    if (selectedSlot?._id === slot._id) {
      // deselect → explicit unlock
      unlock({ slotId: slot._id })
      setSelectedSlot(null)
      return
    }

    // switching slots: just call lock — backend handles unlocking the previous one
    setSelectedSlot(slot)
    lock({ slotId: slot._id, date: selectedDate })
  }, [selectedSlot, selectedDate, lock, unlock])

  // ── Unlock on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearExpiryTimer()
      if (lockedSlotRef.current) {
        unlockSlotApi(id!, lockedSlotRef.current.slotId).catch(() => {})
      }
    }
  }, [id])

  // ── Date change ───────────────────────────────────────────────────────────
  const handleDateChange = (date: string) => {
    if (lockedSlotRef.current) {
      // explicit unlock when abandoning a date
      unlock({ slotId: lockedSlotRef.current.slotId })
    }
    setSelectedSlot(null)
    setSelectedDate(date)
  }

  // ── Socket events — only for OTHER users' actions ─────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on('slot:booked', ({ slotId, userId }: { slotId: string; userId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
      if (userId === user?._id) return
      if (selectedSlot?._id === slotId) {
        clearExpiryTimer()
        setSelectedSlot(null)
        lockedSlotRef.current = null
        setLockLockedAt(null)
        showToast('Your selected slot was just booked by someone else!', 'error')
      }
    })

    socket.on('slot:cancelled', () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
    })

    socket.on('slot:locked', () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
    })

    socket.on('slot:unlocked', () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
    })

    return () => {
      socket.off('slot:booked')
      socket.off('slot:cancelled')
      socket.off('slot:locked')
      socket.off('slot:unlocked')
    }
  }, [socket, id, selectedDate, selectedSlot, queryClient, user])

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: doctor, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctorApi(id!),
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: () => getSlotsApi(id!, selectedDate),
    enabled: !!selectedDate && !!id,
  })

  const handleBook = () => {
    if (!selectedSlot || !selectedDate || !id) return
    bookSlot({ doctorId: id, slotId: selectedSlot._id, date: selectedDate, notes })
  }

  const availableDays = doctor?.schedule.map((s: any) => s.day) || []
  const isDateAvailable = (dateStr: string) => {
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
    return availableDays.includes(day)
  }

  const getSlotStyle = (slot: Slot) => {
    const isSelected = selectedSlot?._id === slot._id
    if (isSelected) return 'bg-teal-600 text-white font-medium ring-2 ring-teal-400 ring-offset-1'
    if (slot.isLockedByMe) return 'bg-teal-100 text-teal-700 border border-teal-300'
    if (slot.isLocked) return 'bg-amber-50 text-amber-400 cursor-not-allowed border border-amber-200'
    return 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
  }

  const isSlotDisabled = (slot: Slot) => slot.isLocked && !slot.isLockedByMe

  if (doctorLoading) return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-4">
      <div className="card p-6 h-32 bg-gray-100" />
      <div className="card p-6 h-48 bg-gray-100" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <button
        onClick={() => navigate(`/doctors/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Back to Profile
      </button>

      {doctor && (
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-teal-700 font-semibold">{doctor.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{doctor.name}</h2>
              <p className="text-teal-600 text-sm">{doctor.specialization}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="font-semibold text-slate-900">₹{doctor.consultationFee}</div>
              <div className="text-xs text-gray-400">Consultation fee</div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-medium text-slate-900 mb-4">Select Date</h3>
        {availableDays.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {availableDays.map((day: string) => (
              <span key={day} className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
                {day}
              </span>
            ))}
          </div>
        )}
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={e => handleDateChange(e.target.value)}
          className="input"
        />
        {selectedDate && !isDateAvailable(selectedDate) && (
          <p className="text-amber-600 text-sm mt-2">
            Doctor is not available on this day. Please select a different date.
          </p>
        )}
      </div>

      {selectedDate && isDateAvailable(selectedDate) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">Available Slots</h3>
            <span className="text-xs text-teal-500">● Live updates</span>
          </div>

          {selectedSlot && lockRemaining > 0 && (
            <div className="mb-4 flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-teal-700">
                <span className="text-base">🔒</span>
                <span>Slot reserved for you</span>
              </div>
              <div className={`font-mono text-sm font-semibold tabular-nums ${lockRemaining < 30000 ? 'text-red-500' : 'text-teal-700'}`}>
                {lockLabel}
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-teal-600 inline-block" />
              Selected (yours)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" />
              Locked by others
            </span>
          </div>

          {slotsLoading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!slotsLoading && slots?.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">No available slots for this date.</p>
            </div>
          )}

          {!slotsLoading && slots && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot: Slot) => (
                <button
                  key={slot._id}
                  onClick={() => !isSlotDisabled(slot) && handleSlotSelect(slot)}
                  disabled={isSlotDisabled(slot)}
                  title={isSlotDisabled(slot) ? 'This slot is temporarily reserved by another user' : undefined}
                  className={`py-2.5 px-3 rounded-xl text-sm transition-all ${getSlotStyle(slot)} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {slot.startTime}
                  {slot.isLocked && !slot.isLockedByMe && (
                    <span className="block text-[10px] leading-none mt-0.5 opacity-70">locked</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-4">Additional Notes</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any symptoms or reasons for visit (optional)"
            rows={3}
            className="input resize-none"
          />
        </div>
      )}

      {selectedSlot && selectedDate && (
        <div className="card p-5 bg-teal-50 border-teal-100">
          <h3 className="font-medium text-teal-900 mb-3">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-teal-700">Doctor</span>
              <span className="font-medium text-teal-900">{doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-700">Date</span>
              <span className="font-medium text-teal-900">
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-700">Time</span>
              <span className="font-medium text-teal-900">
                {selectedSlot.startTime} – {selectedSlot.endTime}
              </span>
            </div>
            <div className="flex justify-between border-t border-teal-200 pt-2 mt-2">
              <span className="text-teal-700">Fee</span>
              <span className="font-semibold text-teal-900">₹{doctor?.consultationFee}</span>
            </div>
          </div>
          {lockRemaining > 0 && lockRemaining < 30000 && (
            <p className="mt-3 text-xs text-red-500 font-medium">
              ⚠️ Your reservation expires in {lockLabel}. Please confirm now.
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={!selectedSlot || !selectedDate || isPending || lockRemaining === 0}
        className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Booking...' : 'Confirm Booking'}
      </button>

    </div>
  )
}

export default BookAppointment