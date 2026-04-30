import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'
import authRoutes from './routes/auth.routes'
import { errorHandler, notFound } from './middleware/errorHandler'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.json({ message: 'Doctor Booking API running' })
})

app.use('/api/auth', authRoutes)


app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app