import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabaseServices } from '../services/supabaseServices'
import { CreditCard, CheckCircle, AlertCircle, FileText, Loader2, Plus, DollarSign } from 'lucide-react'

const Billing: React.FC = () => {
  const [searchParams] = useSearchParams()
  const prefillPatientId = searchParams.get('patientId')
  
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>(prefillPatientId || '')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [bill, setBill] = useState<any>(null)

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      loadBill(selectedPatientId)
    } else {
      setBill(null)
    }
  }, [selectedPatientId])

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const data = await supabaseServices.patientServices.getPatientsByStatus(['pharmacy', 'billing'])
      setPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
      setErrorMessage('Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBill = async (patientId: string) => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      
      const existingBill = await supabaseServices.billingServices.getPatientBill(patientId)
      if (existingBill) {
        setBill(existingBill)
      } else {
        setBill(null)
      }
    } catch (error) {
      console.error('Error loading bill:', error)
      setErrorMessage('Failed to load billing records.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!selectedPatientId) return
    setIsProcessing(true)
    setErrorMessage('')
    try {
      const items: any[] = []

      // 1. Fetch Consultations
      const consultations = await supabaseServices.consultationServices.getPatientConsultations(selectedPatientId)
      if (consultations && consultations.length > 0) {
        items.push({
          description: `Consultation Visits (${consultations.length})`,
          quantity: consultations.length,
          unitPrice: 150,
          totalPrice: consultations.length * 150,
          category: 'consultation' as const
        })
      }

      // 2. Fetch Lab Tests
      const diagnoses = await supabaseServices.diagnosisServices.getPatientDiagnoses(selectedPatientId)
      if (diagnoses && diagnoses.length > 0) {
        items.push({
          description: `Laboratory Tests (${diagnoses.length})`,
          quantity: diagnoses.length,
          unitPrice: 85,
          totalPrice: diagnoses.length * 85,
          category: 'lab' as const
        })
      }

      // 3. Fetch Medications
      const treatment = await supabaseServices.treatmentServices.getPatientTreatment(selectedPatientId)
      if (treatment && treatment.id) {
        const meds = await supabaseServices.treatmentServices.getTreatmentMedications(treatment.id)
        if (meds && meds.length > 0) {
          items.push({
            description: `Prescription Medications (${meds.length})`,
            quantity: meds.length,
            unitPrice: 45,
            totalPrice: meds.length * 45,
            category: 'medication' as const
          })
        }
      }

      // 4. Default Base Charge if no records exist yet
      if (items.length === 0) {
         items.push({
          description: 'General Hospital Stay (Base Charge)',
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200,
          category: 'consultation' as const
        })
      }

      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
      
      const newBill = await supabaseServices.billingServices.createBill(selectedPatientId, items, totalAmount)
      setBill({ ...newBill, billing_items: items })
      setSuccessMessage('Invoice generated successfully!')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (error) {
      console.error('Error generating bill:', error)
      setErrorMessage('Failed to generate invoice.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!bill) return
    setIsProcessing(true)
    try {
      await supabaseServices.billingServices.updateBillStatus(bill.id, 'paid', 'Credit Card')
      await supabaseServices.patientServices.updatePatientStatus(selectedPatientId, 'billing')
      
      setSuccessMessage('Payment processed successfully!')
      loadBill(selectedPatientId)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (error) {
      console.error('Error processing payment:', error)
      setErrorMessage('Failed to process payment.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing & Payments</h1>
        <p className="text-slate-600 mt-2">Generate invoices and process payments for patient services.</p>
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
            
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
               <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center"><CreditCard className="h-4 w-4 mr-2" /> Payment Info</h3>
               <p className="text-sm text-orange-700">
                 Ensure all charges from consultations, labs, and pharmacy are consolidated before finalizing the bill.
               </p>
            </div>
          </div>
        </div>

        {/* Billing Details */}
        <div className="lg:col-span-2">
          {!selectedPatientId ? (
            <div className="card flex flex-col items-center justify-center p-12 text-slate-400">
              <CreditCard className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Select a patient to manage billing</p>
            </div>
          ) : isLoading ? (
            <div className="card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : !bill ? (
            <div className="card flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
              <FileText className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-lg font-medium text-slate-700">No invoice generated</p>
              <p className="text-sm text-center mt-2 mb-6">There is no active bill for this patient.</p>
              <button onClick={handleGenerateInvoice} disabled={isProcessing} className="btn-primary flex items-center">
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Generate Consolidated Invoice
              </button>
            </div>
          ) : (
            <div className="card space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Patient Invoice</h2>
                  <p className="text-slate-500 text-sm mt-1">Invoice ID: {bill.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  {bill.status === 'paid' ? (
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2"/> PAID
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-200 flex items-center">
                      <Clock className="h-4 w-4 mr-2"/> PENDING
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Description</th>
                      <th className="py-3 px-4 font-semibold text-center">Qty</th>
                      <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.billing_items?.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-medium text-slate-900">{item.description}</td>
                        <td className="py-4 px-4 text-center text-slate-600">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-slate-600">${item.unit_price}</td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-900">${item.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-4 px-4 text-right font-bold text-slate-900 text-lg">Total Amount:</td>
                      <td className="py-4 px-4 text-right font-bold text-teal-600 text-xl">${bill.total_amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {bill.status === 'pending' && (
                <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="btn-primary bg-green-600 hover:bg-green-700 flex items-center disabled:opacity-50 border-none"
                  >
                    {isProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <><DollarSign className="h-5 w-5 mr-2" /> Accept Payment</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Billing
