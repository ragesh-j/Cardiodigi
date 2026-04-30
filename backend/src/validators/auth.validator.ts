import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),

    email: z
      .email('Please enter a valid email'),

    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),

    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z
      .email('Please enter a valid email'),

    password: z
      .string()
      .min(1, 'Password is required'),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']