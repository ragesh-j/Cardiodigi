export interface User {
  _id: string
  name: string
  email: string
  role: 'patient' | 'admin'
  phone: string
  token: string
}

export interface Doctor {
  _id: string
  name: string
  email: string
  specialization: string
  qualification: string
  experience: number
  phone: string
  bio: string
  profileImage: string
  slotDuration: number
  consultationFee: number
  isAvailable: boolean
  schedule: Schedule[]
}

export interface Schedule {
  day: string
  startTime: string
  endTime: string
}

export interface Slot {
  _id: string
  doctor: string
  date: string
  day: string
  startTime: string
  endTime: string
  isBooked: boolean
}

export interface Appointment {
  _id: string
  patient: User
  doctor: Doctor
  slotId: string
  date: string
  day: string
  slotStartTime: string
  slotEndTime: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes: string
  createdAt: string
}

export interface DashboardStats {
  totalDoctors: number
  totalAppointments: number
  confirmed: number
  cancelled: number
  completed: number
  recentAppointments: Appointment[]
}