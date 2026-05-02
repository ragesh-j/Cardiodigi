import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsApi } from '../../api/appointment.api'
import { Link } from 'react-router-dom'

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="card p-6">
    <div className={`text-3xl font-semibold ${color}`}>{value}</div>
    <div className="text-gray-400 text-sm mt-1">{label}</div>
  </div>
)

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStatsApi,
  })

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 h-24 bg-gray-100" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your clinic</p>
        </div>
        <Link to="/admin/doctors" className="btn-primary">
          Add Doctor
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Doctors"
          value={stats?.totalDoctors || 0}
          color="text-teal-600"
        />
        <StatCard
          label="Total Appointments"
          value={stats?.totalAppointments || 0}
          color="text-slate-900"
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmed || 0}
          color="text-blue-600"
        />
        <StatCard
          label="Completed"
          value={stats?.completed || 0}
          color="text-green-600"
        />
      </div>

      {/* second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cancelled"
          value={stats?.cancelled || 0}
          color="text-red-500"
        />
      </div>

      {/* recent appointments */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900">Recent Appointments</h2>
          <Link
            to="/admin/appointments"
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            View all →
          </Link>
        </div>

        {!stats?.recentAppointments?.length && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No appointments yet</p>
          </div>
        )}

        {stats?.recentAppointments && stats.recentAppointments.length > 0 && (
          <div className="space-y-3">
            {stats.recentAppointments.map((apt: any) => (
              <div key={apt._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                    <span className="text-teal-700 text-xs font-semibold">
                      {apt.patient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{apt.patient.name}</div>
                    <div className="text-xs text-gray-400">{apt.doctor.name} · {apt.doctor.specialization}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{apt.date}</div>
                  <div className="text-xs text-gray-400">{apt.slotStartTime}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard