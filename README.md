# Doctor Appointment Booking System

A production-ready full-stack doctor appointment booking system built with the MERN stack and TypeScript.

---

## Overview & Architecture

The system allows patients to browse doctors, view real-time available slots, and book appointments. Admins can manage doctors, schedules, and appointment statuses from a dedicated dashboard.

**Architecture follows a clean layered pattern:**

```
Client (React SPA)
    ↕ REST API (Axios)         ↕ WebSocket (Socket.io)
Express Server
    └── Routes → Controllers → Services → Models (Mongoose)
                                              ↕
                                         MongoDB Atlas
```

- **Backend** is a RESTful API built with Express and TypeScript, following a routes → controllers → services → models separation. JWT middleware handles authentication and role-based access control.
- **Frontend** is a React SPA where TanStack Query manages all server state and caching. Socket.io client keeps the slot grid live in real time without polling.
- **Database** uses MongoDB with transactions for atomic operations across collections. Slots are a separate collection to support date-specific bookings.
- **Real-time** updates are room-based — each doctor has its own Socket.io room. Only users viewing that doctor's slots receive updates.

---

## Tech Stack

**Backend**
- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- Socket.io (real-time updates)
- JWT Authentication
- Zod (validation)
- Bcryptjs (password hashing)

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS v3
- TanStack Query v5
- Axios
- Socket.io Client
- React Router DOM

---

## Project Structure

```
Cardio/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # MongoDB connection
│   │   │   └── socket.ts          # Socket.io configuration
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── doctor.controller.ts
│   │   │   └── appointment.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT middleware + role-based access
│   │   │   ├── validate.ts        # Zod validation middleware
│   │   │   └── errorHandler.ts    # Global error handler
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Doctor.ts
│   │   │   ├── Slot.ts
│   │   │   └── Appointment.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── doctor.routes.ts
│   │   │   └── appointment.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── doctor.service.ts
│   │   │   └── appointment.service.ts
│   │   ├── utils/
│   │   │   ├── AppError.ts        # Custom error helper
│   │   │   ├── generateToken.ts   # JWT token generator
│   │   │   └── seed.ts            # Database seeder
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── doctor.validator.ts
│   │   │   └── appointment.validator.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   └── services/
    ├── package.json
    └── vite.config.ts
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Fill in your environment variables
# (see Environment Variables section)

# 5. Seed the database (creates admin user)
npm run seed

# 6. Start development server
npm run dev
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/doctor-booking
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

For MongoDB Atlas:
```env
MONGO_URI=mongodb://username:password@ac-xxxxx.mongodb.net:27017,ac-xxxxx.mongodb.net:27017/doctor-booking?ssl=true&replicaSet=atlas-xxxxx&authSource=admin&retryWrites=true&w=majority
```

---

## Default Admin Credentials

After running `npm run seed`:
```
Email:    admin@cardio.com
Password: Admin1234
```

---

## API Endpoints

### Auth Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new patient |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Protected | Get current user |

### Doctor Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/doctors` | Public | Get all doctors (with filters) |
| GET | `/api/doctors/:id` | Public | Get doctor profile |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Public | Get available slots for date |
| POST | `/api/doctors/:id/slots/:slotId/lock` | Protected | Lock a slot for 2 minutes |
| DELETE | `/api/doctors/:id/slots/:slotId/lock` | Protected | Explicitly unlock a slot |
| POST | `/api/doctors` | Admin | Add new doctor |
| PUT | `/api/doctors/:id` | Admin | Update doctor |
| DELETE | `/api/doctors/:id` | Admin | Delete doctor |
| PUT | `/api/doctors/:id/schedule` | Admin | Set doctor schedule |

### Appointment Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/appointments` | Patient | Book appointment |
| GET | `/api/appointments/my` | Patient | Get my appointments |
| PUT | `/api/appointments/:id/cancel` | Patient | Cancel appointment |
| GET | `/api/appointments/:id` | Protected | Get appointment details |
| GET | `/api/appointments` | Admin | Get all appointments |
| PUT | `/api/appointments/:id/status` | Admin | Update appointment status |
| GET | `/api/appointments/admin/dashboard` | Admin | Dashboard statistics |

### Query Parameters
```
GET /api/doctors?specialization=Cardiology
GET /api/doctors?isAvailable=true
GET /api/doctors?specialization=Cardiology&isAvailable=true
GET /api/doctors/:id/slots?date=2026-05-05
```

---

## Database Schema

### User
```
_id, name, email, password (hashed), role (patient/admin), phone, createdAt
```

### Doctor
```
_id, name, email, specialization, qualification, experience,
phone, bio, profileImage, schedule (embedded), slotDuration,
consultationFee, isAvailable, createdAt
```

### Schedule (embedded in Doctor)
```
day (Monday-Sunday), startTime (HH:MM), endTime (HH:MM)
```

### Slot
```
_id, doctor (ref), date (YYYY-MM-DD), day, startTime, endTime,
isBooked, bookedBy (ref), lockedBy (ref), lockedUntil (Date), createdAt
```

### Appointment
```
_id, patient (ref), doctor (ref), slotId (ref), date,
day, slotStartTime, slotEndTime, status (confirmed/cancelled/completed),
notes, createdAt
```

---

## Features

### Patient Side
- User registration and login with Zod validation
- Browse doctors with filters (specialization, availability)
- View detailed doctor profile
- View available time slots by date
- Slot locking with 2-minute countdown before booking
- Book appointments with atomic slot ownership check
- View and manage appointment history
- Cancel appointments

### Admin Side
- Dashboard with key metrics (total doctors, appointments by status)
- Add, update, delete doctor profiles
- Define doctor schedules and slot duration
- View all appointments
- Update appointment status (confirmed/cancelled/completed)

### Real-Time Features
- Socket.io integration for live slot updates across all connected users
- Slot locks appear instantly for other users when someone selects a slot
- Slot unlocks appear instantly when a user deselects, switches slots, changes date, or their lock expires
- Slot disappears instantly when booked
- Slot reappears instantly on cancellation
- Room-based updates scoped per doctor

---

## Design Decisions

### Separate Slot Collection
Slots are stored in a separate collection (not embedded in Doctor) to support date-specific bookings. This prevents a Monday booking from blocking all future Mondays.

### Slot Locking
Before booking, users lock a slot for 2 minutes. The lock is stored on the Slot document (`lockedBy`, `lockedUntil`). This gives the user time to review and confirm without the slot being taken. Locking a new slot atomically releases the previous one — no separate unlock call needed when switching.

### Lock Expiry
The frontend runs a `setTimeout` for exactly 2 minutes after a successful lock. On expiry, it calls the unlock API to release the slot on the server, clears local state, and invalidates the slot query. This ensures other users see the slot as available again even if the user never explicitly deselects.

### Atomic Slot Booking
Slot booking uses `findOneAndUpdate` with conditions `isBooked: false`, `lockedBy: patientId`, and `lockedUntil: { $gt: now }`. This ensures only the user who holds the lock can book it, and prevents double booking under concurrent requests.

### MongoDB Transactions
Booking and cancellation use MongoDB transactions to ensure atomicity across Slot and Appointment collections. Requires MongoDB replica set (Atlas supported by default).

### Unique Index on Slots
```
{ doctor: 1, date: 1, startTime: 1 } → unique
```
Provides double booking prevention at the database level as an additional safety net.

### Aggregation over Populate
All read operations use MongoDB aggregation pipeline instead of Mongoose populate for better performance at scale.

### Schedule as Embedded Array
Doctor schedules are embedded as an array (max 7 entries) since schedules are always fetched with doctor data and are doctor-specific.

### Zod Validation
Zod schemas are used for all API input validation. First error per field is returned to keep responses clean.

### Socket Responsibility Split
Sockets are used exclusively to notify **other** users of state changes. The acting user's own UI updates via local React state and TanStack Query cache — no refetch needed for the user performing the action. This avoids redundant round trips and keeps the UI responsive on slow networks.

---

## Production Considerations

- Replace local MongoDB with Atlas cluster for replica set support
- Add Redis caching for auth middleware to reduce DB calls per request
- Implement refresh token rotation for better security
- Add rate limiting (express-rate-limit)
- Add request logging (morgan)
- Move to date-based slot generation with TTL indexes for automatic cleanup

---

## Deployment

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project on Vercel
3. Set environment variables
4. Deploy

---

## Real-Time Events (Socket.io)

### Client → Server
```
join:doctor (doctorId)  → join room for doctor's slot updates
```

### Server → Client
```
slot:locked    → { slotId, userId, date }          emitted when a user locks a slot
slot:unlocked  → { slotId, date }                  emitted when a slot is released
slot:booked    → { doctorId, date, slotId, startTime, endTime, userId }
slot:cancelled → { doctorId, date, slotId, startTime, endTime }
```

---
