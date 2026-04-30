import mongoose, { Document, Schema } from 'mongoose'

export interface ISchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  startTime: string
  endTime: string
}

export interface IDoctor extends Document {
  name: string
  email: string
  specialization: string
  qualification: string
  experience: number
  phone: string
  bio: string
  profileImage: string
  schedule: ISchedule[]
  slotDuration: number
  consultationFee: number
  isAvailable: boolean
}

const ScheduleSchema = new Schema<ISchedule>({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
})

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experience: { type: Number, required: true },
    phone: { type: String, required: true },
    bio: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    schedule: [ScheduleSchema],
    slotDuration: { type: Number, default: 30 },
    consultationFee: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model<IDoctor>('Doctor', DoctorSchema)