import mongoose, { Document, Schema } from 'mongoose'

export interface ISlot extends Document {
  doctor: mongoose.Types.ObjectId
  date: string
  day: string
  startTime: string
  endTime: string
  isBooked: boolean
  bookedBy?: mongoose.Types.ObjectId
  lockedBy?: mongoose.Types.ObjectId
  lockedUntil?: Date
}

const SlotSchema = new Schema<ISlot>(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
)

// prevents double booking at DB level
SlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true })

export default mongoose.model<ISlot>('Slot', SlotSchema)