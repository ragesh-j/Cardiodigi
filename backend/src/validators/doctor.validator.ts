import { z } from 'zod'

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

const slotSchema = z.object({
  startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  isBooked: z.boolean().default(false),
  bookedBy: z.string().optional(),
})

const scheduleSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
})

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().min(1, 'Email is required').regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'),
    specialization: z.string().min(1, 'Specialization is required'),
    qualification: z.string().min(1, 'Qualification is required'),
    experience: z.number().min(0, 'Experience is required'),
    phone: z.string().min(1, 'Phone is required').regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
    bio: z.string().optional(),
    profileImage: z.string().optional(),
    schedule: z.array(scheduleSchema).default([]),
    slotDuration: z.number().min(15).max(60).default(30),
    consultationFee: z.number().min(0, 'Consultation fee is required'),
    isAvailable: z.boolean().default(true),
  }),
})

export const updateDoctorSchema = z.object({
  body: createDoctorSchema.shape.body.partial(),
})

export const updateScheduleSchema = z.object({
  body: z.object({
    schedule: z.array(scheduleSchema),
    slotDuration: z.number().min(15).max(60).optional(),
  }),
})

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body']
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body']
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body']