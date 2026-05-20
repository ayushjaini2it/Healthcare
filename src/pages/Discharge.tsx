import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, CheckCircle, Clock, AlertTriangle, Calendar, AlertCircle } from 'lucide-react'
import { supabaseServices } from '../services/supabaseServices'

const dischargeSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  dischargeDate: z.string().min(1, 'Discharge date is required'),
  dischargeType: z.enum(['routine', 'transfer', 'against_medical_advice']),
  finalDiagnosis: z.string().min(10, 'Final diagnosis is required'),
  treatmentSummary: z.string().min(20, 'Treatment summary is required'),
  dischargeInstructions: z.string().min(10, 'Discharge instructions are required'),
  followUpAppointment: z.string().optional(),
  medications: z.string().optional(),
  restrictions: z.string().optional(),
  emergencyContacts: z.string().optional(),
})

type DischargeFormData = z.infer<typeof dischargeSchema>

const Discharge: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dischargeSuccess, setDischargeSuccess] = useState(false)
  
  const [patients, setPatients] = useState<any[]>([])
  const [recentDischarges, setRecentDischarges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')
  const [stats, setStats] = useState({
    pendingDischarges: 0,
    completedToday: 0,
    averageLengthOfStay: '0.0',
    bedAvailability: 0
  })

  useEffect(() => {
    loadDischargePatients()
  }, [])

  const loadDischargePatients = async () => {
    try {
      setIsLoading(true)
      
      // Fetch patients ready for discharge, recently discharged, and all patients for stats
      const [readyForDischarge, dischargedList, allPatients] = await Promise.all([
        supabaseServices.patientServices.getPatientsByStatus(['billing', 'treatment']),
        supabaseServices.patientServices.getPatientsByStatus(['discharged']),
        supabaseServices.patientServices.getAllPatients()
      ])
      
      // Calculate Statistics
      const occupancyCount = (allPatients || []).filter(p => p.status !== 'discharged').length;
      const totalBeds = 50; // Configurable hospital bed count
      const bedsAvailable = Math.max(0, totalBeds - occupancyCount);
      
      const today = new Date().toDateString();
      let completedTodayCount = 0;
      let totalStayDays = 0;

      // Map discharged patients 
      const mappedDischarges = (dischargedList || []).map(p => {
        const adDate = new Date(p.registrationDate || new Date());
        const disDate = new Date(p.updatedAt || p.registrationDate || new Date());
        
        if (disDate.toDateString() === today) {
          completedTodayCount++;
        }
        
        const stayDays = Math.max(1, Math.ceil((disDate.getTime() - adDate.getTime()) / (1000 * 3600 * 24)));
        totalStayDays += stayDays;

        return {
          id: p.id,
          patientName: p.name,
          dischargeDate: disDate.toLocaleDateString(),
          lengthOfStay: stayDays,
          dischargeType: 'routine',
          finalDiagnosis: 'Treatment Complete',
        }
      });

      const avgStay = dischargedList && dischargedList.length > 0 
        ? (totalStayDays / dischargedList.length).toFixed(1) 
        : '0.0';

      setStats({
        pendingDischarges: (readyForDischarge || []).length,
        completedToday: completedTodayCount,
        averageLengthOfStay: avgStay,
        bedAvailability: bedsAvailable
      });

      // Map to UI expectations
      setPatients((readyForDischarge || []).map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        admissionDate: p.registrationDate ? new Date(p.registrationDate).toLocaleDateString() : 'N/A',
        diagnosis: 'Check medical records',
        status: p.status,
        room: 'General Ward'
      })))

      setRecentDischarges(mappedDischarges)

    } catch (error) {
      console.error('Error loading patients:', error)
      setErrorMessage('Failed to load patient data')
    } finally {
      setIsLoading(false)
    }
  }

  const dischargeChecklist = [
    { id: '1', item: 'Final physician review completed', checked: true },
    { id: '2', item: 'Medication reconciliation done', checked: true },
    { id: '3', item: 'Discharge instructions provided', checked: false },
    { id: '4', item: 'Follow-up appointments scheduled', checked: false },
    { id: '5', item: 'Medical records completed', checked: true },
    { id: '6', item: 'Billing processed', checked: false },
    { id: '7', item: 'Patient education completed', checked: false },
    { id: '8', item: 'Room cleaned and prepared', checked: false },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DischargeFormData>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: {
      patientId: prefillPatientId || '',
      dischargeType: 'routine'
    }
  })

  useEffect(() => {
    if (prefillPatientId && patients.length > 0) {
      setValue('patientId', prefillPatientId);
    }
  }, [prefillPatientId, patients, setValue])

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const onSubmit = async (data: DischargeFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await supabaseServices.patientServices.updatePatientStatus(
        data.patientId,
        'discharged'
      )
      
      console.log('Patient discharged:', data)
      await loadDischargePatients()
      setDischargeSuccess(true)
      setIsSubmitting(false)
      reset()
      
      setTimeout(() => setDischargeSuccess(false), 5000)
    } catch (err: any) {
      console.error('Discharge error:', err)
      setErrorMessage('Failed to discharge patient. Please try again or contact support.')
      setIsSubmitting(false)
    }
  }

  if (dischargeSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Patient Discharged Successfully!</h3>
              <p className="text-green-700 mt-1">
                Patient has been discharged and all necessary documentation completed.
              </p>
              <button
                onClick={() => setDischargeSuccess(false)}
                className="mt-3 btn-primary"
              >
                Discharge Another Patient
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
          <span className="ml-3">Loading discharge data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Patient Discharge</h1>
        <p className="text-slate-600 mt-2">
          Complete patient discharge process and finalize documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Discharge Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Discharge Processing
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Patient *
                  </label>
                  <select {...register('patientId')} className="input-field">
                    <option value="">Select patient</option>
                    {patients
                      .map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} - Room {patient.room}
                        </option>
                      ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discharge Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      {...register('dischargeDate')}
                      type="date"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.dischargeDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.dischargeDate.message}</p>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              {selectedPatient && (
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-medium text-teal-900">Patient Information</h4>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-teal-700">Name:</span>
                      <span className="text-teal-900 ml-2">{selectedPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-teal-700">Age:</span>
                      <span className="text-teal-900 ml-2">{selectedPatient.age}</span>
                    </div>
                    <div>
                      <span className="text-teal-700">Room:</span>
                      <span className="text-teal-900 ml-2">{selectedPatient.room}</span>
                    </div>
                    <div>
                      <span className="text-teal-700">Admitted:</span>
                      <span className="text-teal-900 ml-2">{selectedPatient.admissionDate}</span>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-teal-700">Diagnosis:</span>
                      <span className="text-teal-900 ml-2">{selectedPatient.diagnosis}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Discharge Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discharge Type *
                  </label>
                  <select {...register('dischargeType')} className="input-field">
                    <option value="routine">Routine</option>
                    <option value="transfer">Transfer to another facility</option>
                    <option value="against_medical_advice">Against Medical Advice</option>
                  </select>
                  {errors.dischargeType && (
                    <p className="text-red-500 text-sm mt-1">{errors.dischargeType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Follow-up Appointment
                  </label>
                  <input
                    {...register('followUpAppointment')}
                    type="datetime-local"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Final Diagnosis *
                  </label>
                  <textarea
                    {...register('finalDiagnosis')}
                    rows={3}
                    className="input-field"
                    placeholder="Enter final diagnosis..."
                  />
                  {errors.finalDiagnosis && (
                    <p className="text-red-500 text-sm mt-1">{errors.finalDiagnosis.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Treatment Summary *
                  </label>
                  <textarea
                    {...register('treatmentSummary')}
                    rows={4}
                    className="input-field"
                    placeholder="Summarize the treatment provided during hospitalization..."
                  />
                  {errors.treatmentSummary && (
                    <p className="text-red-500 text-sm mt-1">{errors.treatmentSummary.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discharge Instructions *
                  </label>
                  <textarea
                    {...register('dischargeInstructions')}
                    rows={4}
                    className="input-field"
                    placeholder="Provide detailed instructions for home care..."
                  />
                  {errors.dischargeInstructions && (
                    <p className="text-red-500 text-sm mt-1">{errors.dischargeInstructions.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discharge Medications
                  </label>
                  <textarea
                    {...register('medications')}
                    rows={3}
                    className="input-field"
                    placeholder="List medications to continue at home..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Activity Restrictions
                  </label>
                  <textarea
                    {...register('restrictions')}
                    rows={3}
                    className="input-field"
                    placeholder="Any activity or dietary restrictions..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Emergency Contact Information
                </label>
                <textarea
                  {...register('emergencyContacts')}
                  rows={2}
                  className="input-field"
                  placeholder="Emergency contact details..."
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
                  {isSubmitting ? 'Processing...' : 'Complete Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Discharge Checklist */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Discharge Checklist
            </h2>

            <div className="space-y-3">
              {dischargeChecklist.map(item => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    item.checked 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-slate-300'
                  }`}>
                    {item.checked && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    item.checked ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Discharges */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Discharges
            </h2>

            <div className="space-y-4">
              {recentDischarges.map(discharge => (
                <div key={discharge.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{discharge.patientName}</h4>
                      <p className="text-sm text-slate-600 mt-1">{discharge.finalDiagnosis}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-slate-500">
                          Discharged: {discharge.dischargeDate}
                        </p>
                        <p className="text-slate-500">
                          Length of Stay: {discharge.lengthOfStay} days
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      discharge.dischargeType === 'routine'
                        ? 'bg-green-100 text-green-800'
                        : discharge.dischargeType === 'transfer'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {discharge.dischargeType.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discharge Statistics */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Today's Statistics</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending Discharges</span>
                <span className="text-lg font-semibold text-orange-600">{stats.pendingDischarges}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed Today</span>
                <span className="text-lg font-semibold text-green-600">{stats.completedToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Average Length of Stay</span>
                <span className="text-lg font-semibold text-slate-900">{stats.averageLengthOfStay} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Bed Availability</span>
                <span className="text-lg font-semibold text-teal-600">{stats.bedAvailability} beds</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Important Notes
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900">Documentation</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Ensure all medical records are complete before discharge.
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">Medication Safety</h4>
                <p className="text-red-700 text-sm mt-1">
                  Verify all medications and provide clear instructions.
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <h4 className="font-medium text-teal-900">Follow-up Care</h4>
                <p className="text-teal-700 text-sm mt-1">
                  Schedule necessary follow-up appointments before discharge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Discharge
