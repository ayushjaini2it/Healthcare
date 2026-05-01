import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, User, Stethoscope, CheckCircle, AlertCircle, ChevronRight, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const appointmentSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Please select a date'),
  timeSlot: z.string().min(1, 'Please select a time slot'),
  appointmentType: z.enum(['general', 'follow_up', 'emergency', 'specialist']),
  reason: z.string().min(10, 'Please describe your reason (min 10 characters)'),
  notes: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM',
]

const appointmentTypes = [
  { value: 'general', label: 'General Consultation', icon: '🩺', color: 'blue', desc: 'Routine check-up or health concern' },
  { value: 'follow_up', label: 'Follow-up Visit', icon: '📋', color: 'green', desc: 'Continuing care after prior treatment' },
  { value: 'emergency', label: 'Urgent Care', icon: '🚨', color: 'red', desc: 'Immediate medical attention needed' },
  { value: 'specialist', label: 'Specialist Referral', icon: '🔬', color: 'purple', desc: 'Specialized diagnosis or treatment' },
]

const AppointmentBooking: React.FC = () => {
  const { currentUser } = useAuth()
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientRecordId, setPatientRecordId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedType, setSelectedType] = useState<string>('general')
  const [bookedAppointment, setBookedAppointment] = useState<any>(null)
  const [myAppointments, setMyAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { appointmentType: 'general' },
  })

  const selectedDoctorId = watch('doctorId')
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadData()
  }, [currentUser?.id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: doctorsData } = await supabase.from('doctors').select('*')
      setDoctors(doctorsData || [])

      // Look up the patient record linked to this auth user
      if (currentUser?.id) {
        const { data: patientRecord } = await supabase
          .from('patients')
          .select('id')
          .eq('auth_user_id', currentUser.id)
          .maybeSingle()

        if (patientRecord?.id) {
          setPatientRecordId(patientRecord.id)

          const { data: appts } = await supabase
            .from('appointments')
            .select('*, doctors(full_name, specialization)')
            .eq('patient_id', patientRecord.id)
            .order('appointment_date', { ascending: false })
            .limit(5)
          setMyAppointments(appts || [])

          // Real-time subscription so patient sees accept/reject instantly
          const channel = supabase
            .channel('patient-appt-status')
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `patient_id=eq.${patientRecord.id}` },
              (payload) => {
                setMyAppointments(prev =>
                  prev.map(a => a.id === (payload.new as any).id ? { ...a, ...(payload.new as any) } : a)
                )
              }
            )
            .subscribe()

          return () => { supabase.removeChannel(channel) }
        }
      }
    } catch {
      // Table may not exist yet — show empty state
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      if (!patientRecordId) {
        setErrorMessage('Could not find your patient record. Please complete patient registration first.')
        setIsSubmitting(false)
        return
      }

      const { data: appt, error } = await supabase.from('appointments').insert([{
        patient_id: patientRecordId,
        doctor_id: data.doctorId,
        appointment_date: data.date,
        time_slot: data.timeSlot,
        appointment_type: data.appointmentType,
        reason: data.reason,
        notes: data.notes || '',
        status: 'pending',
      }]).select().single()

      if (error) throw error
      setBookedAppointment({ ...appt, doctorName: selectedDoctor?.full_name, specialization: selectedDoctor?.specialization })
      setSuccess(true)
      await loadData()
      reset()
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('appointments') && (msg.includes('relation') || msg.includes('does not exist'))) {
        setErrorMessage('Appointments table not set up yet. Please run the SQL setup in Supabase to enable this feature.')
      } else if (msg.includes('row-level security')) {
        setErrorMessage('Permission error. Please run fix_rls_policies.sql in your Supabase SQL Editor.')
      } else {
        setErrorMessage(msg || 'Failed to book appointment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusLabel = (status: string) => {
    if (status === 'pending')   return { text: '⏳ Awaiting Confirmation', cls: 'bg-amber-100 text-amber-700' }
    if (status === 'accepted')  return { text: '✅ Confirmed',             cls: 'bg-green-100 text-green-700' }
    if (status === 'rejected')  return { text: '❌ Declined',              cls: 'bg-red-100 text-red-700' }
    if (status === 'completed') return { text: '✔ Completed',              cls: 'bg-teal-100 text-teal-700' }
    return { text: status, cls: 'bg-slate-100 text-slate-600' }
  }

  if (success && bookedAppointment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-10">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
          <p className="text-slate-500 mb-6">Your appointment has been successfully scheduled.</p>

          <div className="bg-gradient-to-br from-teal-50 to-teal-50/50 border border-teal-100 rounded-xl p-6 text-left mb-6">
            <h3 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Doctor</p>
                <p className="font-semibold text-slate-900">Dr. {bookedAppointment.doctorName}</p>
              </div>
              <div>
                <p className="text-slate-500">Specialization</p>
                <p className="font-semibold text-slate-900">{bookedAppointment.specialization || 'General'}</p>
              </div>
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-semibold text-slate-900">{new Date(bookedAppointment.appointment_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-slate-500">Time</p>
                <p className="font-semibold text-slate-900">{bookedAppointment.time_slot}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Status</p>
                <span className="inline-block mt-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">✓ Confirmed</span>
              </div>
            </div>
          </div>

          <button onClick={() => setSuccess(false)} className="btn-primary">
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Book an Appointment</h1>
        <p className="text-slate-600 mt-2">Schedule a consultation with one of our specialists.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <span className="text-red-700 text-sm">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Appointment Type */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center font-bold">1</span>
              Select Appointment Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {appointmentTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => { setSelectedType(type.value); setValue('appointmentType', type.value as any) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedType === type.value
                      ? 'border-teal-500 bg-teal-50 shadow-sm'
                      : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <p className="font-semibold text-slate-900 text-sm">{type.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('appointmentType')} />
          </div>

          {/* Step 2: Select Doctor */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center font-bold">2</span>
              Choose a Doctor
            </h2>
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                Loading doctors...
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No doctors available. Please try again later.</p>
            ) : (
              <div className="space-y-3">
                {doctors.map(doctor => (
                  <label
                    key={doctor.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedDoctorId === doctor.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-200'
                    }`}
                  >
                    <input type="radio" value={doctor.id} {...register('doctorId')} className="sr-only" />
                    <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-lg font-bold">{(doctor.full_name || 'D')[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">Dr. {doctor.full_name}</p>
                      <p className="text-sm text-teal-600">{doctor.specialization || 'General Physician'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-xs text-slate-400 ml-1">5.0</span>
                      </div>
                    </div>
                    {selectedDoctorId === doctor.id && (
                      <CheckCircle className="h-5 w-5 text-teal-600 shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
            {errors.doctorId && <p className="text-red-500 text-sm mt-2">{errors.doctorId.message}</p>}
          </div>

          {/* Step 3: Date & Time */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center font-bold">3</span>
              Select Date &amp; Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Appointment Date *
                </label>
                <input
                  {...register('date')}
                  type="date"
                  min={today}
                  className="input-field"
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Time Slot *
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {timeSlots.map(slot => (
                    <label key={slot} className="cursor-pointer">
                      <input type="radio" value={slot} {...register('timeSlot')} className="sr-only" />
                      <div className={`text-center text-xs py-2 px-1 rounded-lg border transition-all ${
                        watch('timeSlot') === slot
                          ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50'
                      }`}>
                        {slot}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.timeSlot && <p className="text-red-500 text-sm mt-1">{errors.timeSlot.message}</p>}
              </div>
            </div>
          </div>

          {/* Step 4: Reason */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center font-bold">4</span>
              Describe Your Concern
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Visit *</label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="input-field"
                  placeholder="Briefly describe your symptoms or reason for the appointment..."
                />
                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes <span className="text-slate-400">(optional)</span></label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="input-field"
                  placeholder="Any allergies, current medications, or other relevant information..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Appointment <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Summary */}
          {(selectedDoctor || watch('date') || watch('timeSlot')) && (
            <div className="card bg-gradient-to-br from-teal-50 to-teal-50/50 border-teal-100">
              <h3 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" /> Booking Summary
              </h3>
              <div className="space-y-3 text-sm">
                {selectedDoctor && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{selectedDoctor.full_name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Dr. {selectedDoctor.full_name}</p>
                      <p className="text-teal-600 text-xs">{selectedDoctor.specialization || 'General'}</p>
                    </div>
                  </div>
                )}
                {watch('date') && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    {new Date(watch('date')).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                )}
                {watch('timeSlot') && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-teal-500" />
                    {watch('timeSlot')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-lg">{appointmentTypes.find(t => t.value === selectedType)?.icon}</span>
                  {appointmentTypes.find(t => t.value === selectedType)?.label}
                </div>
              </div>
            </div>
          )}

          {/* My Appointments */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-teal-500" /> My Appointments
            </h3>
            {myAppointments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((appt: any) => {
                    const sl = statusLabel(appt.status)
                    return (
                      <div key={appt.id} className={`border rounded-lg p-3 ${appt.status === 'rejected' ? 'border-red-200 bg-red-50/30' : appt.status === 'accepted' ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                        <p className="font-medium text-slate-900 text-sm">
                          Dr. {appt.doctors?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{appt.doctors?.specialization}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(appt.appointment_date).toLocaleDateString()} · {appt.time_slot}
                        </p>
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${sl.cls}`}>
                          {sl.text}
                        </span>
                        {appt.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1">Reason: {appt.rejection_reason}</p>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="card bg-amber-50 border-amber-100">
            <h3 className="font-semibold text-amber-900 text-sm mb-2">📋 Before Your Visit</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• Arrive 10 minutes before your appointment</li>
              <li>• Bring your ID and insurance card</li>
              <li>• List any current medications</li>
              <li>• Note your symptoms and their duration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentBooking
