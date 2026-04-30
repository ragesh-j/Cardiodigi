import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User'

export interface AuthRequest extends Request {
  user?: IUser
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string }
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access only' })
    return
  }
  next()
}