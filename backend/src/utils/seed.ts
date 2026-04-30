import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import User from '../models/User'

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string)
    console.log('MongoDB connected')

    const admin = await User.findOne({ role: 'admin' })
    if (!admin) {
      await User.create({
        name: 'Admin',
        email: 'admin@cardio.com',
        password: 'Admin1234',
        phone: '9876543210',
        role: 'admin',
      })
      console.log('✓ Admin created')
      console.log('  Email: admin@cardio.com')
      console.log('  Password: Admin1234')
    } else {
      console.log('Admin already exists')
    }

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()