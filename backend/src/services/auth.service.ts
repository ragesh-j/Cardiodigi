import User from '../models/User'
import generateToken from '../utils/generateToken'
import { RegisterInput, LoginInput } from '../validators/auth.validator'
import createError from '../utils/AppError'

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await User.findOne({ email: data.email })
  if (existingUser) throw createError('User already exists', 400)

  const user = await User.create(data)
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user._id.toString()),
  }
}

export const loginUser = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email })
  if (!user) throw createError('Invalid credentials', 401)

  const isMatch = await user.comparePassword(data.password)
  if (!isMatch) throw createError('Invalid credentials', 401)

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user._id.toString()),
  }
}

export const getProfile = async (id: string) => {
  const user = await User.findById(id).select('-password')
  if (!user) throw createError('User not found', 404)
  return user
}