import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctorApi, getSlotsApi } from '../../api/doctor.api'
import { bookAppointmentApi } from '../../api/appointment.api'
import useSocket from '../../hooks/useSocket'
import type { Slot } from '../../types'

const BookAppointment = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
      if (!id) {
        navigate('/')
        return null
    }
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().split('T')[0]

  // socket connection
  const socket = useSocket(id)

  // real time slot updates
  useEffect(() => {
    if (!socket) return

    socket.on('slot:booked', ({ slotId }: { slotId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
      if (selectedSlot?._id === slotId) {
        setSelectedSlot(null)
      }
    })

    socket.on('slot:cancelled', () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
    })

    return () => {
      socket.off('slot:booked')
      socket.off('slot:cancelled')
    }
  }, [socket, id, selectedDate, selectedSlot, queryClient])

  const { data: doctor, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctorApi(id!),
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: () => getSlotsApi(id!, selectedDate),
    enabled: !!selectedDate && !!id,
  })

  const { mutate: bookSlot, isPending, error: bookError } = useMutation({
    mutationFn: bookAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] })
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] })
      navigate('/appointments')
    },
  })

  const handleBook = () => {
    if (!selectedSlot || !selectedDate || !id) return
    bookSlot({
      doctorId: id,
      slotId: selectedSlot._id,
      date: selectedDate,
      notes,
    })
  }

  const availableDays = doctor?.schedule.map(s => s.day) || []

  const isDateAvailable = (dateStr: string) => {
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
    return availableDays.includes(day)
  }

  if (doctorLoading) return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-4">
      <div className="card p-6 h-32 bg-gray-100" />
      <div className="card p-6 h-48 bg-gray-100" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">

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
              <span className="text-teal-700 font-semibold">
                {doctor.name.charAt(0)}
              </span>
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
            {availableDays.map(day => (
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
          onChange={e => {
            setSelectedDate(e.target.value)
            setSelectedSlot(null)
          }}
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
              {slots.map(slot => (
                <button
                  key={slot._id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 px-3 rounded-xl text-sm transition-all ${
                    selectedSlot?._id === slot._id
                      ? 'bg-teal-600 text-white font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {slot.startTime}
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
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-700">Time</span>
              <span className="font-medium text-teal-900">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            </div>
            <div className="flex justify-between border-t border-teal-200 pt-2 mt-2">
              <span className="text-teal-700">Fee</span>
              <span className="font-semibold text-teal-900">₹{doctor?.consultationFee}</span>
            </div>
          </div>
        </div>
      )}

      {bookError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {(bookError as any)?.response?.data?.message || 'Booking failed. Please try again.'}
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={!selectedSlot || !selectedDate || isPending}
        className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Booking...' : 'Confirm Booking'}
      </button>

    </div>
  )
}

export default BookAppointment