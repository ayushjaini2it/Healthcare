import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseServices } from '../services/supabaseServices'
import { Pill, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

const PatientMedications: React.FC = () => {
  const { currentUser } = useAuth()
  const patientId = currentUser?.profile?.id
  
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [treatment, setTreatment] = useState<any>(null)
  const [medications, setMedications] = useState<any[]>([])

  useEffect(() => {
    if (patientId) {
      loadMyPrescriptions()
    } else {
      setIsLoading(false)
    }
  }, [patientId])

  const loadMyPrescriptions = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      
      const treat = await supabaseServices.treatmentServices.getPatientTreatment(patientId)
      if (treat) {
        setTreatment(treat)
        const meds = await supabaseServices.treatmentServices.getTreatmentMedications(treat.id)
        setMedications(meds || [])
      } else {
        setTreatment(null)
        setMedications([])
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error)
      setErrorMessage('Failed to load your prescriptions.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Medications</h1>
        <p className="text-slate-600 mt-2">View your active prescriptions and treatment plan.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : !treatment ? (
        <div className="card flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
          <AlertCircle className="h-12 w-12 mb-3 text-slate-300" />
          <p className="text-lg font-medium text-slate-700">No active prescriptions</p>
          <p className="text-sm text-center mt-2">You currently have no active treatment plans or medications prescribed.</p>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Current Treatment Plan</h2>
              <p className="text-slate-500 text-sm mt-1">Prescribed on: {new Date(treatment.created_at).toLocaleDateString()}</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
              {medications.length} Medication{medications.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
            <h3 className="font-semibold text-teal-900 mb-2">Doctor's Notes:</h3>
            <p className="text-teal-800 text-sm">{treatment.plan || 'No additional notes provided.'}</p>
          </div>

          {medications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No specific medications prescribed in this treatment plan.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg">Prescriptions</h3>
              {medications.map((med) => (
                <div key={med.id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-teal-500" />
                      <h4 className="font-bold text-slate-900 text-lg">{med.name}</h4>
                      {med.status === 'dispensed' ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><CheckCircle className="h-3 w-3 mr-1"/> Ready at Pharmacy</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><Clock className="h-3 w-3 mr-1"/> Processing</span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p><span className="text-slate-500 block mb-0.5">Dosage</span> <span className="font-semibold text-slate-900">{med.dosage}</span></p>
                      <p><span className="text-slate-500 block mb-0.5">Frequency</span> <span className="font-semibold text-slate-900">{med.frequency}</span></p>
                      <p><span className="text-slate-500 block mb-0.5">Duration</span> <span className="font-semibold text-slate-900">{med.duration}</span></p>
                    </div>
                    {med.instructions && (
                      <p className="mt-3 text-sm text-slate-700 flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 text-teal-600 shrink-0 mt-0.5" />
                        <span><span className="font-medium text-slate-900">Instructions:</span> {med.instructions}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PatientMedications
