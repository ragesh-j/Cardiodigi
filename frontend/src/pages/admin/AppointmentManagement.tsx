import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllAppointmentsApi, updateAppointmentStatusApi } from '../../api/appointment.api'
import Modal from '../../components/DoctorModal'
import Toast from '../../components/Toast'
import useToast from '../../hooks/useToast'
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

const getValidStatuses = (currentStatus: string) => {
  if (currentStatus === 'confirmed') return ['confirmed', 'completed', 'cancelled']
  return [currentStatus] // cancelled/completed → no changes allowed
}

const AppointmentManagement = () => {
  const queryClient = useQueryClient()
  const { toast, showToast, hideToast } = useToast()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [newStatus, setNewStatus] = useState('')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: getAllAppointmentsApi,
  })

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) =>
      updateAppointmentStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedAppointment(null)
      showToast('Status updated successfully!')
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update status', 'error')
    },
  })

  const handleUpdateStatus = () => {
    if (!selectedAppointment || !newStatus) return

    if (newStatus === selectedAppointment.status) {
      showToast('No changes made', 'error')
      return
    }

    if (selectedAppointment.status === 'cancelled') {
      showToast('Cannot update a cancelled appointment', 'error')
      return
    }

    if (selectedAppointment.status === 'completed') {
      showToast('Cannot update a completed appointment', 'error')
      return
    }

    updateStatus({ id: selectedAppointment._id, status: newStatus })
  }

  const filtered = appointments?.filter((a: any) => {
    const matchesFilter = filter === 'all' ? true : a.status === filter
    const matchesSearch =
      a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor?.specialization?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
        <p className="text-gray-400 text-sm mt-1">View and manage all appointments</p>
      </div>

      {/* filters */}
      <div className="card p-4 space-y-3">
        <input
          type="text"
          placeholder="Search by patient or doctor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'confirmed', 'completed', 'cancelled'].map(f => (
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
                  ({appointments.filter((a: any) => a.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {/* empty */}
      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-gray-900 font-medium">No appointments found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {!isLoading && filtered && filtered.length > 0 && (
        <>
          {/* mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((apt: any) => (
              <div key={apt._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 text-sm font-semibold">
                        {apt.patient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{apt.patient.name}</div>
                      <div className="text-xs text-teal-600">{apt.doctor.name}</div>
                      <div className="text-xs text-gray-400">{apt.date} · {apt.slotStartTime}</div>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
                {/* only show update button for confirmed */}
                {apt.status === 'confirmed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt)
                        setNewStatus(apt.status)
                      }}
                      className="text-xs text-teal-600 font-medium"
                    >
                      Update Status
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* desktop table */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Patient</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Doctor</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Time</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((apt: any) => (
                    <tr key={apt._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center">
                            <span className="text-teal-700 text-xs font-semibold">
                              {apt.patient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{apt.patient.name}</div>
                            <div className="text-xs text-gray-400">{apt.patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{apt.doctor.name}</div>
                        <div className="text-xs text-gray-400">{apt.doctor.specialization}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{apt.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {apt.slotStartTime} - {apt.slotEndTime}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="px-6 py-4">
                        {/* only show for confirmed */}
                        {apt.status === 'confirmed' ? (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setNewStatus(apt.status)
                            }}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Update Status
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* update status modal */}
      {selectedAppointment && (
        <Modal
          title="Update Appointment Status"
          onClose={() => setSelectedAppointment(null)}
        >
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Patient</span>
                <span className="font-medium text-slate-900">
                  {(selectedAppointment.patient as any).name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-slate-900">
                  {(selectedAppointment.doctor as any).name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-slate-900">{selectedAppointment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-slate-900">
                  {selectedAppointment.slotStartTime} - {selectedAppointment.slotEndTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Status</span>
                <StatusBadge status={selectedAppointment.status} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                className="input"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {getValidStatuses(selectedAppointment.status).map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={isPending}
                className="btn-primary flex-1"
              >
                {isPending ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default AppointmentManagement