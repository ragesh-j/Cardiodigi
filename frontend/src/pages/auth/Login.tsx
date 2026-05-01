import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { validateLogin } from '../../utils/validations'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateLogin(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors({})
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.data)
      navigate(res.data.data.role === 'admin' ? '/admin' : '/')
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || 'Login failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex overflow-hidden">

      {/* left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">C</span>
          </div>
          <span className="text-white font-semibold text-lg">CardioBook</span>
        </div>
        <div>
          <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight mb-4">
            Your health,<br />
            <span className="text-teal-400">our priority.</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Book appointments with top cardiologists instantly.
          </p>
          <div className="mt-10 flex gap-6">
            <div className="bg-slate-800 rounded-2xl p-5 flex-1">
              <div className="text-3xl font-semibold text-white">50+</div>
              <div className="text-slate-400 text-sm mt-1">Specialists</div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-5 flex-1">
              <div className="text-3xl font-semibold text-white">1k+</div>
              <div className="text-slate-400 text-sm mt-1">Appointments</div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-5 flex-1">
              <div className="text-3xl font-semibold text-white">4.9</div>
              <div className="text-slate-400 text-sm mt-1">Rating</div>
            </div>
          </div>
        </div>
        <p className="text-slate-600 text-sm">© 2026 CardioBook. All rights reserved.</p>
      </div>

      {/* right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">C</span>
            </div>
            <span className="text-white font-semibold text-lg">CardioBook</span>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

            {errors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login