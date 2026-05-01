import mongoose, { Document, Schema } from 'mongoose'

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId
  doctor: mongoose.Types.ObjectId
  slotId: mongoose.Types.ObjectId
  date: string
  day: string
  slotStartTime: string
  slotEndTime: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes: string
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    slotStartTime: { type: String, required: true },
    slotEndTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema)