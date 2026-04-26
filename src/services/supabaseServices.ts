// src/services/supabaseServices.ts
// Utility functions and hooks for common Supabase operations

import { supabase } from '../lib/supabase'
import type {
  Patient,
  Doctor,
  Consultation,
  Diagnosis,
  Treatment,
  Medication,
  Bill,
  BillingItem,
  Feedback
} from '../types/index'

// ============= PATIENT SERVICES =============

export const patientServices = {
  /**
   * Register a new patient
   */
  async registerPatient(patientData: Omit<Patient, 'id' | 'registrationDate' | 'status'>) {
    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          first_name: patientData.name.split(' ')[0],
          last_name: patientData.name.split(' ').slice(1).join(' '),
          age: patientData.age,
          gender: patientData.gender,
          email: patientData.email,
          phone: patientData.phone,
          address: patientData.address,
          emergency_contact_name: patientData.emergencyContact.name,
          emergency_contact_phone: patientData.emergencyContact.phone,
          emergency_contact_relationship: patientData.emergencyContact.relationship,
          medical_history: patientData.medicalHistory?.join(','),
          allergies: patientData.allergies?.join(','),
          registration_date: new Date(),
          status: 'registered'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Get all patients
   */
  async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map((p: any) => ({
      id: p.id,
      authUserId: p.auth_user_id,
      name: `${p.first_name} ${p.last_name}`,
      age: p.age,
      gender: p.gender,
      email: p.email,
      phone: p.phone,
      address: p.address,
      emergencyContact: {
        name: p.emergency_contact_name,
        phone: p.emergency_contact_phone,
        relationship: p.emergency_contact_relationship
      },
      medicalHistory: p.medical_history ? p.medical_history.split(',') : [],
      allergies: p.allergies ? p.allergies.split(',') : [],
      registrationDate: p.registration_date,
      status: p.status
    }))
  },

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error) throw error
    if (!data) return null;
    return {
      id: data.id,
      authUserId: data.auth_user_id,
      name: `${data.first_name} ${data.last_name}`,
      age: data.age,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: {
        name: data.emergency_contact_name,
        phone: data.emergency_contact_phone,
        relationship: data.emergency_contact_relationship
      },
      medicalHistory: data.medical_history ? data.medical_history.split(',') : [],
      allergies: data.allergies ? data.allergies.split(',') : [],
      registrationDate: data.registration_date,
      status: data.status
    }
  },

  /**
   * Update patient status
   */
  async updatePatientStatus(patientId: string, status: Patient['status']) {
    const { data, error } = await supabase
      .from('patients')
      .update({ status, updated_at: new Date() })
      .eq('id', patientId)
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Update patient information
   */
  async updatePatient(patientId: string, updates: Partial<Patient>) {
    const { data, error } = await supabase
      .from('patients')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', patientId)
      .select()

    if (error) throw error
    return data?.[0]
  }
}

// ============= CONSULTATION SERVICES =============

export const consultationServices = {
  /**
   * Create a new consultation
   */
  async createConsultation(consultationData: Omit<Consultation, 'id' | 'status'>) {
    const insertPayload = {
      patient_id: consultationData.patientId,
      doctor_id: consultationData.doctorId,
      consultation_date: consultationData.date,
      symptoms: Array.isArray(consultationData.symptoms)
        ? consultationData.symptoms.join(', ')
        : consultationData.symptoms,
      diagnosis: consultationData.diagnosis || null,
      notes: consultationData.notes || null,
      blood_pressure: consultationData.vitalSigns?.bloodPressure || null,
      heart_rate: consultationData.vitalSigns?.heartRate || null,
      temperature: consultationData.vitalSigns?.temperature || null,
      weight: consultationData.vitalSigns?.weight || null,
      height: consultationData.vitalSigns?.height || null,
      status: 'completed'
    }

    const { data, error } = await supabase
      .from('consultations')
      .insert([insertPayload])
      .select()

    if (error) {
      console.error('Supabase createConsultation error:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'Failed to create consultation')
    }
    return data?.[0]
  },

  /**
   * Get consultations for a patient
   */
  async getPatientConsultations(patientId: string) {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: false })

    if (error) throw error
    return data?.map((c: any) => ({
      id: c.id,
      patientId: c.patient_id,
      doctorId: c.doctor_id,
      date: new Date(c.consultation_date),
      symptoms: c.symptoms ? c.symptoms.split(',') : [],
      diagnosis: c.diagnosis,
      notes: c.notes,
      vitalSigns: {
        bloodPressure: c.blood_pressure,
        heartRate: c.heart_rate,
        temperature: c.temperature,
        weight: c.weight,
        height: c.height
      },
      status: c.status
    }))
  },

  /**
   * Update consultation
   */
  async updateConsultation(consultationId: string, updates: Partial<Consultation>) {
    const { data, error } = await supabase
      .from('consultations')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', consultationId)
      .select()

    if (error) throw error
    return data?.[0]
  }
}

// ============= DIAGNOSIS SERVICES =============

export const diagnosisServices = {
  /**
   * Create a new diagnosis record
   */
  async createDiagnosis(diagnosisData: Omit<Diagnosis, 'id' | 'status'>) {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert([
        {
          patient_id: diagnosisData.patientId,
          consultation_id: diagnosisData.consultationId,
          test_type: diagnosisData.type,
          test_name: diagnosisData.testName,
          results: diagnosisData.results,
          interpretation: diagnosisData.interpretation,
          test_date: diagnosisData.date,
          status: 'ordered'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Get diagnoses for a patient
   */
  async getPatientDiagnoses(patientId: string) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false })

    if (error) throw error
    return data?.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      consultationId: d.consultation_id,
      type: d.test_type,
      testName: d.test_name,
      results: d.results,
      interpretation: d.interpretation,
      date: d.test_date,
      status: d.status
    }))
  },

  /**
   * Update diagnosis status
   */
  async updateDiagnosisStatus(diagnosisId: string, status: Diagnosis['status']) {
    const { data, error } = await supabase
      .from('diagnoses')
      .update({ status, updated_at: new Date() })
      .eq('id', diagnosisId)
      .select()

    if (error) throw error
    return data?.[0]
  }
}

// ============= TREATMENT SERVICES =============

export const treatmentServices = {
  /**
   * Create a new treatment plan
   */
  async createTreatment(treatmentData: Omit<Treatment, 'id' | 'status'>) {
    const { data, error } = await supabase
      .from('treatments')
      .insert([
        {
          patient_id: treatmentData.patientId,
          consultation_id: treatmentData.consultationId,
          diagnosis_id: treatmentData.diagnosisId,
          treatment_plan: treatmentData.plan,
          procedures: treatmentData.procedures?.join(','),
          follow_up_date: treatmentData.followUpDate,
          status: 'planned'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Add medication to treatment
   */
  async addMedication(treatmentId: string, medication: Omit<Medication, 'id' | 'status'>) {
    const { data, error } = await supabase
      .from('medications')
      .insert([
        {
          treatment_id: treatmentId,
          medication_name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          duration: medication.duration,
          instructions: medication.instructions,
          status: 'prescribed'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Get treatment plan for patient
   */
  async getPatientTreatment(patientId: string) {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null;
    return {
      id: data.id,
      patientId: data.patient_id,
      consultationId: data.consultation_id,
      diagnosisId: data.diagnosis_id,
      plan: data.treatment_plan,
      procedures: data.procedures ? data.procedures.split(',') : [],
      followUpDate: data.follow_up_date,
      status: data.status,
      medications: []
    }
  },

  /**
   * Get medications for a treatment
   */
  async getTreatmentMedications(treatmentId: string) {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('treatment_id', treatmentId)

    if (error) throw error
    return data?.map((m: any) => ({
      id: m.id,
      name: m.medication_name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
      status: m.status
    }))
  }
}

// ============= BILLING SERVICES =============

export const billingServices = {
  /**
   * Create a new bill
   */
  async createBill(patientId: string, items: Omit<BillingItem, 'id'>[], totalAmount: number) {
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([
        {
          patient_id: patientId,
          total_amount: totalAmount,
          status: 'pending'
        }
      ])
      .select()

    if (billError) throw billError

    const billId = billData?.[0].id
    if (!billId) throw new Error('Failed to create bill')

    // Add billing items
    const billItems = items.map(item => ({
      bill_id: billId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      category: item.category
    }))

    const { error: itemsError } = await supabase
      .from('billing_items')
      .insert(billItems)

    if (itemsError) throw itemsError
    return billData?.[0]
  },

  /**
   * Get bill for patient
   */
  async getPatientBill(patientId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*, billing_items(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Update bill status (mark as paid)
   */
  async updateBillStatus(billId: string, status: Bill['status'], paymentMethod?: string) {
    const { data, error } = await supabase
      .from('bills')
      .update({
        status,
        payment_method: paymentMethod,
        payment_date: status === 'paid' ? new Date() : null,
        updated_at: new Date()
      })
      .eq('id', billId)
      .select()

    if (error) throw error
    return data?.[0]
  }
}

// ============= FEEDBACK SERVICES =============

export const feedbackServices = {
  /**
   * Submit feedback
   */
  async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'status' | 'date'>) {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          patient_id: feedbackData.patientId,
          rating: feedbackData.rating,
          comments: feedbackData.comments,
          category: feedbackData.category,
          feedback_date: new Date(),
          status: 'submitted'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0]
  },

  /**
   * Get feedback for patient
   */
  async getPatientFeedback(patientId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('patient_id', patientId)
      .order('feedback_date', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get all feedback (admin view)
   */
  async getAllFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, patients(first_name, last_name)')
      .order('feedback_date', { ascending: false })

    if (error) throw error
    return data
  }
}

// ============= AUTH & USER SERVICES =============
export const authServices = {
  /**
   * Signup a new doctor
   */
  async signupDoctor(email: string, password: string, fullName: string, specialization: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed')

    const { data, error } = await supabase
      .from('doctors')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName,
          email: email,
          specialization: specialization,
        }
      ])
      .select()

    if (error) throw error
    return { user: authData.user, profile: data?.[0] }
  },

  /**
   * Signup a new patient
   */
  async signupPatient(email: string, password: string, fullName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed')

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          auth_user_id: authData.user.id,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' '),
          email: email,
          age: 0, // Default values
          gender: 'other',
          phone: '',
          address: '',
          status: 'registered'
        }
      ])
      .select()

    if (error) throw error
    return { user: authData.user, profile: data?.[0] }
  },

  /**
   * Sign in
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current user and their profile (doctor or patient)
   */
  async getCurrentUser() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    // Check if doctor
    const { data: doctor } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', user.id)
      .single()

    if (doctor) return { ...user, profile: doctor, role: 'doctor' }

    // Check if patient
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (patient) return { ...user, profile: patient, role: 'patient' }

    return { ...user, role: 'unknown' }
  },

  /**
   * Get all doctors
   */
  async getAllDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('full_name')

    if (error) throw error
    return data
  }
}

// ============= REAL-TIME SUBSCRIPTIONS =============

export const subscriptionServices = {
  /**
   * Subscribe to patient updates
   */
  subscribeToPatientUpdates(patientId: string, callback: (patient: Patient) => void) {
    return supabase
      .channel(`patient:${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${patientId}`
        },
        (payload) => {
          callback(payload.new as Patient)
        }
      )
      .subscribe()
  },

  /**
   * Subscribe to consultation updates
   */
  subscribeToConsultationUpdates(patientId: string, callback: (consultation: Consultation) => void) {
    return supabase
      .channel(`consultations:${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          callback(payload.new as Consultation)
        }
      )
      .subscribe()
  }
}

export const supabaseServices = {
  patientServices,
  consultationServices,
  diagnosisServices,
  treatmentServices,
  billingServices,
  feedbackServices,
  authServices,
  subscriptionServices
}
