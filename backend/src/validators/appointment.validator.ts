import { z } from 'zod'

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor is required'),
    slotId: z.string().min(1, 'Slot is required'),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().optional(),
  }),
})

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'cancelled', 'completed']),
  }),
})

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>['body']
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body']