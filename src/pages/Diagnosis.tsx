import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Microscope, TestTube, Image, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const diagnosisSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  consultationId: z.string().min(1, 'Please select a consultation'),
  testType: z.enum(['lab', 'imaging']),
  testName: z.string().min(3, 'Test name is required'),
  priority: z.enum(['routine', 'urgent', 'stat']),
  instructions: z.string().min(10, 'Please provide test instructions'),
  notes: z.string().optional(),
  results: z.string().optional(),
  interpretation: z.string().optional(),
})

type DiagnosisFormData = z.infer<typeof diagnosisSchema>

const Diagnosis: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [diagnosisSuccess, setDiagnosisSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'lab' | 'imaging'>('lab')
  const [patients, setPatients] = useState<any[]>([])
  const [consultations, setConsultations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const labTests = [
    'Complete Blood Count (CBC)',
    'Comprehensive Metabolic Panel',
    'Lipid Panel',
    'Thyroid Function Tests',
    'Hemoglobin A1c',
    'Urinalysis',
    'Blood Culture',
    'Coagulation Panel',
  ]

  const imagingTests = [
    'Chest X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'Mammogram',
    'Bone Density Scan',
    'PET Scan',
    'Echocardiogram',
  ]

  const existingTests = [
    {
      id: '1',
      patientName: 'John Doe',
      testName: 'Complete Blood Count',
      type: 'lab',
      status: 'in_progress',
      orderedDate: '2024-01-15',
      priority: 'routine',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      testName: 'Chest X-Ray',
      type: 'imaging',
      status: 'completed',
      orderedDate: '2024-01-14',
      priority: 'urgent',
      results: 'No acute cardiopulmonary abnormalities detected.',
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      testName: 'Comprehensive Metabolic Panel',
      type: 'lab',
      status: 'ordered',
      orderedDate: '2024-01-15',
      priority: 'stat',
    },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema)
  })

  // Load patients and consultations when component mounts
  useEffect(() => {
    loadPatientsAndConsultations()
  }, [])

  const loadPatientsAndConsultations = async () => {
    try {
      setIsLoading(true)

      // Fetch patients with status 'in_consultation'
      const patientsData = await supabaseServices.patientServices.getAllPatients()
      const inConsultationPatients = patientsData?.filter(p => p.status === 'in_consultation') || []
      setPatients(inConsultationPatients)

      // Fetch recent consultations
      if (inConsultationPatients.length > 0) {
        const { data: consultationsData } = await supabase
          .from('consultations')
          .select('*')
          .in('patient_id', inConsultationPatients.map(p => p.id))
          .order('consultation_date', { ascending: false })

        setConsultations(consultationsData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load patient and consultation data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const onSubmit = async (data: DiagnosisFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      // Create diagnosis record
      await supabaseServices.diagnosisServices.createDiagnosis({
        patientId: data.patientId,
        consultationId: data.consultationId,
        type: data.testType,
        testName: data.testName,
        results: data.results,
        interpretation: data.interpretation,
        date: new Date(),
        status: 'completed'
      })

      // Update patient status
      await supabaseServices.patientServices.updatePatientStatus(
        data.patientId,
        'diagnosed'
      )

      // Reload data
      await loadPatientsAndConsultations()
      setDiagnosisSuccess(true)
      reset()

      setTimeout(() => setDiagnosisSuccess(false), 5000)
    } catch (error) {
      console.error('Error creating diagnosis:', error)
      const errorMsg = error instanceof Error
        ? error.message
        : 'Failed to create diagnosis. Please try again.'
      setErrorMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (diagnosisSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Test Ordered Successfully!</h3>
              <p className="text-green-700 mt-1">
                Diagnostic test has been ordered and patient will be notified.
              </p>
              <button
                onClick={() => setDiagnosisSuccess(false)}
                className="mt-3 btn-primary"
              >
                Order Another Test
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
          <span className="ml-3 text-lg text-gray-700">Loading patients and tests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Diagnosis & Testing</h1>
        <p className="text-gray-600 mt-2">
          Order laboratory tests and imaging studies for patient diagnosis.
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
        {/* Test Order Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Microscope className="h-5 w-5 mr-2" />
              Order Diagnostic Test
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select {...register('patientId')} className="input-field">
                    <option value="">Choose a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.status}
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
                          {consultation.date} - {consultation.doctor}
                        </option>
                      ))}
                  </select>
                  {errors.consultationId && (
                    <p className="text-red-500 text-sm mt-1">{errors.consultationId.message}</p>
                  )}
                </div>
              </div>

              {/* Test Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type *
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('lab')
                      setValue('testType', 'lab')
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'lab'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    } border`}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Laboratory Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('imaging')
                      setValue('testType', 'imaging')
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'imaging'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    } border`}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Imaging Studies
                  </button>
                </div>
                <input {...register('testType')} type="hidden" />
                {errors.testType && (
                  <p className="text-red-500 text-sm mt-1">{errors.testType.message}</p>
                )}
              </div>

              {/* Test Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name *
                </label>
                <select {...register('testName')} className="input-field">
                  <option value="">Select a test</option>
                  {(activeTab === 'lab' ? labTests : imagingTests).map(test => (
                    <option key={test} value={test}>
                      {test}
                    </option>
                  ))}
                </select>
                {errors.testName && (
                  <p className="text-red-500 text-sm mt-1">{errors.testName.message}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select {...register('priority')} className="input-field">
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT (Immediate)</option>
                </select>
                {errors.priority && (
                  <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Instructions *
                </label>
                <textarea
                  {...register('instructions')}
                  rows={4}
                  className="input-field"
                  placeholder="Provide specific instructions for the test..."
                />
                {errors.instructions && (
                  <p className="text-red-500 text-sm mt-1">{errors.instructions.message}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field"
                  placeholder="Any additional information..."
                />
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
                  {isSubmitting ? 'Ordering...' : 'Order Test'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Tests */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Tests
            </h2>

            <div className="space-y-4">
              {existingTests.map(test => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{test.testName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{test.patientName}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          test.type === 'lab' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {test.type === 'lab' ? (
                            <TestTube className="h-3 w-3 mr-1" />
                          ) : (
                            <Image className="h-3 w-3 mr-1" />
                          )}
                          {test.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          test.priority === 'stat' 
                            ? 'bg-red-100 text-red-800'
                            : test.priority === 'urgent'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {test.orderedDate}
                    </div>
                    <div className={`flex items-center text-sm font-medium ${
                      test.status === 'completed' 
                        ? 'text-green-600'
                        : test.status === 'in_progress'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {test.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {test.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                      {test.status === 'ordered' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {test.status.replace('_', ' ')}
                    </div>
                  </div>

                  {test.results && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium text-gray-700 mb-1">Results:</p>
                      <p className="text-gray-600">{test.results}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnosis
