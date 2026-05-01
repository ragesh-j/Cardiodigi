import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'
import authRoutes from './routes/auth.routes'
import doctorRoutes from './routes/doctor.routes'
import appointmentRoutes from './routes/appointment.routes'
import { errorHandler, notFound } from './middleware/errorHandler'
import { initSocket } from './config/socket'
import { createServer } from 'http'
dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3000
const server = createServer(app)
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.json({ message: 'Doctor Booking API running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)

app.use(notFound)
app.use(errorHandler)
initSocket(server)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app