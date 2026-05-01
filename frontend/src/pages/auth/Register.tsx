import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const Register = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.data)
      navigate('/')
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {}
        err.response.data.errors.forEach(({ field, message }: { field: string, message: string }) => {
          fieldErrors[field] = message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: err.response?.data?.message || 'Registration failed' })
      }
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
          <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight mb-3">
            Start your<br />
            <span className="text-teal-400">health journey.</span>
          </h1>
          <p className="text-slate-400 text-base">
            Join thousands of patients who trust CardioBook.
          </p>
        </div>
        <p className="text-slate-600 text-sm">© 2026 CardioBook. All rights reserved.</p>
      </div>

      {/* right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* mobile logo */}
          <div className="flex items-center gap-3 mb-5 lg:hidden">
            <div className="w-9 h-9 bg-teal-400 rounded-xl flex items-center justify-center">
              <span className="text-slate-900 font-bold">C</span>
            </div>
            <span className="text-white font-semibold">CardioBook</span>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-0.5">Create account</h2>
            <p className="text-gray-400 text-sm mb-5">Fill in your details to get started</p>

            {errors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  required
                  className="input"
                />
                {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="input"
                />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                  className="input"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars, uppercase & number"
                  required
                  className="input"
                />
                {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register