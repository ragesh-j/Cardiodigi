import Doctor from '../models/Doctor'
import { CreateDoctorInput, UpdateDoctorInput, UpdateScheduleInput } from '../validators/doctor.validator'
import createError from '../utils/AppError'
import Slot from '../models/Slot'

export const getAllDoctors = async (specialization?: string, isAvailable?: boolean) => {
  const filter: any = {}
  if (specialization) filter.specialization = { $regex: specialization, $options: 'i' }
  if (isAvailable !== undefined) filter.isAvailable = isAvailable
  return await Doctor.find(filter).select('-schedule')
}
export const getAvailableSlots = async (id: string, date: string) => {
  const doctor = await Doctor.findById(id)
  if (!doctor) throw createError('Doctor not found', 404)

  // check past date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(date) < today) throw createError('Cannot book slots for past dates', 400)

  // get day from date
  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })

  // check schedule exists for that day
  const schedule = doctor.schedule.find(s => s.day === day)
  if (!schedule) throw createError(`Doctor not available on ${day}`, 400)

  // check if slots already generated
  const existingSlots = await Slot.find({ doctor: id, date })
  if (existingSlots.length > 0) {
    return existingSlots.filter(s => !s.isBooked)
  }

  // generate and save slots
  const generatedSlots = generateSlots(schedule.startTime, schedule.endTime, doctor.slotDuration)
  const slotsToSave = generatedSlots.map(slot => ({
    doctor: id,
    date,
    day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isBooked: false,
  }))

  await Slot.insertMany(slotsToSave)
  return await Slot.find({ doctor: id, date, isBooked: false })
}
export const getDoctorById = async (id: string) => {
  const doctor = await Doctor.findById(id)
  if (!doctor) throw createError('Doctor not found', 404)
  return doctor
}

export const createDoctor = async (data: CreateDoctorInput) => {
  const existing = await Doctor.findOne({ email: data.email })
  if (existing) throw createError('Doctor already exists', 400)
  return await Doctor.create(data)
}

export const updateDoctor = async (id: string, data: UpdateDoctorInput) => {
  const doctor = await Doctor.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!doctor) throw createError('Doctor not found', 404)
  return doctor
}

export const deleteDoctor = async (id: string) => {
  const doctor = await Doctor.findByIdAndDelete(id)
  if (!doctor) throw createError('Doctor not found', 404)
  return doctor
}

export const updateSchedule = async (id: string, data: UpdateScheduleInput) => {
  const doctor = await Doctor.findById(id)
  if (!doctor) throw createError('Doctor not found', 404)
  doctor.schedule = data.schedule as any
  if (data.slotDuration) doctor.slotDuration = data.slotDuration
  await doctor.save()
  return doctor
}

// slot generation logic
const generateSlots = (startTime: string, endTime: string, duration: number) => {
  const slots = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  let current = startHour * 60 + startMin
  const end = endHour * 60 + endMin

  while (current + duration <= end) {
    const startH = Math.floor(current / 60).toString().padStart(2, '0')
    const startM = (current % 60).toString().padStart(2, '0')
    const endH = Math.floor((current + duration) / 60).toString().padStart(2, '0')
    const endM = ((current + duration) % 60).toString().padStart(2, '0')

    slots.push({
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      isBooked: false,
    })

    current += duration
  }

  return slots
}