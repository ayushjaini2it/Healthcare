import React, { useState, useEffect } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope, Heart, Thermometer, Scale, Activity, Clock, User } from 'lucide-react'

const consultationSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  symptoms: z.string().min(10, 'Please describe symptoms in detail'),
  systolicBP: z.coerce.number().min(50).max(250, 'Systolic must be 50-250'),
  diastolicBP: z.coerce.number().min(30).max(150, 'Diastolic must be 30-150'),
  heartRate: z.coerce.number().min(40).max(200, 'Heart rate must be between 40-200'),
  temperature: z.coerce.number().min(35).max(42, 'Temperature must be between 35-42°C'),
  weight: z.coerce.number().min(1).max(500, 'Weight must be between 1-500 kg'),
  height: z.coerce.number().min(50).max(250, 'Height must be between 50-250 cm'),
  preliminaryDiagnosis: z.string().min(5, 'Please provide preliminary diagnosis'),
  notes: z.string().min(10, 'Please add consultation notes'),
})

type ConsultationFormData = z.infer<typeof consultationSchema>

const Consultation: React.FC = () => {
  const { currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState<'needs_lab' | 'direct_diagnosis'>('needs_lab')
  const [consultationSuccess, setConsultationSuccess] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId: prefillPatientId || '',
    }
  })

  useEffect(() => {
    if (prefillPatientId && patients.length > 0) {
      setValue('patientId', prefillPatientId);
    }
  }, [prefillPatientId, patients, setValue])

  // Load patients and doctors when component mounts
  useEffect(() => {
    loadPatientsAndDoctors()
  }, [])

  const loadPatientsAndDoctors = async () => {
    try {
      setIsLoading(true)
      const patientsData = await supabaseServices.patientServices.getPatientsByStatus(['registered', 'in_consultation'])
      setPatients(patientsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load patient data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    if (!currentUser?.id) {
      setErrorMessage('Could not identify logged-in doctor. Please re-login.')
      setIsSubmitting(false)
      return
    }

    try {
      const consultationData = {
        patientId: data.patientId,
        doctorId: currentUser.id,
        date: new Date(),
        symptoms: data.symptoms.split(',').map((s: string) => s.trim()),
        diagnosis: data.preliminaryDiagnosis,
        notes: data.notes,
        vitalSigns: {
          systolicBP: data.systolicBP,
          diastolicBP: data.diastolicBP,
          heartRate: data.heartRate,
          temperature: data.temperature,
          weight: data.weight,
          height: data.height
        },
        status: 'completed' as const
      }

      // Step 2: Save consultation to Supabase
      await supabaseServices.consultationServices.createConsultation(
        consultationData
      )

      // Step 3: Update patient status based on the selected workflow
      const nextStatus = submitAction === 'direct_diagnosis' ? 'diagnosed' : 'in_consultation'
      await supabaseServices.patientServices.updatePatientStatus(
        data.patientId,
        nextStatus
      )

      // Step 4: Show success and reset
      setConsultationSuccess(true)
      reset()
      
      // Reload patients to show updated status
      loadPatientsAndDoctors()

      // Hide success message after 5 seconds
      setTimeout(() => setConsultationSuccess(false), 5000)
    } catch (error) {
      console.error('Consultation error:', error)
      setErrorMessage('Failed to save consultation. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (consultationSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Stethoscope className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Consultation Completed!</h3>
              <p className="text-green-700 mt-1">
                {submitAction === 'direct_diagnosis' 
                  ? 'Patient consultation has been recorded and patient is ready for treatment.'
                  : 'Patient consultation has been recorded and diagnosis orders sent.'}
              </p>
              <button
                onClick={() => setConsultationSuccess(false)}
                className="mt-3 btn-primary"
              >
                Start New Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
          <span className="ml-3">Loading patients and doctors...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Show errors if any */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Patient and Doctor Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Patient *
                </label>
                <select {...register('patientId')} className="input-field">
                  <option value="">Choose a patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.age} years, {patient.gender}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                )}
              </div>

              {selectedPatient && (
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-medium text-teal-900">Selected Patient</h4>
                  <p className="text-teal-700 mt-1">{selectedPatient.name}</p>
                  <p className="text-teal-600 text-sm">
                    {selectedPatient.age} years, {selectedPatient.gender}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Doctor Information</h2>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-teal-600 rounded-full flex items-center justify-center shadow">
                  <span className="text-white text-lg font-bold">
                    {currentUser?.profile?.full_name?.[0] || 'D'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-teal-900 text-base">
                    {currentUser?.profile?.full_name || 'Doctor'}
                  </p>
                  <p className="text-sm text-teal-600 font-medium">
                    {currentUser?.profile?.specialization || 'Specialist'}
                  </p>
                  <p className="text-xs text-teal-400 mt-0.5">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <p className="text-xs text-teal-400 mt-3 font-medium">✓ Logged in as this doctor — assigned automatically</p>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Vital Signs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Systolic BP *
                </label>
                <input
                  {...register('systolicBP')}
                  type="number"
                  className="input-field"
                  placeholder="120"
                />
                {errors.systolicBP && (
                  <p className="text-red-500 text-sm mt-1">{errors.systolicBP.message}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Diastolic BP *
                </label>
                <input
                  {...register('diastolicBP')}
                  type="number"
                  className="input-field"
                  placeholder="80"
                />
                {errors.diastolicBP && (
                  <p className="text-red-500 text-sm mt-1">{errors.diastolicBP.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Heart Rate (bpm) *
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('heartRate')}
                  type="number"
                  className="input-field pl-10"
                  placeholder="72"
                />
              </div>
              {errors.heartRate && (
                <p className="text-red-500 text-sm mt-1">{errors.heartRate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Temperature (°C) *
              </label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('temperature')}
                  type="number"
                  step="0.1"
                  className="input-field pl-10"
                  placeholder="36.6"
                />
              </div>
              {errors.temperature && (
                <p className="text-red-500 text-sm mt-1">{errors.temperature.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Weight (kg) *
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('weight')}
                  type="number"
                  step="0.1"
                  className="input-field pl-10"
                  placeholder="70.5"
                />
              </div>
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Height (cm) *
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('height')}
                  type="number"
                  className="input-field pl-10"
                  placeholder="175"
                />
              </div>
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Symptoms and Diagnosis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Symptoms</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Patient Symptoms *
              </label>
              <textarea
                {...register('symptoms')}
                rows={6}
                className="input-field"
                placeholder="Describe patient symptoms in detail..."
              />
              {errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">{errors.symptoms.message}</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Diagnosis</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preliminary Diagnosis *
                </label>
                <textarea
                  {...register('preliminaryDiagnosis')}
                  rows={3}
                  className="input-field"
                  placeholder="Enter preliminary diagnosis..."
                />
                {errors.preliminaryDiagnosis && (
                  <p className="text-red-500 text-sm mt-1">{errors.preliminaryDiagnosis.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Consultation Notes *
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="input-field"
                  placeholder="Additional notes and observations..."
                />
                {errors.notes && (
                  <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 border-t border-slate-200 pt-6">
          <div className="flex items-center text-slate-600 w-full sm:w-auto">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">Consultation time: ~15 minutes</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors order-3 sm:order-1"
            >
              Clear Form
            </button>
            <button
              type="submit"
              onClick={() => setSubmitAction('needs_lab')}
              disabled={isSubmitting}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 order-2 sm:order-2"
            >
              {isSubmitting && submitAction === 'needs_lab' ? 'Saving...' : 'Requires Lab Test'}
            </button>
            <button
              type="submit"
              onClick={() => setSubmitAction('direct_diagnosis')}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-3"
            >
              {isSubmitting && submitAction === 'direct_diagnosis' ? 'Saving...' : 'Direct Diagnosis (Skip Labs)'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Consultation
