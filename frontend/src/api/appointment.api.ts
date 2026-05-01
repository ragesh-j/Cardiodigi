import api from './axios'
import type { Appointment, DashboardStats } from '../types'

export const bookAppointmentApi = async (data: {
  doctorId: string
  slotId: string
  date: string
  notes?: string
}): Promise<Appointment> => {
  const res = await api.post('/appointments', data)
  return res.data.data
}

export const getMyAppointmentsApi = async (): Promise<Appointment[]> => {
  const res = await api.get('/appointments/my')
  return res.data.data
}

export const cancelAppointmentApi = async (id: string): Promise<Appointment> => {
  const res = await api.put(`/appointments/${id}/cancel`)
  return res.data.data
}

export const getAllAppointmentsApi = async (): Promise<Appointment[]> => {
  const res = await api.get('/appointments')
  return res.data.data
}

export const updateAppointmentStatusApi = async (
  id: string,
  status: string
): Promise<Appointment> => {
  const res = await api.put(`/appointments/${id}/status`, { status })
  return res.data.data
}

export const getDashboardStatsApi = async (): Promise<DashboardStats> => {
  const res = await api.get('/appointments/admin/dashboard')
  return res.data.data
}