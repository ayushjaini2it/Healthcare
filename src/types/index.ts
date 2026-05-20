export interface Doctor {
  id: string
  fullName: string
  email: string
  specialization: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Patient {
  id: string
  authUserId?: string // Optional link to Supabase Auth
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  email: string
  phone: string
  address: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory: string[]
  allergies: string[]
  registrationDate: Date
  status: 'registered' | 'in_consultation' | 'diagnosed' | 'treatment' | 'pharmacy' | 'billing' | 'discharged'
}

export interface Consultation {
  id: string
  patientId: string
  doctorId: string // References Doctor.id
  date: Date
  symptoms: string[]
  diagnosis: string
  notes: string
  vitalSigns: {
    systolicBP: number
    diastolicBP: number
    heartRate: number
    temperature: number
    weight: number
    height: number
  }
  status: 'scheduled' | 'in_progress' | 'completed'
}

export interface Diagnosis {
  id: string
  patientId: string
  consultationId: string
  type: 'lab' | 'imaging'
  testName: string
  results: string
  interpretation: string
  date: Date
  status: 'ordered' | 'in_progress' | 'completed'
}

export interface Treatment {
  id: string
  patientId: string
  consultationId: string
  diagnosisId: string
  plan: string
  medications: Medication[]
  procedures: string[]
  followUpDate: Date
  status: 'planned' | 'in_progress' | 'completed'
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  status: 'prescribed' | 'dispensed' | 'administered'
}

export interface Bill {
  id: string
  patientId: string
  items: BillingItem[]
  totalAmount: number
  status: 'pending' | 'paid' | 'partial'
  paymentMethod?: string
  paymentDate?: Date
}

export interface BillingItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: 'consultation' | 'lab' | 'imaging' | 'medication' | 'procedure' | 'room'
}

export interface Feedback {
  id: string
  patientId: string
  rating: number
  comments: string
  category: 'overall' | 'staff' | 'facility' | 'treatment'
  date: Date
  status: 'submitted' | 'reviewed'
}

