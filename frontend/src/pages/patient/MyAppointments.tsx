import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyAppointmentsApi, cancelAppointmentApi } from '../../api/appointment.api'
import type { Appointment } from '../../types'

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    confirmed: 'badge-confirmed',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed',
  }
  return (
    <span className={styles[status] || 'badge-confirmed'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const AppointmentCard = ({
  appointment,
  onCancel,
  cancelling,
}: {
  appointment: Appointment
  onCancel: (id: string) => void
  cancelling: boolean
}) => (
  <div className="card p-5">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-teal-700 font-semibold">
            {appointment.doctor.name.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{appointment.doctor.name}</h3>
          <p className="text-teal-600 text-sm">{appointment.doctor.specialization}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span>
              {new Date(appointment.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>{appointment.slotStartTime} - {appointment.slotEndTime}</span>
          </div>
          {appointment.notes && (
            <p className="text-gray-400 text-sm mt-1 italic">"{appointment.notes}"</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <StatusBadge status={appointment.status} />
        <span className="text-sm font-medium text-slate-900">
          ₹{appointment.doctor.consultationFee}
        </span>
        {appointment.status === 'confirmed' && (
          <button
            onClick={() => onCancel(appointment._id)}
            disabled={cancelling}
            className="btn-danger py-1.5 px-3 text-xs"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  </div>
)

const MyAppointments = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: getMyAppointmentsApi,
  })

  const { mutate: cancel } = useMutation({
    mutationFn: cancelAppointmentApi,
    onMutate: (id) => setCancellingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] })
      setCancellingId(null)
    },
    onError: () => setCancellingId(null),
  })

  const filtered = appointments?.filter(a =>
    filter === 'all' ? true : a.status === filter
  )

  const filters = ['all', 'confirmed', 'completed', 'cancelled']

  return (
    <div>
      {/* header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">My Appointments</h1>
        <p className="text-gray-400 text-sm mt-1">View and manage your bookings</p>
      </div>

      {/* filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-2 rounded-xl transition-colors capitalize ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
            }`}
          >
            {f}
            {f !== 'all' && appointments && (
              <span className="ml-1.5 text-xs opacity-75">
                ({appointments.filter(a => a.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load appointments.</p>
        </div>
      )}

      {/* empty */}
      {!isLoading && !error && filtered?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-gray-900 font-medium">No appointments found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all'
              ? "You haven't booked any appointments yet"
              : `No ${filter} appointments`}
          </p>
        </div>
      )}

      {/* list */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(appointment => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onCancel={cancel}
              cancelling={cancellingId === appointment._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAppointments