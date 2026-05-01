import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-teal-600 font-medium'
      : 'text-gray-500 hover:text-gray-900'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* logo */}
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="font-semibold text-slate-900">CardioBook</span>
        </Link>

        {/* nav links */}
        <div className="flex items-center gap-8">
          {!isAdmin ? (
            <>
              <Link to="/" className={`text-sm transition-colors ${isActive('/')}`}>
                Doctors
              </Link>
              <Link to="/appointments" className={`text-sm transition-colors ${isActive('/appointments')}`}>
                My Appointments
              </Link>
            </>
          ) : (
            <>
              <Link to="/admin" className={`text-sm transition-colors ${isActive('/admin')}`}>
                Dashboard
              </Link>
              <Link to="/admin/doctors" className={`text-sm transition-colors ${isActive('/admin/doctors')}`}>
                Doctors
              </Link>
              <Link to="/admin/appointments" className={`text-sm transition-colors ${isActive('/admin/appointments')}`}>
                Appointments
              </Link>
            </>
          )}
        </div>

        {/* user */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-700 text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar