import { Response, NextFunction } from 'express'
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentById,
  getDashboardStats,
} from '../services/appointment.service'
import { AuthRequest } from '../middleware/authMiddleware'

export const book = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await bookAppointment(req.user?._id.toString() as string, req.body)
    res.status(201).json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
}

export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointments = await getMyAppointments(req.user?._id.toString() as string)
    res.status(200).json({ success: true, data: appointments })
  } catch (error) {
    next(error)
  }
}

export const cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await cancelAppointment(
      req.user?._id.toString() as string,
      req.params.id as string
    )
    res.status(200).json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
}

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointments = await getAllAppointments()
    res.status(200).json({ success: true, data: appointments })
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await updateAppointmentStatus(req.params.id as string, req.body.status)
    res.status(200).json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
}

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await getAppointmentById(req.params.id as string)
    res.status(200).json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
}

export const dashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await getDashboardStats()
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    next(error)
  }
}