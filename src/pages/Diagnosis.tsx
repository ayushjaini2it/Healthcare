import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Microscope, TestTube, Image, FileText, CheckCircle, Clock, AlertCircle, Edit } from 'lucide-react'

const diagnosisSchema = z.object({
  mode: z.enum(['order', 'result']),
  diagnosisId: z.string().optional(),
  patientId: z.string().min(1, 'Please select a patient'),
  testType: z.enum(['lab', 'imaging']),
  testName: z.string().min(3, 'Test name is required'),
  priority: z.enum(['routine', 'urgent', 'stat']),
  instructions: z.string().optional(),
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
  const [pendingTests, setPendingTests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      mode: 'order',
      testType: 'lab',
      priority: 'routine',
      patientId: prefillPatientId || ''
    }
  })

  const formMode = watch('mode')

  useEffect(() => {
    if (prefillPatientId && patients.length > 0) {
      setValue('patientId', prefillPatientId)
    }
  }, [prefillPatientId, patients, setValue])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const patientsData = await supabaseServices.patientServices.getPatientsByStatus(['in_consultation', 'diagnosed'])
      setPatients(patientsData || [])

      // Fetch pending tests
      const { data: pendingData, error } = await supabase
        .from('diagnoses')
        .select(`
          id,
          test_name,
          test_type,
          test_date,
          status,
          patient_id,
          patients (
            id,
            first_name,
            last_name
          )
        `)
        .in('status', ['ordered', 'in_progress'])
        .order('test_date', { ascending: false })

      if (error) throw error

      setPendingTests(pendingData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setErrorMessage('Failed to load diagnosis data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPendingTest = (test: any) => {
    reset()
    setValue('mode', 'result')
    setValue('diagnosisId', test.id)
    setValue('patientId', test.patient_id)
    setValue('testType', test.test_type)
    setValue('testName', test.test_name)
    // Clear results so they can input fresh
    setValue('results', '')
    setValue('interpretation', '')
    setActiveTab(test.test_type)
  }

  const handleCancelResultMode = () => {
    reset({
      mode: 'order',
      testType: 'lab',
      priority: 'routine',
      patientId: ''
    })
    setActiveTab('lab')
  }

  const onSubmit = async (data: DiagnosisFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      if (data.mode === 'order') {
        // Auto-fetch latest consultation for this patient
        const { data: consultationsData } = await supabase
          .from('consultations')
          .select('id')
          .eq('patient_id', data.patientId)
          .order('consultation_date', { ascending: false })
          .limit(1)

        const consultationId = consultationsData?.[0]?.id || null

        // Create diagnosis record but DO NOT advance patient status
        await supabaseServices.diagnosisServices.createDiagnosis({
          patientId: data.patientId,
          consultationId: consultationId,
          type: data.testType,
          testName: data.testName,
          results: '',
          interpretation: '',
          date: new Date(),
        })

        // Patient status remains 'in_consultation' or whatever it was
      } else {
        // We are in 'result' mode. Update existing diagnosis
        if (!data.diagnosisId) throw new Error('Missing diagnosis ID')

        // First, check if results are provided
        if (!data.results || data.results.trim() === '') {
          throw new Error('Please provide the test results')
        }

        const { error } = await supabase
          .from('diagnoses')
          .update({
            results: data.results,
            interpretation: data.interpretation || '',
            status: 'completed',
            updated_at: new Date()
          })
          .eq('id', data.diagnosisId)

        if (error) throw error

        // Now that results are in, advance the patient to diagnosed
        await supabaseServices.patientServices.updatePatientStatus(
          data.patientId,
          'diagnosed'
        )
      }

      await loadData()
      setDiagnosisSuccess(true)
      handleCancelResultMode() // reset form back to order mode

      setTimeout(() => setDiagnosisSuccess(false), 5000)
    } catch (error: any) {
      console.error('Diagnosis error:', error)
      const msg: string = error?.message || ''
      if (msg.includes('null') || msg.includes('violates not-null')) {
        setErrorMessage('This patient has no consultation on record. Please complete a consultation first.')
      } else {
        setErrorMessage(msg || 'Failed to process diagnosis. Please try again.')
      }
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
              <h3 className="text-lg font-semibold text-green-900">Success!</h3>
              <p className="text-green-700 mt-1">
                {formMode === 'order' 
                  ? 'Diagnostic test has been ordered.' 
                  : 'Test results have been saved and patient is now diagnosed.'}
              </p>
              <button
                onClick={() => setDiagnosisSuccess(false)}
                className="mt-3 btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
          <span className="ml-4 text-lg font-medium text-slate-500 animate-pulse">Loading patients and tests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Diagnosis & Testing</h1>
        <p className="text-slate-600 mt-2">
          Order laboratory tests or input results for pending tests.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className={`card border-2 ${formMode === 'result' ? 'border-teal-400 bg-teal-50/10' : 'border-transparent'}`}>
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <Microscope className={`h-5 w-5 mr-2 ${formMode === 'result' ? 'text-teal-600' : 'text-slate-900'}`} />
                {formMode === 'order' ? 'Order Diagnostic Test' : 'Input Test Results'}
              </div>
              {formMode === 'result' && (
                <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Result Entry Mode
                </span>
              )}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...register('mode')} />
              <input type="hidden" {...register('diagnosisId')} />

              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Patient *
                </label>
                {formMode === 'result' ? (
                  <select {...register('patientId')} className="input-field bg-slate-100 text-slate-500 pointer-events-none" readOnly>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select {...register('patientId')} className="input-field">
                    <option value="">Choose a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.status}
                      </option>
                    ))}
                  </select>
                )}
                {errors.patientId && (
                  <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                )}
              </div>

              {/* Test Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Type *
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    disabled={formMode === 'result'}
                    onClick={() => {
                      setActiveTab('lab')
                      setValue('testType', 'lab')
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'lab'
                        ? 'bg-teal-100 text-teal-700 border-teal-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    } border ${formMode === 'result' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Laboratory Tests
                  </button>
                  <button
                    type="button"
                    disabled={formMode === 'result'}
                    onClick={() => {
                      setActiveTab('imaging')
                      setValue('testType', 'imaging')
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'imaging'
                        ? 'bg-teal-100 text-teal-700 border-teal-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    } border ${formMode === 'result' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Imaging Studies
                  </button>
                </div>
                <input {...register('testType')} type="hidden" />
              </div>

              {/* Test Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Name *
                </label>
                {formMode === 'result' ? (
                  <input {...register('testName')} className="input-field bg-slate-100 text-slate-500 pointer-events-none" readOnly />
                ) : (
                  <select {...register('testName')} className="input-field">
                    <option value="">Select a test</option>
                    {(activeTab === 'lab' ? labTests : imagingTests).map(test => (
                      <option key={test} value={test}>
                        {test}
                      </option>
                    ))}
                  </select>
                )}
                {errors.testName && (
                  <p className="text-red-500 text-sm mt-1">{errors.testName.message}</p>
                )}
              </div>

              {/* Order Mode Fields */}
              {formMode === 'order' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority *
                    </label>
                    <select {...register('priority')} className="input-field">
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT (Immediate)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Test Instructions
                    </label>
                    <textarea
                      {...register('instructions')}
                      rows={3}
                      className="input-field"
                      placeholder="Provide specific instructions for the test..."
                    />
                  </div>
                </>
              )}

              {/* Result Mode Fields */}
              {formMode === 'result' && (
                <div className="space-y-6 pt-4 border-t border-teal-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Test Results (Values & Findings) *
                    </label>
                    <textarea
                      {...register('results')}
                      rows={4}
                      className="input-field border-teal-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Enter the raw test results, values, or findings..."
                    />
                    {errors.results && (
                      <p className="text-red-500 text-sm mt-1">{errors.results.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Clinical Interpretation
                    </label>
                    <textarea
                      {...register('interpretation')}
                      rows={3}
                      className="input-field"
                      placeholder="Provide your clinical interpretation of these results..."
                    />
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="input-field"
                  placeholder="Any additional information..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                {formMode === 'result' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelResultMode}
                      className="btn-secondary text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Results & Diagnose'}
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Pending Tests Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Pending Lab Orders
            </h2>

            {pendingTests.length === 0 ? (
              <div className="text-center p-6 text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                No pending tests to process.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTests.map(test => (
                  <div 
                    key={test.id} 
                    className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      formMode === 'result' && watch('diagnosisId') === test.id 
                        ? 'border-teal-500 ring-1 ring-teal-500' 
                        : 'border-slate-200 hover:border-teal-300'
                    }`}
                    onClick={() => handleSelectPendingTest(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{test.test_name}</h4>
                        <p className="text-sm text-slate-600 mt-0.5 font-medium">
                          {test.patients?.first_name} {test.patients?.last_name}
                        </p>
                      </div>
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
                        {test.status}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(test.test_date).toLocaleDateString()}
                      </div>
                      <button className="text-xs font-semibold text-teal-600 flex items-center hover:text-teal-700">
                        <Edit className="h-3 w-3 mr-1" />
                        Input Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnosis
