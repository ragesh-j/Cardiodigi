import mongoose from 'mongoose'
import Appointment from '../models/Appointment'
import Slot from '../models/Slot'
import Doctor from '../models/Doctor'
import createError from '../utils/AppError'
import { BookAppointmentInput } from '../validators/appointment.validator'
import { getIO } from '../config/socket'

export const bookAppointment = async (patientId: string, data: BookAppointmentInput) => {
  const { doctorId, slotId, date, notes } = data

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const doctor = await Doctor.findById(doctorId).session(session)
    if (!doctor) throw createError('Doctor not found', 404)
    const now = new Date()
    // atomic slot booking
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        doctor: doctorId,
        date,
        isBooked: false,
        lockedBy: new mongoose.Types.ObjectId(patientId),
        lockedUntil: { $gt: now },
      },
      {
        isBooked: true,
        bookedBy: patientId,
        lockedBy: null,
        lockedUntil: null,
      },
      { new: true, session }
    )

    if (!slot) throw createError('Slot is already booked', 400)

    const [appointment] = await Appointment.create(
      [
        {
          patient: patientId,
          doctor: doctorId,
          slotId: slot._id,
          date,
          day: slot.day,
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime,
          notes: notes || '',
          status: 'confirmed',
        },
      ],
      { session }
    )

    await session.commitTransaction()

    // emit after commit
    const io = getIO()
    io.to(`doctor:${doctorId}`).emit('slot:booked', {
      doctorId,
      date,
      slotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      userId: patientId
    })

    // aggregation for response
    const result = await Appointment.aggregate([
      {
        $match: { _id: appointment._id }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patient',
          pipeline: [
            { $project: { name: 1, email: 1, phone: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctor',
          pipeline: [
            { $project: { name: 1, specialization: 1, consultationFee: 1 } }
          ]
        }
      },
      { $unwind: '$patient' },
      { $unwind: '$doctor' },
    ])

    return result[0]

  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// transaction needed - 2 operations must succeed together
export const cancelAppointment = async (patientId: string, appointmentId: string) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patientId,
    }).session(session)

    if (!appointment) throw createError('Appointment not found', 404)
    if (appointment.status === 'cancelled') throw createError('Appointment already cancelled', 400)
    if (appointment.status === 'completed') throw createError('Cannot cancel completed appointment', 400)

    await Slot.findByIdAndUpdate(
      appointment.slotId,
      { isBooked: false, bookedBy: null },
      { session }
    )

    appointment.status = 'cancelled'
    await appointment.save({ session })

    await session.commitTransaction()

    const io = getIO()
    io.to(`doctor:${appointment.doctor}`).emit('slot:cancelled', {
      doctorId: appointment.doctor,
      date: appointment.date,
      slotId: appointment.slotId,
      startTime: appointment.slotStartTime,
      endTime: appointment.slotEndTime,
    })

    return appointment

  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// no transaction needed - single read operation
export const getMyAppointments = async (patientId: string) => {
  return await Appointment.aggregate([
    {
      $match: { patient: new mongoose.Types.ObjectId(patientId) }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctor',
        pipeline: [
          { $project: { name: 1, specialization: 1, consultationFee: 1, profileImage: 1 } }
        ]
      }
    },
    { $unwind: '$doctor' },
    { $sort: { createdAt: -1 } }
  ])
}

// no transaction needed - single read operation
export const getAllAppointments = async () => {
  return await Appointment.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patient',
        pipeline: [
          { $project: { name: 1, email: 1, phone: 1 } }
        ]
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctor',
        pipeline: [
          { $project: { name: 1, specialization: 1 } }
        ]
      }
    },
    { $unwind: '$patient' },
    { $unwind: '$doctor' },
    { $sort: { createdAt: -1 } }
  ])
}

// no transaction needed - single read operation
export const getAppointmentById = async (id: string) => {
  const result = await Appointment.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patient',
        pipeline: [
          { $project: { name: 1, email: 1, phone: 1 } }
        ]
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctor',
        pipeline: [
          { $project: { name: 1, specialization: 1, consultationFee: 1 } }
        ]
      }
    },
    { $unwind: '$patient' },
    { $unwind: '$doctor' },
  ])

  if (!result[0]) throw createError('Appointment not found', 404)
  return result[0]
}

// no transaction needed - single write operation
export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { status },
    { new: true }
  )
  if (!appointment) throw createError('Appointment not found', 404)

  // return with aggregation
  return await getAppointmentById(appointmentId)
}

// no transaction needed - read only
export const getDashboardStats = async () => {
  const [stats] = await Appointment.aggregate([
    {
      $facet: {
        totalAppointments: [{ $count: 'count' }],
        confirmed: [{ $match: { status: 'confirmed' } }, { $count: 'count' }],
        cancelled: [{ $match: { status: 'cancelled' } }, { $count: 'count' }],
        completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
        recentAppointments: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'users',
              localField: 'patient',
              foreignField: '_id',
              as: 'patient',
              pipeline: [{ $project: { name: 1, email: 1 } }]
            }
          },
          {
            $lookup: {
              from: 'doctors',
              localField: 'doctor',
              foreignField: '_id',
              as: 'doctor',
              pipeline: [{ $project: { name: 1, specialization: 1 } }]
            }
          },
          { $unwind: '$patient' },
          { $unwind: '$doctor' },
        ]
      }
    },
    {
      $project: {
        totalAppointments: { $ifNull: [{ $arrayElemAt: ['$totalAppointments.count', 0] }, 0] },
        confirmed: { $ifNull: [{ $arrayElemAt: ['$confirmed.count', 0] }, 0] },
        cancelled: { $ifNull: [{ $arrayElemAt: ['$cancelled.count', 0] }, 0] },
        completed: { $ifNull: [{ $arrayElemAt: ['$completed.count', 0] }, 0] },
        recentAppointments: 1,
      }
    }
  ])

  const totalDoctors = await Doctor.countDocuments()

  return {
    totalDoctors,
    ...stats,
  }
}
