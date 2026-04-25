import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import { supabaseServices } from '../services/supabaseServices'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope, Heart, Thermometer, Scale, Activity, Clock, User, AlertCircle } from 'lucide-react'

const consultationSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  doctorId: z.string().min(1, 'Please select a doctor'),
  symptoms: z.string().min(10, 'Please describe symptoms in detail'),
  bloodPressure: z.string().min(5, 'Please enter blood pressure'),
  heartRate: z.coerce.number().min(40).max(200, 'Heart rate must be between 40-200'),
  temperature: z.coerce.number().min(35).max(42, 'Temperature must be between 35-42°C'),
  weight: z.coerce.number().min(1).max(500, 'Weight must be between 1-500 kg'),
  height: z.coerce.number().min(50).max(250, 'Height must be between 50-250 cm'),
  preliminaryDiagnosis: z.string().min(5, 'Please provide preliminary diagnosis'),
  notes: z.string().min(10, 'Please add consultation notes'),
})

type ConsultationFormData = z.infer<typeof consultationSchema>

const Consultation: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consultationSuccess, setConsultationSuccess] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema)
  })

  // Load patients and doctors when component mounts
  useEffect(() => {
    loadPatientsAndDoctors()
  }, [])

  const loadPatientsAndDoctors = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all patients from Supabase
      const patientsData = await supabaseServices.patientServices.getAllPatients()
      setPatients(patientsData || [])
      
      // Fetch all doctors from Supabase
      const { data: doctorsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
      
      setDoctors(doctorsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load patient and doctor data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      // Step 1: Create consultation record
      const consultationData = {
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: new Date(),
        symptoms: data.symptoms.split(',').map(s => s.trim()),
        diagnosis: data.preliminaryDiagnosis,
        notes: data.notes,
        vitalSigns: {
          bloodPressure: data.bloodPressure,
          heartRate: data.heartRate,
          temperature: data.temperature,
          weight: data.weight,
          height: data.height
        },
        status: 'completed' as const
      }

      // Step 2: Save consultation to Supabase
      const result = await supabaseServices.consultationServices.createConsultation(
        consultationData
      )

      // Step 3: Update patient status to "in_consultation"
      await supabaseServices.patientServices.updatePatientStatus(
        data.patientId,
        'in_consultation'
      )

      // Step 4: Show success and reset
      setConsultationSuccess(true)
      reset()
      
      // Reload patients to show updated status
      loadPatientsAndDoctors()

      // Hide success message after 5 seconds
      setTimeout(() => setConsultationSuccess(false), 5000)
    } catch (error) {
      console.error('Error creating consultation:', error)
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Failed to create consultation. Please try again.'
      setErrorMessage(errorMsg)
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
                Patient consultation has been recorded and diagnosis orders sent.
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Selected Patient</h4>
                  <p className="text-blue-700 mt-1">{selectedPatient.name}</p>
                  <p className="text-blue-600 text-sm">
                    {selectedPatient.age} years, {selectedPatient.gender}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Doctor Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor *
              </label>
              <select {...register('doctorId')} className="input-field">
                <option value="">Choose a doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <p className="text-red-500 text-sm mt-1">{errors.doctorId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Vital Signs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure *
              </label>
              <input
                {...register('bloodPressure')}
                className="input-field"
                placeholder="120/80 mmHg"
              />
              {errors.bloodPressure && (
                <p className="text-red-500 text-sm mt-1">{errors.bloodPressure.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (bpm) *
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C) *
              </label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm) *
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Symptoms</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Diagnosis</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <div className="flex justify-between items-center">
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">Consultation time: ~15 minutes</span>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-secondary"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Complete Consultation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Consultation
