import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Doctor Booking API running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app