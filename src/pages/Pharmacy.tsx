import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pill, Package, Clock, CheckCircle, AlertTriangle, Search, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'

const pharmacySchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  prescriptionId: z.string().min(1, 'Please select a prescription'),
  medicationId: z.string().min(1, 'Please select a medication'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  dispensingNotes: z.string().optional(),
  pharmacistNotes: z.string().optional(),
})

type PharmacyFormData = z.infer<typeof pharmacySchema>

const Pharmacy: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dispensingSuccess, setDispensingSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [treatments, setTreatments] = useState<any[]>([])
  const [medicationsList, setMedicationsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadMedications()
  }, [])

  const loadMedications = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all treatments with status 'planned'
      const { data: treatmentsData } = await supabase
        .from('treatments')
        .select('*, patients(*)')
        .eq('status', 'planned')
      
      setTreatments(treatmentsData || [])

      // Fetch all prescribed medications
      const { data: medicationsData } = await supabase
        .from('medications')
        .select('*, treatments(*)')
        .eq('status', 'prescribed')
      
      setMedicationsList(medicationsData || [])
    } catch (error) {
      console.error('Error loading medications:', error)
      setErrorMessage('Failed to load medication data')
    } finally {
      setIsLoading(false)
    }
  }

  // We map the database records into arrays to show in the UI
  // Note: For a fully functioning frontend without mock data, we could just rely entirely on DB relationships.
  // For simplicity to keep the component's existing structure functioning:
  const patients = treatments.map(t => ({ id: t.patients.id, name: `${t.patients.first_name} ${t.patients.last_name}`, prescription: t.treatment_plan }))
  const prescriptions = treatments.map(t => ({
    id: t.id,
    patientId: t.patients.id,
    patientName: `${t.patients.first_name} ${t.patients.last_name}`,
    medications: medicationsList.filter(m => m.treatment_id === t.id).map(m => ({
      id: m.id, name: m.medication_name, dosage: m.dosage, frequency: m.frequency, duration: m.duration
    })),
    prescribedDate: new Date(t.created_at).toLocaleDateString(),
    doctor: 'Assigned Doctor', // In a full implementation, you'd fetch doctor info too
    status: t.status
  }))
  const medications = medicationsList.map(m => ({
    id: m.id, name: m.medication_name, stock: 100, unit: 'units', lowStockThreshold: 20 // Mock inventory values
  }))
  const recentDispensing: any[] = [] // In full implementation, fetch dispensed medications

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PharmacyFormData>({
    resolver: zodResolver(pharmacySchema)
  })

  const selectedPatient = patients.find(p => p.id === watch('patientId'))
  const selectedPrescription = prescriptions.find(p => p.id === watch('prescriptionId'))
  const selectedMedication = medications.find(m => m.id === watch('medicationId'))

  const onSubmit = async (data: PharmacyFormData) => {
    setIsSubmitting(true)
    
    await markAsDispensed(data.medicationId);
    
    console.log('Medication dispensed:', data)
    setDispensingSuccess(true)
    setIsSubmitting(false)
    reset()
    
    setTimeout(() => setDispensingSuccess(false), 5000)
  }

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const markAsDispensed = async (medicationId: string) => {
    try {
      await supabase
        .from('medications')
        .update({ status: 'dispensed' })
        .eq('id', medicationId)
      
      // Reload medications
      loadMedications()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (dispensingSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Medication Dispensed!</h3>
              <p className="text-green-700 mt-1">
                Medication has been successfully dispensed to the patient.
              </p>
              <button
                onClick={() => setDispensingSuccess(false)}
                className="mt-3 btn-primary"
              >
                Dispense Another Medication
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
          <span className="ml-3">Loading medications...</span>
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
        <h1 className="text-3xl font-bold text-gray-900">Pharmacy & Medication</h1>
        <p className="text-gray-600 mt-2">
          Manage medication dispensing and inventory for patients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dispensing Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Pill className="h-5 w-5 mr-2" />
              Dispense Medication
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient and Prescription Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient *
                  </label>
                  <select {...register('patientId')} className="input-field">
                    <option value="">Select patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.prescription}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescription *
                  </label>
                  <select {...register('prescriptionId')} className="input-field">
                    <option value="">Select prescription</option>
                    {prescriptions
                      .filter(p => !selectedPatient || p.patientId === selectedPatient.id)
                      .map(prescription => (
                        <option key={prescription.id} value={prescription.id}>
                          {prescription.patientName} - {prescription.medications[0].name}
                        </option>
                      ))}
                  </select>
                  {errors.prescriptionId && (
                    <p className="text-red-500 text-sm mt-1">{errors.prescriptionId.message}</p>
                  )}
                </div>
              </div>

              {/* Prescription Details */}
              {selectedPrescription && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Prescription Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-blue-700">
                      <strong>Patient:</strong> {selectedPrescription.patientName}
                    </p>
                    <p className="text-blue-700">
                      <strong>Doctor:</strong> {selectedPrescription.doctor}
                    </p>
                    <p className="text-blue-700">
                      <strong>Date:</strong> {selectedPrescription.prescribedDate}
                    </p>
                    <div className="mt-2">
                      <strong className="text-blue-700">Medications:</strong>
                      <ul className="list-disc list-inside text-blue-600 mt-1">
                        {selectedPrescription.medications.map(med => (
                          <li key={med.id}>
                            {med.name} {med.dosage} - {med.frequency} for {med.duration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Medication Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication to Dispense *
                </label>
                <select {...register('medicationId')} className="input-field">
                  <option value="">Select medication</option>
                  {medications.map(medication => (
                    <option key={medication.id} value={medication.id}>
                      {medication.name} (Stock: {medication.stock} {medication.unit})
                    </option>
                  ))}
                </select>
                {errors.medicationId && (
                  <p className="text-red-500 text-sm mt-1">{errors.medicationId.message}</p>
                )}
              </div>

              {/* Medication Info */}
              {selectedMedication && (
                <div className={`p-4 rounded-lg ${
                  selectedMedication.stock <= selectedMedication.lowStockThreshold
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedMedication.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Current Stock: {selectedMedication.stock} {selectedMedication.unit}
                      </p>
                    </div>
                    {selectedMedication.stock <= selectedMedication.lowStockThreshold && (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Low Stock</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    {...register('quantity', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispensing Notes
                  </label>
                  <textarea
                    {...register('dispensingNotes')}
                    rows={3}
                    className="input-field"
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacist Notes
                </label>
                <textarea
                  {...register('pharmacistNotes')}
                  rows={3}
                  className="input-field"
                  placeholder="Pharmacist observations..."
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
                  {isSubmitting ? 'Dispensing...' : 'Dispense Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Inventory Status */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Inventory Status
            </h2>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search medications..."
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredMedications.map(medication => (
                <div key={medication.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{medication.name}</h4>
                      <p className="text-sm text-gray-600">
                        {medication.stock} {medication.unit}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      medication.stock <= medication.lowStockThreshold
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {medication.stock <= medication.lowStockThreshold ? 'Low' : 'In Stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Dispensing */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Dispensing
            </h2>

            <div className="space-y-3">
              {recentDispensing.map(dispensing => (
                <div key={dispensing.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{dispensing.patientName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{dispensing.medication}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {dispensing.quantity} - {dispensing.dispensedDate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{dispensing.pharmacist}</span>
                    <div className={`flex items-center text-sm font-medium ${
                      dispensing.status === 'completed' 
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}>
                      {dispensing.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {dispensing.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {dispensing.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pharmacy
