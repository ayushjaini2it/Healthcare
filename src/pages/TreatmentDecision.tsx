import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Pill, Calendar, FileText, Clock, CheckCircle, AlertTriangle, AlertCircle, Stethoscope, Microscope, Plus, Trash2 } from 'lucide-react'

const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  treatmentPlan: z.string().min(20, 'Treatment plan must be at least 20 characters'),
  medications: z.array(z.object({
    name: z.string().min(3, 'Required'),
    dosage: z.string().min(2, 'Required'),
    frequency: z.string().min(2, 'Required'),
    duration: z.string().min(2, 'Required'),
    instructions: z.string().min(5, 'Required'),
  })).min(1, 'At least one medication is required'),
  procedures: z.string().optional(),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  additionalNotes: z.string().optional(),
})

type TreatmentFormData = z.infer<typeof treatmentSchema>

const TreatmentDecision: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [treatmentSuccess, setTreatmentSuccess] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')


  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      patientId: prefillPatientId || '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications"
  })

  useEffect(() => {
    if (prefillPatientId && patients.length > 0) {
      setValue('patientId', prefillPatientId);
    }
  }, [prefillPatientId, patients, setValue])

  const selectedPatientId = watch('patientId');
  const [clinicalHistory, setClinicalHistory] = useState<any>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Load patient list when component mounts
  useEffect(() => {
    loadData()
  }, [])

  // Load clinical history when a patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientHistory(selectedPatientId)
    } else {
      setClinicalHistory(null)
    }
  }, [selectedPatientId])

  const loadPatientHistory = async (id: string) => {
    setIsLoadingHistory(true)
    try {
      // fetch latest consultation
      const { data: consData } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', id)
        .order('consultation_date', { ascending: false })
        .limit(1)

      // fetch latest diagnosis
      const { data: diagData } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(1)

      setClinicalHistory({
        consultation: consData?.[0] || null,
        diagnosis: diagData?.[0] || null
      })
    } catch (error) {
      console.error('Failed to fetch clinical history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      const patientsData = await supabaseServices.patientServices.getPatientsByStatus(['diagnosed', 'treatment'])
      setPatients(patientsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load patient data')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Auto-fetch latest consultation and diagnosis for this patient
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('id')
        .eq('patient_id', data.patientId)
        .order('consultation_date', { ascending: false })
        .limit(1)
      const consultationId = consultationsData?.[0]?.id || null

      const { data: diagnosesData } = await supabase
        .from('diagnoses')
        .select('id')
        .eq('patient_id', data.patientId)
        .order('created_at', { ascending: false })
        .limit(1)
      const diagnosisId = diagnosesData?.[0]?.id || null

      // Create treatment plan
      const treatment = await supabaseServices.treatmentServices.createTreatment({
        patientId: data.patientId,
        consultationId: consultationId,
        diagnosisId: diagnosisId,
        plan: data.treatmentPlan,
        medications: [],
        procedures: data.procedures?.split(',').map((p: string) => p.trim()) || [],
        followUpDate: new Date(data.followUpDate),
      })

      // Add medications
      if (treatment?.id && data.medications.length > 0) {
        await Promise.all(data.medications.map(med => 
          supabaseServices.treatmentServices.addMedication(
            treatment.id,
            {
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions,
            }
          )
        ))
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
          <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
          <span className="ml-4 text-lg font-medium text-slate-500 animate-pulse">Loading treatment data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Treatment Decision</h1>
        <p className="text-slate-600 mt-2">
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
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Create Treatment Plan
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              {/* Treatment Plan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              {/* Medication Details Array */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center">
                    <Pill className="h-5 w-5 mr-2 text-teal-600" />
                    Medication Prescriptions
                  </h3>
                  <button
                    type="button"
                    onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                    className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 relative group transition-all hover:border-teal-300">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove medication"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Name *
                        </label>
                        <input
                          {...register(`medications.${index}.name` as const)}
                          className={`input-field ${errors.medications?.[index]?.name ? 'border-red-300' : ''}`}
                          placeholder="e.g. Lisinopril"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Dosage *
                        </label>
                        <input
                          {...register(`medications.${index}.dosage` as const)}
                          className={`input-field ${errors.medications?.[index]?.dosage ? 'border-red-300' : ''}`}
                          placeholder="e.g. 10mg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Frequency *
                        </label>
                        <input
                          {...register(`medications.${index}.frequency` as const)}
                          className={`input-field ${errors.medications?.[index]?.frequency ? 'border-red-300' : ''}`}
                          placeholder="e.g. Twice daily"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Duration *
                        </label>
                        <input
                          {...register(`medications.${index}.duration` as const)}
                          className={`input-field ${errors.medications?.[index]?.duration ? 'border-red-300' : ''}`}
                          placeholder="e.g. 30 days"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Instructions *
                      </label>
                      <input
                        {...register(`medications.${index}.instructions` as const)}
                        className={`input-field ${errors.medications?.[index]?.instructions ? 'border-red-300' : ''}`}
                        placeholder="e.g. Take with food..."
                      />
                    </div>
                  </div>
                ))}
                {errors.medications?.root && (
                  <p className="text-red-500 text-sm mt-1">{errors.medications.root.message}</p>
                )}
              </div>

              {/* Procedures */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Follow-up Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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

        {/* Patient Clinical History */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Patient Clinical History
            </h2>

            {!selectedPatientId ? (
              <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                Select a patient to view their consultation notes and diagnosis results.
              </div>
            ) : isLoadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
              </div>
            ) : !clinicalHistory?.consultation && !clinicalHistory?.diagnosis ? (
              <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                No recent clinical history found for this patient.
              </div>
            ) : (
              <div className="space-y-6">
                {clinicalHistory.consultation && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center">
                      <Stethoscope className="h-4 w-4 mr-2 text-teal-600" />
                      Consultation Notes
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Symptoms</span>
                        <p className="text-slate-900 font-medium">{clinicalHistory.consultation.symptoms}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Doctor's Notes</span>
                        <p className="text-slate-700">{clinicalHistory.consultation.notes}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                        <div>
                          <span className="text-slate-500 block text-xs mb-0.5">Vitals (BP)</span>
                          <span className="font-medium text-slate-900">
                            {clinicalHistory.consultation.systolic_bp && clinicalHistory.consultation.diastolic_bp 
                              ? `${clinicalHistory.consultation.systolic_bp}/${clinicalHistory.consultation.diastolic_bp}` 
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs mb-0.5">Temp</span>
                          <span className="font-medium text-slate-900">{clinicalHistory.consultation.temperature ? `${clinicalHistory.consultation.temperature}°C` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {clinicalHistory.diagnosis && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center">
                      <Microscope className="h-4 w-4 mr-2 text-blue-600" />
                      Diagnosis Results
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Test Name</span>
                        <p className="text-slate-900 font-bold text-base">{clinicalHistory.diagnosis.test_name}</p>
                      </div>
                      {clinicalHistory.diagnosis.results && (
                        <div>
                          <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Results</span>
                          <p className="text-slate-700">{clinicalHistory.diagnosis.results}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Type</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase bg-blue-100 text-blue-800">
                          {clinicalHistory.diagnosis.test_type}
                        </span>
                      </div>
                      {clinicalHistory.diagnosis.interpretation && (
                        <div>
                          <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Interpretation</span>
                          <p className="text-slate-700 italic">{clinicalHistory.diagnosis.interpretation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Treatment Guidelines */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
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
              <div className="p-3 bg-teal-50 rounded-lg">
                <h4 className="font-medium text-teal-900">Follow-up Care</h4>
                <p className="text-teal-700 text-sm mt-1">
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
