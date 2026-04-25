# Step 7.4 - Remaining Component Updates

This guide covers the remaining components: Pharmacy, Billing, Discharge, and Feedback.

---

## Pharmacy Component (src/pages/Pharmacy.tsx)

### Changes to Make:

**1. Update imports:**
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { Pill, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
```

**2. Add state for data loading:**
```typescript
const [treatments, setTreatments] = useState<any[]>([])
const [medications, setMedications] = useState<any[]>([])
const [isLoading, setIsLoading] = useState(true)
const [errorMessage, setErrorMessage] = useState('')
```

**3. Add useEffect to load medications:**
```typescript
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
    
    setMedications(medicationsData || [])
  } catch (error) {
    console.error('Error loading medications:', error)
    setErrorMessage('Failed to load medication data')
  } finally {
    setIsLoading(false)
  }
}
```

**4. Add function to mark medication as dispensed:**
```typescript
const markAsDispensed = async (medicationId: string) => {
  try {
    await supabase
      .from('medications')
      .update({ status: 'dispensed' })
      .eq('id', medicationId)
    
    loadMedications()
  } catch (error) {
    console.error('Error updating medication:', error)
    setErrorMessage('Failed to update medication status')
  }
}
```

**5. Add loading and error UI:**
```typescript
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
    {/* ... */}
    {errorMessage && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        <span className="text-red-700">{errorMessage}</span>
      </div>
    )}
    {/* ... */}
  </div>
)
```

---

## Billing Component (src/pages/Billing.tsx)

### Changes to Make:

**1. Update imports:**
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { DollarSign, FileText, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
```

**2. Add state for data loading:**
```typescript
const [patients, setPatients] = useState<any[]>([])
const [bills, setBills] = useState<any[]>([])
const [selectedBill, setSelectedBill] = useState<any>(null)
const [isLoading, setIsLoading] = useState(true)
const [errorMessage, setErrorMessage] = useState('')
```

**3. Add useEffect to load bills:**
```typescript
useEffect(() => {
  loadBillsData()
}, [])

const loadBillsData = async () => {
  try {
    setIsLoading(true)
    
    // Fetch patients with status 'billing'
    const patientsData = await supabaseServices.patientServices.getAllPatients()
    const billingPatients = patientsData?.filter(p => p.status === 'billing') || []
    setPatients(billingPatients)

    // Fetch bills with items
    const { data: billsData } = await supabase
      .from('bills')
      .select('*, billing_items(*)')
      .in('patient_id', billingPatients.map(p => p.id))
    
    setBills(billsData || [])
  } catch (error) {
    console.error('Error loading bills:', error)
    setErrorMessage('Failed to load billing data')
  } finally {
    setIsLoading(false)
  }
}
```

**4. Add function to create bill:**
```typescript
const createBill = async (patientId: string, items: any[]) => {
  try {
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
    
    await billingServices.createBill(patientId, items, totalAmount)
    
    // Update patient status
    await supabaseServices.patientServices.updatePatientStatus(
      patientId,
      'billing'
    )
    
    await loadBillsData()
  } catch (error) {
    console.error('Error creating bill:', error)
    setErrorMessage('Failed to create bill')
  }
}
```

**5. Add function to mark bill as paid:**
```typescript
const markBillAsPaid = async (billId: string) => {
  try {
    await supabaseServices.billingServices.updateBillStatus(
      billId,
      'paid',
      'Credit Card'
    )
    
    // Find and update the patient status
    const bill = bills.find(b => b.id === billId)
    if (bill) {
      await supabaseServices.patientServices.updatePatientStatus(
        bill.patient_id,
        'discharge'
      )
    }
    
    await loadBillsData()
  } catch (error) {
    console.error('Error updating bill:', error)
    setErrorMessage('Failed to update bill status')
  }
}
```

---

## Discharge Component (src/pages/Discharge.tsx)

### Changes to Make:

**1. Update imports:**
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { LogOut, Stethoscope, FileText, CheckCircle, AlertCircle } from 'lucide-react'
```

**2. Add state for data loading:**
```typescript
const [patients, setPatients] = useState<any[]>([])
const [isLoading, setIsLoading] = useState(true)
const [errorMessage, setErrorMessage] = useState('')
const [dischargeSuccess, setDischargeSuccess] = useState(false)
```

**3. Add useEffect to load discharge candidates:**
```typescript
useEffect(() => {
  loadDischargePatients()
}, [])

const loadDischargePatients = async () => {
  try {
    setIsLoading(true)
    
    // Fetch patients ready for discharge (billing completed)
    const patientsData = await supabaseServices.patientServices.getAllPatients()
    const readyForDischarge = patientsData?.filter(p => 
      p.status === 'billing' || p.status === 'treatment'
    ) || []
    
    setPatients(readyForDischarge)
  } catch (error) {
    console.error('Error loading patients:', error)
    setErrorMessage('Failed to load patient data')
  } finally {
    setIsLoading(false)
  }
}
```

**4. Add discharge function:**
```typescript
const dischargPatient = async (patientId: string, data: any) => {
  try {
    // Update patient status to discharged
    await supabaseServices.patientServices.updatePatientStatus(
      patientId,
      'discharged'
    )
    
    // Create discharge summary record if needed
    // You could create a separate discharge_summaries table
    
    await loadDischargePatients()
    setDischargeSuccess(true)
    
    setTimeout(() => setDischargeSuccess(false), 5000)
  } catch (error) {
    console.error('Error discharging patient:', error)
    setErrorMessage('Failed to discharge patient')
  }
}
```

---

## Feedback Component (src/pages/Feedback.tsx)

### Changes to Make:

**1. Update imports:**
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'
import { MessageSquare, Star, CheckCircle, AlertCircle } from 'lucide-react'
```

**2. Add state for data loading:**
```typescript
const [patients, setPatients] = useState<any[]>([])
const [feedbackList, setFeedbackList] = useState<any[]>([])
const [isSubmitting, setIsSubmitting] = useState(false)
const [errorMessage, setErrorMessage] = useState('')
const [feedbackSuccess, setFeedbackSuccess] = useState(false)
```

**3. Add useEffect to load discharged patients:**
```typescript
useEffect(() => {
  loadDischargedPatients()
}, [])

const loadDischargedPatients = async () => {
  try {
    // Fetch discharged patients
    const patientsData = await supabaseServices.patientServices.getAllPatients()
    const discharged = patientsData?.filter(p => p.status === 'discharged') || []
    
    setPatients(discharged)

    // Fetch all feedback
    const feedback = await supabaseServices.feedbackServices.getAllFeedback()
    setFeedbackList(feedback || [])
  } catch (error) {
    console.error('Error loading data:', error)
    setErrorMessage('Failed to load patient data')
  }
}
```

**4. Add submit feedback function:**
```typescript
const onSubmit = async (data: FeedbackFormData) => {
  setIsSubmitting(true)
  setErrorMessage('')

  try {
    await supabaseServices.feedbackServices.submitFeedback({
      patientId: data.patientId,
      rating: data.rating,
      comments: data.comments,
      category: data.category
    })

    await loadDischargedPatients()
    setFeedbackSuccess(true)
    reset()

    setTimeout(() => setFeedbackSuccess(false), 5000)
  } catch (error) {
    console.error('Error submitting feedback:', error)
    const errorMsg = error instanceof Error
      ? error.message
      : 'Failed to submit feedback. Please try again.'
    setErrorMessage(errorMsg)
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## Summary of Common Updates

All remaining components follow this pattern:

1. **Add imports**: Supabase client and services
2. **Add state**: For loading, error messages, and data
3. **Add useEffect**: Load initial data when component mounts
4. **Add async functions**: For data operations (create, update, delete)
5. **Add loading/error UI**: Show spinners and error messages
6. **Add error handling**: Try-catch in all async operations
7. **Update onSubmit**: Use Supabase services instead of mocking

---

## Manual Updates Checklist

- [ ] Pharmacy.tsx updated with medication loading
- [ ] Pharmacy.tsx has markAsDispensed function
- [ ] Billing.tsx updated with bill loading
- [ ] Billing.tsx has createBill and markBillAsPaid functions
- [ ] Discharge.tsx updated with discharge functionality
- [ ] Discharge.tsx updates patient status to 'discharged'
- [ ] Feedback.tsx updated with feedback submission
- [ ] Feedback.tsx has form validation
- [ ] All components have error handling
- [ ] All components have loading states
- [ ] All components display error messages

---

## Testing After Updates

1. **Test patient workflow end-to-end:**
   - Register patient → status: registered
   - Create consultation → status: in_consultation
   - Order diagnosis → status: diagnosed
   - Create treatment → status: treatment
   - Dispense medication → check pharmacy
   - Create billing → status: billing
   - Mark paid → status: discharge
   - Discharge patient → status: discharged
   - Submit feedback → verify in feedback list

2. **Check Supabase dashboard:**
   - Verify all data is being saved
   - Check patient status transitions
   - View all table data in Table Editor

3. **Test error scenarios:**
   - Try submitting with invalid data
   - Disconnect internet and try submitting
   - Check error messages display correctly

---

## Next Steps

1. Manually update remaining components using patterns above
2. Test each workflow end-to-end
3. Verify data appears in Supabase
4. Proceed to Step 8: Test Your Setup
