import { Router } from 'express'
import {
  getDoctors,
  getDoctor,
  addDoctor,
  editDoctor,
  removeDoctor,
  setSchedule,
  getAvailableSlots,
  lockSlotRoute,
  unlockSlotRoute,
} from '../contollers/doctor.controller'
import { protect, adminOnly } from '../middleware/authMiddleware'
import { validate } from '../middleware/validate'
import { createDoctorSchema, updateDoctorSchema, updateScheduleSchema } from '../validators/doctor.validator'

const router = Router()

// public
router.get('/', getDoctors)
router.get('/:id/slots', getAvailableSlots)
router.get('/:id', getDoctor)
router.post('/:id/slots/:slotId/lock', protect, lockSlotRoute)
router.delete('/:id/slots/:slotId/lock', protect, unlockSlotRoute)
// admin only
router.post('/', protect, adminOnly, validate(createDoctorSchema), addDoctor)
router.put('/:id', protect, adminOnly, validate(updateDoctorSchema), editDoctor)
router.delete('/:id', protect, adminOnly, removeDoctor)
router.put('/:id/schedule', protect, adminOnly, validate(updateScheduleSchema), setSchedule)

export default router