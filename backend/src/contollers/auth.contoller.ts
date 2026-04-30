import { Request, Response, NextFunction } from 'express'
import { registerUser, loginUser, getProfile } from '../services/auth.service'
import { AuthRequest } from '../middleware/authMiddleware'

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registerUser(req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await loginUser(req.body)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getProfile(req.user?._id.toString() as string)
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}