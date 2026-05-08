import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'
import { Pill, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'

const Pharmacy: React.FC = () => {
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')
  
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>(prefillPatientId || '')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [treatment, setTreatment] = useState<any>(null)
  const [medications, setMedications] = useState<any[]>([])

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      loadPrescriptions(selectedPatientId)
    } else {
      setTreatment(null)
      setMedications([])
    }
  }, [selectedPatientId])

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const data = await supabaseServices.patientServices.getPatientsByStatus(['treatment', 'pharmacy'])
      setPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
      setErrorMessage('Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPrescriptions = async (patientId: string) => {
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
      setErrorMessage('Failed to load prescriptions for this patient.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDispense = async () => {
    if (!selectedPatientId || medications.length === 0) return
    setIsProcessing(true)
    setErrorMessage('')
    try {
      // Mark medications as dispensed
      for (const med of medications) {
        if (med.status !== 'dispensed') {
          await supabase.from('medications').update({ status: 'dispensed' }).eq('id', med.id)
        }
      }
      
      // Update patient status to 'pharmacy' so dashboard sends them to Billing next
      await supabaseServices.patientServices.updatePatientStatus(selectedPatientId, 'pharmacy')
      
      setSuccessMessage('Medications dispensed successfully!')
      loadPrescriptions(selectedPatientId) // Reload to show dispensed status
      
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (error) {
      console.error('Error dispensing:', error)
      setErrorMessage('Failed to process dispensation.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pharmacy & Dispensary</h1>
        <p className="text-slate-600 mt-2">Review prescriptions and dispense medications to patients.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <span className="text-green-700 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Patient</h2>
            {isLoading && !patients.length ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
            ) : (
              <select 
                className="input-field w-full"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Choose a Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.status.replace(/_/g, ' ')})</option>
                ))}
              </select>
            )}
            
            <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
               <h3 className="text-sm font-semibold text-teal-900 mb-2 flex items-center"><Pill className="h-4 w-4 mr-2" /> Pharmacy Rules</h3>
               <ul className="text-sm text-teal-700 space-y-2 list-disc pl-4">
                 <li>Verify patient identity before dispensing.</li>
                 <li>Check for known allergies.</li>
                 <li>Provide dosage instructions clearly.</li>
               </ul>
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="lg:col-span-2">
          {!selectedPatientId ? (
            <div className="card flex flex-col items-center justify-center p-12 text-slate-400">
              <Pill className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Select a patient to view their prescriptions</p>
            </div>
          ) : isLoading ? (
            <div className="card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : !treatment ? (
            <div className="card flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
              <AlertCircle className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-lg font-medium text-slate-700">No active treatment plan found</p>
              <p className="text-sm text-center mt-2">This patient has not been prescribed any treatment yet.</p>
            </div>
          ) : (
            <div className="card space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Active Prescriptions</h2>
                  <p className="text-slate-500 text-sm mt-1">Treatment Plan ID: {treatment.id.slice(0, 8)}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                  {medications.length} Medication{medications.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-2">Doctor's Notes:</h3>
                <p className="text-slate-700 text-sm">{treatment.plan || 'No additional notes provided.'}</p>
              </div>

              {medications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                  No specific medications prescribed in this treatment plan.
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-teal-500" />
                          <h4 className="font-bold text-slate-900 text-lg">{med.name}</h4>
                          {med.status === 'dispensed' ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><CheckCircle className="h-3 w-3 mr-1"/> Dispensed</span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><Clock className="h-3 w-3 mr-1"/> Pending</span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <p><span className="text-slate-500">Dosage:</span> <span className="font-medium text-slate-900">{med.dosage}</span></p>
                          <p><span className="text-slate-500">Frequency:</span> <span className="font-medium text-slate-900">{med.frequency}</span></p>
                          <p><span className="text-slate-500">Duration:</span> <span className="font-medium text-slate-900">{med.duration}</span></p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 inline-block px-2 py-1 rounded">
                          <span className="font-medium">Instructions:</span> {med.instructions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleDispense}
                  disabled={isProcessing || medications.length === 0 || medications.every(m => m.status === 'dispensed')}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <><CheckCircle className="h-5 w-5 mr-2" /> Mark All as Dispensed</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pharmacy
