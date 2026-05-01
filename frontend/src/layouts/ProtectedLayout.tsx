import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/NavBar'

const ProtectedLayout = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}

export default ProtectedLayout