import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDoctorsApi,
  createDoctorApi,
  updateDoctorApi,
  deleteDoctorApi,
  updateScheduleApi,
} from '../../api/doctor.api'
import { validateDoctor } from '../../utils/validations'
import Modal from '../../components/DoctorModal'
import Toast from '../../components/Toast'
import useToast from '../../hooks/useToast'
import type { Doctor } from '../../types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Dermatology', 'Gynecology', 'General Medicine',
]

const emptyForm = {
  name: '', email: '', specialization: '', qualification: '',
  experience: '', phone: '', bio: '', consultationFee: '',
  slotDuration: '30', isAvailable: true,
}

const DoctorManagement = () => {
  const queryClient = useQueryClient()
  const { toast, showToast, hideToast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null)
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [schedule, setSchedule] = useState<{ day: string, startTime: string, endTime: string }[]>([])
  const [slotDuration, setSlotDuration] = useState(30)

  const resetForm = () => {
    setShowForm(false)
    setEditDoctor(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctorsApi(),
  })

  const { mutate: createDoctor, isPending: creating } = useMutation({
    mutationFn: createDoctorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      resetForm()
      showToast('Doctor added successfully!')
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to add doctor', 'error')
    },
  })

  const { mutate: updateDoctor, isPending: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateDoctorApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      resetForm()
      showToast('Doctor updated successfully!')
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update doctor', 'error')
    },
  })

  const { mutate: deleteDoctor } = useMutation({
    mutationFn: deleteDoctorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setDeleteConfirm(null)
      showToast('Doctor deleted successfully!')
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete doctor', 'error')
    },
  })

  const { mutate: saveSchedule, isPending: savingSchedule } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateScheduleApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setScheduleDoctor(null)
      showToast('Schedule updated successfully!')
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update schedule', 'error')
    },
  })

  const handleEdit = (doctor: Doctor) => {
    setEditDoctor(doctor)
    setForm({
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: String(doctor.experience),
      phone: doctor.phone,
      bio: doctor.bio || '',
      consultationFee: String(doctor.consultationFee),
      slotDuration: String(doctor.slotDuration),
      isAvailable: doctor.isAvailable,
    })
    setFormErrors({})
    setShowForm(true)
  }

  const handleSchedule = (doctor: Doctor) => {
    setScheduleDoctor(doctor)
    setSchedule(doctor.schedule || [])
    setSlotDuration(doctor.slotDuration)
  }

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()

  const validationErrors = validateDoctor(form)
  if (Object.keys(validationErrors).length > 0) {
    setFormErrors(validationErrors)
    return
  }

  setFormErrors({})

  const data = {
    ...form,
    experience: Number(form.experience),
    consultationFee: Number(form.consultationFee),
    slotDuration: Number(form.slotDuration),
  }

  if (editDoctor) {
    // check if anything changed
    const hasChanged =
      data.name !== editDoctor.name ||
      data.email !== editDoctor.email ||
      data.specialization !== editDoctor.specialization ||
      data.qualification !== editDoctor.qualification ||
      data.experience !== editDoctor.experience ||
      data.phone !== editDoctor.phone ||
      data.bio !== (editDoctor.bio || '') ||
      data.consultationFee !== editDoctor.consultationFee ||
      data.slotDuration !== editDoctor.slotDuration ||
      data.isAvailable !== editDoctor.isAvailable

    if (!hasChanged) {
      showToast('No changes made', 'error')
      return
    }

    updateDoctor({ id: editDoctor._id, data })
  } else {
    createDoctor(data as any)
  }
}

  const toggleDay = (day: string) => {
    const exists = schedule.find(s => s.day === day)
    if (exists) {
      setSchedule(schedule.filter(s => s.day !== day))
    } else {
      setSchedule([...schedule, { day, startTime: '09:00', endTime: '17:00' }])
    }
  }

  const updateDayTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(schedule.map(s => s.day === day ? { ...s, [field]: value } : s))
  }

  return (
    <div className="space-y-6">

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Doctors</h1>
          <p className="text-gray-400 text-sm mt-1">Manage doctor profiles and schedules</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditDoctor(null)
            setForm(emptyForm)
            setFormErrors({})
          }}
          className="btn-primary"
        >
          Add Doctor
        </button>
      </div>

      {/* add/edit modal */}
      {showForm && (
        <Modal
          title={editDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          onClose={resetForm}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select className="input" value={form.specialization}
                onChange={e => setForm({ ...form, specialization: e.target.value })}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.specialization && <p className="text-red-500 text-xs mt-1">{formErrors.specialization}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input className="input" value={form.qualification}
                onChange={e => setForm({ ...form, qualification: e.target.value })} />
              {formErrors.qualification && <p className="text-red-500 text-xs mt-1">{formErrors.qualification}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input type="number" className="input" value={form.experience}
                onChange={e => setForm({ ...form, experience: e.target.value })} />
              {formErrors.experience && <p className="text-red-500 text-xs mt-1">{formErrors.experience}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
              <input type="number" className="input" value={form.consultationFee}
                onChange={e => setForm({ ...form, consultationFee: e.target.value })} />
              {formErrors.consultationFee && <p className="text-red-500 text-xs mt-1">{formErrors.consultationFee}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration</label>
              <select className="input" value={form.slotDuration}
                onChange={e => setForm({ ...form, slotDuration: e.target.value })}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea className="input resize-none" rows={3} value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isAvailable" checked={form.isAvailable}
                onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-4 h-4 accent-teal-600" />
              <label htmlFor="isAvailable" className="text-sm text-gray-700">
                Available for appointments
              </label>
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={creating || updating} className="btn-primary">
                {creating || updating ? 'Saving...' : editDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* schedule modal */}
      {scheduleDoctor && (
        <Modal
          title={`Schedule — ${scheduleDoctor.name}`}
          onClose={() => setScheduleDoctor(null)}
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration</label>
            <select className="input w-44" value={slotDuration}
              onChange={e => setSlotDuration(Number(e.target.value))}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="space-y-2">
            {DAYS.map(day => {
              const daySchedule = schedule.find(s => s.day === day)
              const isActive = !!daySchedule
              return (
                <div key={day} className={`flex flex-wrap items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive ? 'bg-teal-50' : 'bg-gray-50'
                }`}>
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-28 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                  {isActive && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From</span>
                        <input type="time" value={daySchedule.startTime}
                          onChange={e => updateDayTime(day, 'startTime', e.target.value)}
                          className="input w-36 py-1.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To</span>
                        <input type="time" value={daySchedule.endTime}
                          onChange={e => updateDayTime(day, 'endTime', e.target.value)}
                          className="input w-36 py-1.5" />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => saveSchedule({ id: scheduleDoctor._id, data: { schedule, slotDuration } })}
              disabled={savingSchedule}
              className="btn-primary"
            >
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </button>
            <button onClick={() => setScheduleDoctor(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* delete modal */}
      {deleteConfirm && (
        <Modal title="Delete Doctor" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-500 text-sm mb-6">
            Are you sure you want to delete this doctor? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => deleteDoctor(deleteConfirm)} className="btn-danger flex-1">
              Delete
            </button>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {/* mobile cards */}
      {!isLoading && doctors && doctors.length > 0 && (
        <>
          <div className="sm:hidden space-y-3">
            {doctors.map(doctor => (
              <div key={doctor._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 text-sm font-semibold">
                        {doctor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{doctor.name}</div>
                      <div className="text-xs text-teal-600">{doctor.specialization}</div>
                      <div className="text-xs text-gray-400">
                        {doctor.experience} yrs · ₹{doctor.consultationFee}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    doctor.isAvailable ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {doctor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => handleSchedule(doctor)}
                    className="text-xs text-teal-600 font-medium">Schedule</button>
                  <button onClick={() => handleEdit(doctor)}
                    className="text-xs text-blue-600 font-medium">Edit</button>
                  <button onClick={() => setDeleteConfirm(doctor._id)}
                    className="text-xs text-red-500 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* desktop table */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Doctor</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Specialization</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Experience</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Fee</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(doctor => (
                    <tr key={doctor._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                            <span className="text-teal-700 text-xs font-semibold">
                              {doctor.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{doctor.name}</div>
                            <div className="text-xs text-gray-400">{doctor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialization}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doctor.experience} yrs</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{doctor.consultationFee}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          doctor.isAvailable
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {doctor.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleSchedule(doctor)}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                            Schedule
                          </button>
                          <button onClick={() => handleEdit(doctor)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(doctor._id)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* empty */}
      {!isLoading && doctors?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <h3 className="text-gray-900 font-medium">No doctors yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add your first doctor to get started</p>
        </div>
      )}

    </div>
  )
}

export default DoctorManagement