import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, CheckCircle, Clock, MapPin, Search, Stethoscope } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { supabaseServices } from '../services/supabaseServices'

interface DoctorProfile {
  id: string
  full_name: string
  specialization?: string | null
  hospital_name?: string | null
  hospital_address?: string | null
}

const appointmentTypes = [
  { value: 'general', label: 'General consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'specialist', label: 'Specialist consultation' },
]

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
]

const getLocalDate = () => {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return ''
}

const AppointmentBooking: React.FC = () => {
  const { currentUser } = useAuth()
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(getLocalDate)
  const [timeSlot, setTimeSlot] = useState('')
  const [appointmentType, setAppointmentType] = useState('general')
  const [reason, setReason] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [notificationWarning, setNotificationWarning] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  const loadDoctors = useCallback(async () => {
    setIsLoadingDoctors(true)
    setDoctorError('')
    if (!isSupabaseConfigured) {
      setDoctors([])
      setDoctorError('Doctor listings require Supabase. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.')
      setIsLoadingDoctors(false)
      return
    }

    try {
      const results = await supabaseServices.authServices.getAllDoctors()
      setDoctors((results || []) as DoctorProfile[])
    } catch (error) {
      console.error('Failed to load doctors for appointment booking:', error)
      const message = getErrorMessage(error)
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('row-level security')) {
        setDoctorError('Your account cannot view doctor listings. Enable the authenticated read policy for the doctors table in Supabase.')
      } else if (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('could not find the table')) {
        setDoctorError('The doctors table is not available in Supabase. Please contact support.')
      } else {
        setDoctorError(message || 'Could not load doctors. Please check your connection and try again.')
      }
    } finally {
      setIsLoadingDoctors(false)
    }
  }, [])

  useEffect(() => {
    loadDoctors()
  }, [loadDoctors])

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return doctors
    return doctors.filter(doctor =>
      doctor.full_name.toLowerCase().includes(query) ||
      (doctor.specialization || '').toLowerCase().includes(query) ||
      (doctor.hospital_name || '').toLowerCase().includes(query) ||
      (doctor.hospital_address || '').toLowerCase().includes(query)
    )
  }, [doctors, search])

  const selectedDoctor = doctors.find(doctor => doctor.id === selectedDoctorId)

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBookingError('')
    setBookingSuccess('')
    setNotificationWarning('')

    const patientId = currentUser?.profile?.id
    if (!patientId) {
      setBookingError('Your patient profile could not be found. Please sign in again or contact support.')
      return
    }
    if (!selectedDoctor) {
      setBookingError('Please choose a doctor before booking.')
      return
    }

    setIsBooking(true)
    try {
      const { data: appointment, error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        appointment_type: appointmentType,
        reason: reason.trim(),
        status: 'pending',
      }).select('id').single()

      if (error) throw error

      setBookingSuccess(`Your appointment request with ${selectedDoctor.full_name} has been sent.`)
      const { error: emailError } = await supabase.functions.invoke('appointment-notification', {
        body: { appointmentId: appointment.id },
      })
      if (emailError) {
        console.error('Appointment saved, but doctor email notification failed:', emailError)
        setNotificationWarning('Your appointment was booked, but the doctor email notification could not be sent. The request is available in the doctor dashboard.')
      }
      setTimeSlot('')
      setReason('')
    } catch (error: unknown) {
      console.error('Appointment booking failed:', error)
      const errorMessage = getErrorMessage(error)
      const message = errorMessage.toLowerCase()
      if (message.includes('appointments') && (message.includes('does not exist') || message.includes('could not find the table'))) {
        setBookingError('Appointment booking is not set up in Supabase yet. Please contact support.')
      } else {
        setBookingError(errorMessage || 'Could not book this appointment. Please try again.')
      }
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Book an appointment</h1>
            <p className="mt-1 text-slate-600">Choose a doctor and request a convenient appointment time.</p>
          </div>
        </div>
      </header>

      {bookingSuccess && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{bookingSuccess} You can check its status in your appointments.</p>
        </div>
      )}
      {bookingError && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{bookingError}</p>
        </div>
      )}
      {notificationWarning && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{notificationWarning}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Available doctors</h2>
            <p className="mt-1 text-sm text-slate-500">Select a doctor to continue with your booking.</p>
          </div>

          <label className="relative mb-5 block">
            <span className="sr-only">Search doctors</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by doctor, specialty, or clinic"
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </label>

          {isLoadingDoctors ? (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-500" role="status">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-100 border-t-teal-600" />
              Loading doctors...
            </div>
          ) : doctorError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <p>{doctorError}</p>
              <button type="button" onClick={loadDoctors} className="mt-3 font-semibold underline">
                Try again
              </button>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
              <Stethoscope className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                {doctors.length ? 'No doctors match your search.' : 'No doctors are registered yet.'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {doctors.length ? 'Try another name or specialty.' : 'Please check back later or contact the clinic.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map(doctor => {
                const isSelected = doctor.id === selectedDoctorId
                return (
                  <button
                    type="button"
                    key={doctor.id}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedDoctorId(doctor.id)
                      setBookingError('')
                      setBookingSuccess('')
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">
                        {doctor.full_name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900">{doctor.full_name}</span>
                        <span className="mt-0.5 block text-sm font-medium text-teal-700">
                          {doctor.specialization || 'Healthcare professional'}
                        </span>
                        {(doctor.hospital_name || doctor.hospital_address) && (
                          <span className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{[doctor.hospital_name, doctor.hospital_address].filter(Boolean).join(' · ')}</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Appointment details</h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedDoctor ? `Request a visit with ${selectedDoctor.full_name}.` : 'Select a doctor to fill in your appointment details.'}
          </p>

          <form onSubmit={submitBooking} className="mt-5 space-y-4">
            <div>
              <label htmlFor="appointment-date" className="mb-1.5 block text-sm font-semibold text-slate-700">Date</label>
              <input
                id="appointment-date"
                type="date"
                required
                min={getLocalDate()}
                value={appointmentDate}
                onChange={event => setAppointmentDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label htmlFor="appointment-time" className="mb-1.5 block text-sm font-semibold text-slate-700">Time</label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="appointment-time"
                  required
                  value={timeSlot}
                  onChange={event => setTimeSlot(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-3 pl-10 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Choose a time</option>
                  {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="appointment-type" className="mb-1.5 block text-sm font-semibold text-slate-700">Appointment type</label>
              <select
                id="appointment-type"
                value={appointmentType}
                onChange={event => setAppointmentType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                {appointmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="appointment-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">Reason for visit</label>
              <textarea
                id="appointment-reason"
                required
                minLength={5}
                maxLength={500}
                rows={4}
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Briefly describe what you need help with"
                className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedDoctor || isBooking || isLoadingDoctors || doctors.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBooking ? 'Sending request...' : 'Request appointment'}
            </button>
            <p className="text-center text-xs text-slate-500">Your appointment will be pending until the doctor confirms it.</p>
          </form>
        </section>
      </div>
    </div>
  )
}

export default AppointmentBooking
