import { Router } from 'express'
import {
  book,
  getMyBookings,
  cancel,
  getAll,
  updateStatus,
  getOne,
  dashboard,
} from '../contollers/appointment.controller'
import { protect, adminOnly } from '../middleware/authMiddleware'
import { validate } from '../middleware/validate'
import { bookAppointmentSchema, updateStatusSchema } from '../validators/appointment.validator'

const router = Router()
router.post('/', protect, validate(bookAppointmentSchema), book)
router.get('/my', protect, getMyBookings)                           
router.get('/admin/dashboard', protect, adminOnly, dashboard)       

router.get('/', protect, adminOnly, getAll)
router.put('/:id/cancel', protect, cancel)
router.put('/:id/status', protect, adminOnly, validate(updateStatusSchema), updateStatus)
router.get('/:id', protect, getOne)  

export default router