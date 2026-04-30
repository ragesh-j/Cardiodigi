import { Router } from 'express'
import { register, login, getMe } from '../contollers/auth.contoller'
import { protect } from '../middleware/authMiddleware'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema } from '../validators/auth.validator'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', protect, getMe)

export default router