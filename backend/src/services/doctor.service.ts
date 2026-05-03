import Doctor from '../models/Doctor'
import { CreateDoctorInput, UpdateDoctorInput, UpdateScheduleInput } from '../validators/doctor.validator'
import createError from '../utils/AppError'
import Slot from '../models/Slot'
import mongoose from 'mongoose'
import { getIO } from '../config/socket'

export const getAllDoctors = async (specialization?: string, isAvailable?: boolean) => {
  const filter: any = {}
  if (specialization) filter.specialization = { $regex: specialization, $options: 'i' }
  if (isAvailable !== undefined) filter.isAvailable = isAvailable
  return await Doctor.find(filter).select('-schedule')
}
export const getAvailableSlots = async (id: string, date: string, userId?: string) => {
  const doctor = await Doctor.findById(id)
  if (!doctor) throw createError('Doctor not found', 404)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(date) < today) throw createError('Cannot book slots for past dates', 400)

  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
  const schedule = doctor.schedule.find(s => s.day === day)
  if (!schedule) throw createError(`Doctor not available on ${day}`, 400)

  // generate slots if not exists
  const existingSlots = await Slot.find({ doctor: id, date })
  if (existingSlots.length === 0) {
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
  }

  const now = new Date()

  return await Slot.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(id),
        date,
        isBooked: false,
      }
    },
    {
      $addFields: {
        // true if locked by someone and lock not expired
        isLocked: {
          $and: [
            { $ne: ['$lockedBy', null] },
            { $ne: ['$lockedUntil', null] },
            { $gt: ['$lockedUntil', now] },
          ]
        },
        // true if locked by current user
        isLockedByMe: {
          $and: [
            { $ne: ['$lockedBy', null] },
            { $eq: ['$lockedBy', userId ? new mongoose.Types.ObjectId(userId) : null] },
            { $gt: ['$lockedUntil', now] },
          ]
        },
      }
    },
    {
      $project: {
        _id: 1,
        doctor: 1,
        date: 1,
        day: 1,
        startTime: 1,
        endTime: 1,
        isBooked: 1,
        isLocked: 1,
        isLockedByMe: 1,
      }
    },
    {
      $sort: { startTime: 1 }
    }
  ])
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
export const lockSlot = async (
  slotId: string,
  userId: string,
  doctorId: string,
  date: string
) => {
  const now = new Date()
  const lockExpiry = new Date(now.getTime() + 2 * 60 * 1000)

  const userObjectId = new mongoose.Types.ObjectId(userId)
  
  // ✅ 1. Find previously locked slots
  const previousSlots = await Slot.find({
    doctor: doctorId,
    date,
    lockedBy: userObjectId,
  })

  // ✅ 2. Unlock them
  await Slot.updateMany(
    {
      doctor: doctorId,
      date,
      lockedBy: userObjectId,
    },
    {
      lockedBy: null,
      lockedUntil: null,
    }
  )

  const io = getIO()

  // ✅ 3. Emit unlock for old slots
  previousSlots.forEach((s) => {
    if (s._id.toString() !== slotId) {
      io.to(`doctor:${doctorId}`).emit('slot:unlocked', {
        slotId: s._id,
        date,
      })
    }
  })

  // ✅ 4. Lock new slot
  const slot = await Slot.findOneAndUpdate(
    {
      _id: slotId,
      isBooked: false,
      $or: [
        { lockedBy: null },
        { lockedUntil: { $lt: now } },
        { lockedBy: userObjectId },
      ],
    },
    {
      lockedBy: userObjectId,
      lockedUntil: lockExpiry,
    },
    { new: true }
  )

  if (!slot) throw createError('Slot is already locked or booked', 400)

  // ✅ 5. Emit new lock
  io.to(`doctor:${doctorId}`).emit('slot:locked', {
    slotId,
    userId,
    date,
  })

  return slot
}
export const unlockSlot = async (slotId: string, userId: string) => {
  const slot = await Slot.findOneAndUpdate(
    {
      _id: slotId,
      lockedBy: new mongoose.Types.ObjectId(userId),
    },
    {
      lockedBy: null,
      lockedUntil: null,
    },
    { new: true }
  )

  if (!slot) return
  
  const io = getIO()
  io.to(`doctor:${slot.doctor}`).emit('slot:unlocked', {
    slotId,
    date: slot.date,
  })

  return slot
}