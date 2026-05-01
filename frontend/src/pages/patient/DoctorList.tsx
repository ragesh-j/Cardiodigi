import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDoctorsApi } from '../../api/doctor.api'
import type { Doctor } from '../../types'

const specializations = [
  'All', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'Gynecology', 'General Medicine'
]

const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
  <div className="card p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
        {doctor.profileImage ? (
          <img src={doctor.profileImage} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover" />
        ) : (
          <span className="text-teal-700 text-xl font-semibold">
            {doctor.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">{doctor.name}</h3>
            <p className="text-teal-600 text-sm font-medium">{doctor.specialization}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
            doctor.isAvailable
              ? 'bg-teal-50 text-teal-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {doctor.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{doctor.qualification}</p>
        <p className="text-gray-400 text-sm">{doctor.experience} years experience</p>
        {doctor.bio && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">{doctor.bio}</p>
        )}
        <div className="flex items-center justify-between mt-4">
          <span className="text-slate-900 font-semibold">₹{doctor.consultationFee}</span>
          <Link
            to={`/doctors/${doctor._id}`}
            className="btn-primary py-2 px-4 text-xs"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  </div>
)

const DoctorList = () => {
  const [specialization, setSpecialization] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined)
  const [search, setSearch] = useState('')

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors', specialization, isAvailable],
    queryFn: () => getDoctorsApi({
      specialization: specialization || undefined,
      isAvailable,
    }),
  })

  const filtered = doctors?.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Find a Doctor</h1>
        <p className="text-gray-400 text-sm mt-1">Browse and book appointments with specialists</p>
      </div>

      {/* filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* search */}
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input flex-1"
          />

          {/* availability */}
          <select
            value={isAvailable === undefined ? '' : String(isAvailable)}
            onChange={e => setIsAvailable(
              e.target.value === '' ? undefined : e.target.value === 'true'
            )}
            className="input sm:w-40"
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>

        {/* specialization pills */}
        <div className="flex gap-2 flex-wrap mt-3">
          {specializations.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecialization(spec === 'All' ? '' : spec)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                (spec === 'All' && !specialization) || specialization === spec
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load doctors. Please try again.</p>
        </div>
      )}

      {/* empty */}
      {!isLoading && !error && filtered?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <h3 className="text-gray-900 font-medium">No doctors found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* grid */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doctor => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorList