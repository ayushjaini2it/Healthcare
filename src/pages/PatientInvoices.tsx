import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseServices } from '../services/supabaseServices'
import { CreditCard, CheckCircle, AlertCircle, FileText, Loader2, Clock } from 'lucide-react'

const PatientInvoices: React.FC = () => {
  const { currentUser } = useAuth()
  const patientId = currentUser?.profile?.id
  
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [bill, setBill] = useState<any>(null)

  useEffect(() => {
    if (patientId) {
      loadMyBill()
    } else {
      setIsLoading(false)
    }
  }, [patientId])

  const loadMyBill = async () => {
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
      setErrorMessage('Failed to load your billing records.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Bills & Invoices</h1>
        <p className="text-slate-600 mt-2">View and track your hospital bills and payments.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : !bill ? (
        <div className="card flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
          <FileText className="h-12 w-12 mb-3 text-slate-300" />
          <p className="text-lg font-medium text-slate-700">No active bills</p>
          <p className="text-sm text-center mt-2">You do not have any pending or recent invoices.</p>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Hospital Invoice</h2>
              <p className="text-slate-500 text-sm mt-1">Invoice ID: {bill.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              {bill.status === 'paid' ? (
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2"/> PAID
                </span>
              ) : (
                <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-200 flex items-center">
                  <Clock className="h-4 w-4 mr-2"/> PENDING PAYMENT
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
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-right font-bold text-slate-900 text-lg rounded-bl-lg">Total Amount Due:</td>
                  <td className="py-4 px-4 text-right font-bold text-teal-600 text-xl rounded-br-lg">${bill.total_amount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {bill.status === 'pending' && (
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
              <p className="text-sm text-slate-500 italic mt-2 mr-4">Please proceed to the hospital billing desk to complete your payment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PatientInvoices
