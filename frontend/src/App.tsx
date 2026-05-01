import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedLayout from './layouts/ProtectedLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import DoctorList from './pages/patient/DoctorList'
import DoctorProfile from './pages/patient/DoctorProfile'
import BookAppointment from './pages/patient/BookAppointment'
import MyAppointments from './pages/patient/MyAppointments'
import Dashboard from './pages/admin/Dashboard'
import DoctorManagement from './pages/admin/DoctorManagement'
import AppointmentManagement from './pages/admin/AppointmentManagement'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DoctorList />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/doctors/:id/book" element={<BookAppointment />} />
          <Route path="/appointments" element={<MyAppointments />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/doctors" element={<DoctorManagement />} />
          <Route path="/admin/appointments" element={<AppointmentManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App