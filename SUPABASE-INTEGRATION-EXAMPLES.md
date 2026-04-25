# Supabase Integration Examples

This file contains practical examples of how to integrate Supabase services into your React components.

## 1. Patient Registration Component with Supabase

### Before (without Supabase)
```typescript
const onSubmit = async (data: PatientFormData) => {
  setIsSubmitting(true)
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('Patient registered:', data)
  setRegistrationSuccess(true)
  setIsSubmitting(false)
  reset()
}
```

### After (with Supabase)
```typescript
import { patientServices } from '../services/supabaseServices'

const onSubmit = async (data: PatientFormData) => {
  setIsSubmitting(true)
  try {
    const patientData = {
      name: `${data.firstName} ${data.lastName}`,
      age: data.age,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: {
        name: data.emergencyContactName,
        phone: data.emergencyContactPhone,
        relationship: data.emergencyContactRelationship
      },
      medicalHistory: data.medicalHistory?.split(',').map(h => h.trim()) || [],
      allergies: data.allergies?.split(',').map(a => a.trim()) || [],
      registrationDate: new Date(),
      status: 'registered' as const
    }

    await patientServices.registerPatient(patientData)
    setRegistrationSuccess(true)
    reset()
  } catch (error) {
    console.error('Error registering patient:', error)
    setError('Failed to register patient. Please try again.')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 2. Consultation Component with Supabase

### Implementation
```typescript
import React, { useState, useEffect } from 'react'
import { consultationServices, patientServices } from '../services/supabaseServices'

const Consultation: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load patients on component mount
  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const data = await patientServices.getAllPatients()
      setPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
    }
  }

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true)
    try {
      await consultationServices.createConsultation({
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: new Date(),
        symptoms: data.symptoms.split(',').map(s => s.trim()),
        diagnosis: data.preliminaryDiagnosis,
        notes: data.notes,
        vitalSigns: {
          bloodPressure: data.bloodPressure,
          heartRate: data.heartRate,
          temperature: data.temperature,
          weight: data.weight,
          height: data.height
        },
        status: 'completed'
      })

      // Update patient status
      await patientServices.updatePatientStatus(data.patientId, 'in_consultation')
      
      setConsultationSuccess(true)
      reset()
    } catch (error) {
      console.error('Error creating consultation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    // Component JSX
    <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
      <option value="">Select a patient</option>
      {patients.map(patient => (
        <option key={patient.id} value={patient.id}>
          {patient.first_name} {patient.last_name}
        </option>
      ))}
    </select>
  )
}

export default Consultation
```

---

## 3. Dashboard Component with Real-time Updates

### Implementation
```typescript
import React, { useState, useEffect } from 'react'
import { patientServices, subscriptionServices } from '../services/supabaseServices'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsInConsultation: 0,
    patientsInTreatment: 0,
    recentPatients: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const patients = await patientServices.getAllPatients()
      
      setStats({
        totalPatients: patients?.length || 0,
        patientsInConsultation: patients?.filter(p => p.status === 'in_consultation').length || 0,
        patientsInTreatment: patients?.filter(p => p.status === 'treatment').length || 0,
        recentPatients: patients?.slice(0, 5) || []
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        <div className="stat">
          <div className="stat-value">{stats.totalPatients}</div>
          <div className="stat-label">Total Patients</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.patientsInConsultation}</div>
          <div className="stat-label">In Consultation</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.patientsInTreatment}</div>
          <div className="stat-label">In Treatment</div>
        </div>
      </div>

      <div className="recent-patients">
        <h2>Recent Patients</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentPatients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.first_name} {patient.last_name}</td>
                <td>{patient.age}</td>
                <td>{patient.status}</td>
                <td>{new Date(patient.registration_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
```

---

## 4. Diagnosis Component with Supabase

### Implementation
```typescript
import React, { useState, useEffect } from 'react'
import { diagnosisServices, consultationServices } from '../services/supabaseServices'

const Diagnosis: React.FC = () => {
  const [patientId, setPatientId] = useState<string>('')
  const [recentConsultation, setRecentConsultation] = useState<any>(null)
  const [diagnoses, setDiagnoses] = useState<any[]>([])

  useEffect(() => {
    if (patientId) {
      loadPatientDiagnoses()
      loadRecentConsultation()
    }
  }, [patientId])

  const loadPatientDiagnoses = async () => {
    try {
      const data = await diagnosisServices.getPatientDiagnoses(patientId)
      setDiagnoses(data || [])
    } catch (error) {
      console.error('Error loading diagnoses:', error)
    }
  }

  const loadRecentConsultation = async () => {
    try {
      const consultations = await consultationServices.getPatientConsultations(patientId)
      if (consultations && consultations.length > 0) {
        setRecentConsultation(consultations[0])
      }
    } catch (error) {
      console.error('Error loading consultation:', error)
    }
  }

  const onSubmit = async (data: DiagnosisFormData) => {
    try {
      await diagnosisServices.createDiagnosis({
        patientId,
        consultationId: recentConsultation.id,
        type: data.testType,
        testName: data.testName,
        results: data.results,
        interpretation: data.interpretation,
        date: new Date(),
        status: 'completed'
      })

      loadPatientDiagnoses()
    } catch (error) {
      console.error('Error creating diagnosis:', error)
    }
  }

  return (
    // Component JSX
    <div>
      {/* Patient selector */}
      {/* Form for new diagnosis */}
      {/* List of existing diagnoses */}
    </div>
  )
}

export default Diagnosis
```

---

## 5. Pharmacy Component with Real-time Medication Updates

### Implementation
```typescript
import React, { useState, useEffect } from 'react'
import { treatmentServices } from '../services/supabaseServices'

const Pharmacy: React.FC = () => {
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [medications, setMedications] = useState<any[]>([])

  useEffect(() => {
    if (treatmentId) {
      loadMedications()
    }
  }, [treatmentId])

  const loadMedications = async () => {
    try {
      const data = await treatmentServices.getTreatmentMedications(treatmentId)
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const markAsDispensed = async (medicationId: string) => {
    try {
      await supabase
        .from('medications')
        .update({ status: 'dispensed' })
        .eq('id', medicationId)

      loadMedications()
    } catch (error) {
      console.error('Error updating medication:', error)
    }
  }

  return (
    <div>
      <h2>Medication Dispensing</h2>
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {medications.map(med => (
            <tr key={med.id}>
              <td>{med.medication_name}</td>
              <td>{med.dosage}</td>
              <td>{med.frequency}</td>
              <td>{med.status}</td>
              <td>
                <button
                  onClick={() => markAsDispensed(med.id)}
                  disabled={med.status === 'dispensed'}
                >
                  Mark as Dispensed
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Pharmacy
```

---

## 6. Billing Component with Supabase

### Implementation
```typescript
import React, { useState, useEffect } from 'react'
import { billingServices } from '../services/supabaseServices'

const Billing: React.FC = () => {
  const [patientId, setPatientId] = useState<string>('')
  const [bill, setBill] = useState<any>(null)
  const [billItems, setBillItems] = useState<any[]>([])

  useEffect(() => {
    if (patientId) {
      loadBill()
    }
  }, [patientId])

  const loadBill = async () => {
    try {
      const data = await billingServices.getPatientBill(patientId)
      setBill(data)
      setBillItems(data?.billing_items || [])
    } catch (error) {
      console.error('Error loading bill:', error)
    }
  }

  const markAsPaid = async () => {
    if (!bill) return

    try {
      await billingServices.updateBillStatus(bill.id, 'paid', 'Credit Card')
      loadBill()
    } catch (error) {
      console.error('Error updating bill:', error)
    }
  }

  return (
    <div>
      <h2>Patient Billing</h2>
      {bill && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map(item => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unit_price}</td>
                  <td>${item.total_price}</td>
                  <td>{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="bill-summary">
            <h3>Total Amount: ${bill.total_amount}</h3>
            <p>Status: {bill.status}</p>
            
            <button
              onClick={markAsPaid}
              disabled={bill.status === 'paid'}
            >
              {bill.status === 'paid' ? 'Already Paid' : 'Mark as Paid'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
```

---

## 7. Feedback Component with Supabase

### Implementation
```typescript
import React, { useState } from 'react'
import { feedbackServices } from '../services/supabaseServices'

const Feedback: React.FC = () => {
  const [patientId, setPatientId] = useState<string>('')
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState('')
  const [category, setCategory] = useState<'overall' | 'staff' | 'facility' | 'treatment'>('overall')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await feedbackServices.submitFeedback({
        patientId,
        rating,
        comments,
        category
      })

      // Reset form
      setRating(5)
      setComments('')
      setCategory('overall')
      alert('Feedback submitted successfully!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
        <option value="overall">Overall Experience</option>
        <option value="staff">Staff</option>
        <option value="facility">Facility</option>
        <option value="treatment">Treatment</option>
      </select>

      <div>
        <label>Rating (1-5 stars)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
        />
      </div>

      <textarea
        placeholder="Please share your feedback..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}

export default Feedback
```

---

## Error Handling Best Practices

When using Supabase services, always handle errors appropriately:

```typescript
try {
  const patient = await patientServices.getPatientById(patientId)
  // Use patient data
} catch (error) {
  if (error.code === 'PGRST116') {
    // Record not found
    console.error('Patient not found')
  } else if (error.code === 'PGRST204') {
    // No content
    console.error('No data returned')
  } else {
    // Other error
    console.error('Error:', error.message)
  }
}
```

---

## Tips for Implementation

1. **Always include try-catch blocks** around Supabase calls
2. **Set loading states** to improve UX
3. **Show error messages** to users in a friendly way
4. **Debounce search queries** to reduce database calls
5. **Use pagination** for large datasets
6. **Cache data** where appropriate using React state or Context
7. **Unsubscribe from subscriptions** in useEffect cleanup functions

---

## Performance Optimization

### Query Optimization
```typescript
// ❌ Bad: Loading all related data
const { data } = await supabase
  .from('patients')
  .select('*, consultations(*), diagnoses(*), treatments(*)')

// ✅ Good: Select only needed columns
const { data } = await supabase
  .from('patients')
  .select('id, first_name, last_name, status, registration_date')
```

### Pagination
```typescript
const pageSize = 10
const pageNumber = 0

const { data } = await supabase
  .from('patients')
  .select('*')
  .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)
```

---

For more information, see `SUPABASE-SETUP-GUIDE.md`
