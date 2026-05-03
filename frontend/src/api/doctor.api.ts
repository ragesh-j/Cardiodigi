import api from './axios'
import type { Doctor, Slot } from '../types'

export const getDoctorsApi = async (params?: {
  specialization?: string
  isAvailable?: boolean
}): Promise<Doctor[]> => {
  const res = await api.get('/doctors', { params })
  return res.data.data
}

export const getDoctorApi = async (id: string): Promise<Doctor> => {
  const res = await api.get(`/doctors/${id}`)
  return res.data.data
}

export const getSlotsApi = async (id: string, date: string): Promise<Slot[]> => {
  const res = await api.get(`/doctors/${id}/slots`, { params: { date } })
  return res.data.data
}

export const createDoctorApi = async (data: Partial<Doctor>): Promise<Doctor> => {
  const res = await api.post('/doctors', data)
  return res.data.data
}

export const updateDoctorApi = async (id: string, data: Partial<Doctor>): Promise<Doctor> => {
  const res = await api.put(`/doctors/${id}`, data)
  return res.data.data
}

export const deleteDoctorApi = async (id: string): Promise<void> => {
  await api.delete(`/doctors/${id}`)
}

export const updateScheduleApi = async (id: string, data: {
  slotDuration: number
  schedule: { day: string, startTime: string, endTime: string }[]
}): Promise<Doctor> => {
  const res = await api.put(`/doctors/${id}/schedule`, data)
  return res.data.data
}
export const lockSlotApi = async (doctorId: string, slotId: string, date: string) => {
  const res = await api.post(`/doctors/${doctorId}/slots/${slotId}/lock`, { date })
  return res.data.data
}

export const unlockSlotApi = async (doctorId: string, slotId: string) => {
  await api.delete(`/doctors/${doctorId}/slots/${slotId}/lock`)
}