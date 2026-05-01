import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDoctorApi } from '../../api/doctor.api'

const DoctorProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctorApi(id!),
  })

  if (isLoading) return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="card p-6">
        <div className="flex gap-5">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )

  if (error || !doctor) return (
    <div className="text-center py-12">
      <p className="text-red-500">Failed to load doctor profile.</p>
      <button onClick={() => navigate('/')} className="btn-secondary mt-4">
        Go Back
      </button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Back to Doctors
      </button>

      {/* profile card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={doctor.name}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <span className="text-teal-700 text-2xl font-semibold">
                {doctor.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{doctor.name}</h1>
                <p className="text-teal-600 font-medium">{doctor.specialization}</p>
                <p className="text-gray-500 text-sm mt-0.5">{doctor.qualification}</p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full ${
                doctor.isAvailable
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{doctor.experience}</div>
                <div className="text-xs text-gray-400">Years exp.</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">₹{doctor.consultationFee}</div>
                <div className="text-xs text-gray-400">Consultation</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">{doctor.slotDuration}min</div>
                <div className="text-xs text-gray-400">Per slot</div>
              </div>
            </div>
          </div>
        </div>

        {/* bio */}
        {doctor.bio && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* contact */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
          <div className="text-sm text-gray-500">
            <span className="text-gray-400">Email: </span>{doctor.email}
          </div>
          <div className="text-sm text-gray-500">
            <span className="text-gray-400">Phone: </span>{doctor.phone}
          </div>
        </div>
      </div>

      {/* schedule */}
      {doctor.schedule && doctor.schedule.length > 0 && (
        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-4">Weekly Schedule</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {doctor.schedule.map((s) => (
              <div key={s.day} className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm font-medium text-slate-900">{s.day}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {s.startTime} - {s.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* book button */}
      {doctor.isAvailable && (
        <button
          onClick={() => navigate(`/doctors/${doctor._id}/book`)}
          className="btn-primary w-full py-3 text-base"
        >
          Book Appointment
        </button>
      )}

      {!doctor.isAvailable && (
        <div className="card p-4 text-center">
          <p className="text-gray-500 text-sm">
            This doctor is currently unavailable for appointments.
          </p>
        </div>
      )}

    </div>
  )
}

export default DoctorProfile