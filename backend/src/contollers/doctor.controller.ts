import { Request, Response, NextFunction } from 'express'
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  getAvailableSlots as getAvailableSlotsService, 
  updateDoctor,
  deleteDoctor,
  updateSchedule,
} from '../services/doctor.service'

export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { specialization, isAvailable } = req.query
    const doctors = await getAllDoctors(
      specialization as string,
      isAvailable !== undefined ? isAvailable === 'true' : undefined
    )
    res.status(200).json({ success: true, data: doctors })
  } catch (error) {
    next(error)
  }
}


export const getDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await getDoctorById(req.params.id as string)
    res.status(200).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
}
export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query
    if (!date) {
      res.status(400).json({ success: false, message: 'Date is required' })
      return
    }
    const slots = await getAvailableSlotsService(req.params.id as string, date as string)
    res.status(200).json({ success: true, data: slots })
  } catch (error) {
    next(error)
  }
}
export const addDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await createDoctor(req.body)
    res.status(201).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
}

export const editDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await updateDoctor(req.params.id as string, req.body)
    res.status(200).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
}

export const removeDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteDoctor(req.params.id as string)
    res.status(200).json({ success: true, message: 'Doctor deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await updateSchedule(req.params.id as string, req.body)
    res.status(200).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
}