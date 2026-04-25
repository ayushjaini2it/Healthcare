import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, IndianRupee, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'

const billingSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'insurance']),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    category: z.enum(['consultation', 'lab', 'imaging', 'medication', 'procedure', 'room']),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
  })).min(1, 'At least one billing item is required'),
  notes: z.string().optional(),
})

type BillingFormData = z.infer<typeof billingSchema>

const Billing: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [billingSuccess, setBillingSuccess] = useState(false)
  const [billingItems, setBillingItems] = useState([
    { description: '', category: 'consultation' as const, quantity: 1, unitPrice: 0 }
  ])

  const [patients, setPatients] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadBillsData()
  }, [])

  const loadBillsData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch patients 
      const patientsData = await supabaseServices.patientServices.getAllPatients()
      const billingPatients = patientsData?.filter(p => p.status === 'billing' || p.status === 'treatment') || []
      
      // We map to match the previous UI structure
      setPatients(billingPatients.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        age: p.age,
        totalDue: 15000 // In a real app we'd calculate this from unpaid items
      })))

      // Fetch bills with items
      const { data: billsData } = await supabase
        .from('bills')
        .select('*, billing_items(*), patients(first_name, last_name)')
        .order('created_at', { ascending: false })
      
      setBills(billsData?.map(b => ({
        id: b.id,
        patient_id: b.patient_id,
        patientName: b.patients ? `${b.patients.first_name} ${b.patients.last_name}` : 'Unknown',
        totalAmount: b.total_amount,
        status: b.status,
        paymentDate: b.payment_date ? new Date(b.payment_date).toLocaleDateString() : null,
        paymentMethod: b.payment_method,
        items: b.billing_items?.length || 0
      })) || [])
    } catch (error) {
      console.error('Error loading bills:', error)
      setErrorMessage('Failed to load billing data')
    } finally {
      setIsLoading(false)
    }
  }

  const recentBills = bills;

  const standardRates = {
    consultation: 12450.00,
    lab: 6225.00,
    imaging: 20750.00,
    medication: 2075.00,
    procedure: 41500.00,
    room: 16600.00,
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      items: billingItems
    }
  })

  const selectedPatient = patients.find(p => p.id === watch('patientId'))

  const addBillingItem = () => {
    const newItems = [...billingItems, { description: '', category: 'consultation' as const, quantity: 1, unitPrice: 0 }]
    setBillingItems(newItems)
    setValue('items', newItems)
  }

  const removeBillingItem = (index: number) => {
    const newItems = billingItems.filter((_, i) => i !== index)
    setBillingItems(newItems)
    setValue('items', newItems)
  }

  const updateBillingItem = (index: number, field: string, value: any) => {
    const newItems = [...billingItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setBillingItems(newItems)
    setValue('items', newItems)
  }

  const calculateTotal = () => {
    return billingItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0)
  }

  const onSubmit = async (data: BillingFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      await createAndPayBill(data.patientId, billingItems, data.paymentMethod)
      
      console.log('Bill processed:', data)
      setBillingSuccess(true)
      setIsSubmitting(false)
      reset()
      setBillingItems([{ description: '', category: 'consultation' as const, quantity: 1, unitPrice: 0 }])
      
      setTimeout(() => setBillingSuccess(false), 5000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing bill')
      setIsSubmitting(false)
    }
  }

  const createAndPayBill = async (patientId: string, items: any[], paymentMethod: string) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    
    // Convert property names for the service
    const mappedItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      category: item.category
    }))
    
    const bill = await supabaseServices.billingServices.createBill(
      patientId,
      mappedItems,
      totalAmount
    )
    
    if (bill && bill.id) {
       await supabaseServices.billingServices.updateBillStatus(
         bill.id,
         'paid',
         paymentMethod
       )
    }
    
    await supabaseServices.patientServices.updatePatientStatus(
      patientId,
      'discharge'
    )
    
    await loadBillsData()
  }

  if (billingSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Bill Processed Successfully!</h3>
              <p className="text-green-700 mt-1">
                Patient bill has been processed and payment recorded.
              </p>
              <button
                onClick={() => setBillingSuccess(false)}
                className="mt-3 btn-primary"
              >
                Process Another Bill
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3">Loading billing data...</span>
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
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payment</h1>
        <p className="text-gray-600 mt-2">
          Process patient bills and manage payments for healthcare services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <IndianRupee className="h-5 w-5 mr-2" />
              Process Patient Bill
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient *
                  </label>
                  <select {...register('patientId')} className="input-field">
                    <option value="">Select patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - Balance: ₹{patient.totalDue.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select {...register('paymentMethod')} className="input-field">
                    <option value="">Select payment method</option>
                    <option value="cash">Cash (₹)</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="upi">UPI/PhonePe</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="insurance">Insurance</option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Patient Information</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Name:</span>
                      <span className="text-blue-900 ml-2">{selectedPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Age:</span>
                      <span className="text-blue-900 ml-2">{selectedPatient.age}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700">Current Balance:</span>
                      <span className="text-blue-900 ml-2 font-semibold">
                        ₹{selectedPatient.totalDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Billing Items</h3>
                  <button
                    type="button"
                    onClick={addBillingItem}
                    className="btn-secondary text-sm"
                  >
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {billingItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <input
                            value={item.description}
                            onChange={(e) => updateBillingItem(index, 'description', e.target.value)}
                            className="input-field"
                            placeholder="Service description"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const category = e.target.value as keyof typeof standardRates
                              updateBillingItem(index, 'category', category)
                              updateBillingItem(index, 'unitPrice', standardRates[category])
                            }}
                            className="input-field"
                          >
                            <option value="consultation">Consultation</option>
                            <option value="lab">Lab Test</option>
                            <option value="imaging">Imaging</option>
                            <option value="medication">Medication</option>
                            <option value="procedure">Procedure</option>
                            <option value="room">Room</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateBillingItem(index, 'quantity', parseInt(e.target.value))}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateBillingItem(index, 'unitPrice', parseFloat(e.target.value))}
                              className="input-field pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Line Total: ₹{(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                        {billingItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBillingItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field"
                  placeholder="Any additional billing notes..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setBillingItems([{ description: '', category: 'consultation' as const, quantity: 1, unitPrice: 0 }])
                  }}
                  className="btn-secondary"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Bills */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Bills
            </h2>

            <div className="space-y-4">
              {recentBills.map(bill => (
                <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{bill.patientName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {bill.items} items - ₹{bill.totalAmount.toFixed(2)}
                      </p>
                      {bill.paymentDate && (
                        <p className="text-sm text-gray-500">
                          Paid: {bill.paymentDate}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className={`flex items-center text-sm font-medium ${
                      bill.status === 'paid' 
                        ? 'text-green-600'
                        : bill.status === 'partial'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {bill.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {bill.status === 'partial' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {bill.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </div>
                    {bill.paymentMethod && (
                      <span className="text-xs text-gray-500">{bill.paymentMethod}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Rates */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <IndianRupee className="h-5 w-5 mr-2" />
              Standard Rates
            </h2>

            <div className="space-y-3">
              {Object.entries(standardRates).map(([category, rate]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-primary-600">
                    ₹{rate.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Bills Processed</span>
                <span className="text-lg font-semibold text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-lg font-semibold text-green-600">¥701,910.25</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Payments</span>
                <span className="text-lg font-semibold text-yellow-600">¥102,463.50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Bill Amount</span>
                <span className="text-lg font-semibold text-gray-900">¥58,492.59</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Billing
