import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Pill, Calendar, FileText, Clock, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'

const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  consultationId: z.string().min(1, 'Please select a consultation'),
  diagnosisId: z.string().min(1, 'Please select a diagnosis'),
  treatmentPlan: z.string().min(20, 'Treatment plan must be at least 20 characters'),
  medicationName: z.string().min(3, 'Medication name is required'),
  dosage: z.string().min(2, 'Dosage is required'),
  frequency: z.string().min(2, 'Frequency is required'),
  duration: z.string().min(2, 'Duration is required'),
  medicationInstructions: z.string().min(10, 'Medication instructions are required'),
  procedures: z.string().optional(),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  additionalNotes: z.string().optional(),
})

type TreatmentFormData = z.infer<typeof treatmentSchema>

const TreatmentDecision: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [treatmentSuccess, setTreatmentSuccess] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [consultations, setConsultations] = useState<any[]>([])
  const [diagnoses, setDiagnoses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const existingTreatments = [
    { id: '1', patientId: '1', consultationId: '1', result: 'Elevated blood pressure, risk factors present' },
    { id: '2', patientId: '2', consultationId: '2', result: 'Bacterial infection in lungs' },
    { id: '3', patientId: '3', consultationId: '3', result: 'High blood glucose levels' },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema)
  })

  // Load data when component mounts
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Fetch patients with status 'diagnosed'
      const patientsData = await supabaseServices.patientServices.getAllPatients()
      const diagnosedPatients = patientsData?.filter(p => p.status === 'diagnosed') || []
      setPatients(diagnosedPatients)

      // Fetch consultations for diagnosed patients
      if (diagnosedPatients.length > 0) {
        const { data: consultationsData } = await supabase
          .from('consultations')
          .select('*')
          .in('patient_id', diagnosedPatients.map(p => p.id))

        setConsultations(consultationsData || [])
      }

      // Fetch diagnoses for diagnosed patients
      if (diagnosedPatients.length > 0) {
        const { data: diagnosesData } = await supabase
          .from('diagnoses')
          .select('*')
          .in('patient_id', diagnosedPatients.map(p => p.id))

        setDiagnoses(diagnosesData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load patient, consultation, and diagnosis data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Create treatment plan
      const treatment = await supabaseServices.treatmentServices.createTreatment({
        patientId: data.patientId,
        consultationId: data.consultationId,
        diagnosisId: data.diagnosisId,
        plan: data.treatmentPlan,
        procedures: data.procedures?.split(',').map(p => p.trim()),
        followUpDate: new Date(data.followUpDate),
        status: 'planned'
      })

      // Add medications to treatment
      for (const medication of data.medications) {
        await supabaseServices.treatmentServices.addMedication(
          treatment.id,
          medication
        )
      }

      // Update patient status
      await supabaseServices.patientServices.updatePatientStatus(
        data.patientId,
        'treatment'
      )

      // Reload data
      await loadData()
      setTreatmentSuccess(true)
      reset()

      setTimeout(() => setTreatmentSuccess(false), 5000)
    } catch (error) {
      console.error('Error creating treatment:', error)
      const errorMsg = error instanceof Error
        ? error.message
        : 'Failed to create treatment plan. Please try again.'
      setErrorMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (treatmentSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Treatment Plan Created!</h3>
              <p className="text-green-700 mt-1">
                Treatment plan has been established and prescriptions sent to pharmacy.
              </p>
              <button
                onClick={() => setTreatmentSuccess(false)}
                className="mt-3 btn-primary"
              >
                Create Another Treatment Plan
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
          <span className="ml-3 text-lg text-gray-700">Loading treatment data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Treatment Decision</h1>
        <p className="text-gray-600 mt-2">
          Plan treatment and prescribe medications for diagnosed patients.
        </p>
      </div>

      {/* Show error message if any */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Treatment Plan Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Create Treatment Plan
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient and Diagnosis Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient *
                  </label>
                  <select {...register('patientId')} className="input-field">
                    <option value="">Select patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation *
                  </label>
                  <select {...register('consultationId')} className="input-field">
                    <option value="">Select consultation</option>
                    {consultations
                      .filter(c => !selectedPatient || c.patientId === selectedPatient.id)
                      .map(consultation => (
                        <option key={consultation.id} value={consultation.id}>
                          {consultation.date instanceof Date ? consultation.date.toLocaleDateString() : consultation.date}
                        </option>
                      ))}
                  </select>
                  {errors.consultationId && (
                    <p className="text-red-500 text-sm mt-1">{errors.consultationId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis *
                  </label>
                  <select {...register('diagnosisId')} className="input-field">
                    <option value="">Select diagnosis</option>
                    {diagnoses
                      .filter(d => !selectedPatient || d.patientId === selectedPatient.id)
                      .map(diagnosis => (
                        <option key={diagnosis.id} value={diagnosis.id}>
                          {diagnosis.results ? diagnosis.results.substring(0, 30) : 'No results'}...
                        </option>
                      ))}
                  </select>
                  {errors.diagnosisId && (
                    <p className="text-red-500 text-sm mt-1">{errors.diagnosisId.message}</p>
                  )}
                </div>
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan *
                </label>
                <textarea
                  {...register('treatmentPlan')}
                  rows={4}
                  className="input-field"
                  placeholder="Describe the comprehensive treatment approach..."
                />
                {errors.treatmentPlan && (
                  <p className="text-red-500 text-sm mt-1">{errors.treatmentPlan.message}</p>
                )}
              </div>

              {/* Medication Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2" />
                  Medication Prescription
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication Name *
                    </label>
                    <input
                      {...register('medicationName')}
                      className="input-field"
                      placeholder="e.g., Lisinopril"
                    />
                    {errors.medicationName && (
                      <p className="text-red-500 text-sm mt-1">{errors.medicationName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage *
                    </label>
                    <input
                      {...register('dosage')}
                      className="input-field"
                      placeholder="e.g., 10mg"
                    />
                    {errors.dosage && (
                      <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <input
                      {...register('frequency')}
                      className="input-field"
                      placeholder="e.g., Twice daily"
                    />
                    {errors.frequency && (
                      <p className="text-red-500 text-sm mt-1">{errors.frequency.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      {...register('duration')}
                      className="input-field"
                      placeholder="e.g., 30 days"
                    />
                    {errors.duration && (
                      <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medication Instructions *
                  </label>
                  <textarea
                    {...register('medicationInstructions')}
                    rows={3}
                    className="input-field"
                    placeholder="Specific instructions for medication administration..."
                  />
                  {errors.medicationInstructions && (
                    <p className="text-red-500 text-sm mt-1">{errors.medicationInstructions.message}</p>
                  )}
                </div>
              </div>

              {/* Procedures */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedures (if any)
                </label>
                <textarea
                  {...register('procedures')}
                  rows={3}
                  className="input-field"
                  placeholder="List any medical procedures required..."
                />
              </div>

              {/* Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      {...register('followUpDate')}
                      type="date"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.followUpDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.followUpDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('additionalNotes')}
                    rows={2}
                    className="input-field"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
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
                  {isSubmitting ? 'Creating...' : 'Create Treatment Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Treatments */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Active Treatments
            </h2>

            <div className="space-y-4">
              {existingTreatments.map(treatment => (
                <div key={treatment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{treatment.patientName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{treatment.diagnosis}</p>
                      <p className="text-sm text-gray-500 mt-2">{treatment.plan}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="text-gray-900">{treatment.startDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Follow-up:</span>
                      <span className="text-gray-900">{treatment.followUpDate}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className={`flex items-center text-sm font-medium ${
                      treatment.status === 'completed' 
                        ? 'text-green-600'
                        : treatment.status === 'in_progress'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}>
                      {treatment.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {treatment.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                      {treatment.status ? treatment.status.replace('_', ' ') : 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Guidelines */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Treatment Guidelines
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900">Medication Safety</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Always check for drug interactions and patient allergies before prescribing.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Follow-up Care</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Schedule regular follow-ups to monitor treatment effectiveness.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Patient Education</h4>
                <p className="text-green-700 text-sm mt-1">
                  Provide clear instructions and educate patients about their treatment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TreatmentDecision
