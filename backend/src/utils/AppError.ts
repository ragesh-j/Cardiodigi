import { AppError } from '../middleware/errorHandler'

const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  return error
}

export default createError