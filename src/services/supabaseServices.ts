// src/services/supabaseServices.ts
// Utility functions and hooks for common Supabase operations

import { supabase } from '../lib/supabase'
import type {
  Patient,
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
   * Get lightweight patient list filtered by status (Optimized for dropdowns)
   */
  async getPatientsByStatus(statuses: string[]) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, status, age, registration_date')
      .in('status', statuses)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data?.map((p: any) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      status: p.status,
      age: p.age,
      registrationDate: p.registration_date
    }))
  },

  /**
   * Get dashboard statistics using optimized COUNT queries
   */
  async getPatientDashboardStats() {
    const [
      { count: total },
      { count: activeConsultations },
      { count: pendingDiagnoses },
      { count: discharged }
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('patients').select('*', { count: 'exact', head: true }).in('status', ['registered', 'in_consultation']),
      supabase.from('patients').select('*', { count: 'exact', head: true }).in('status', ['diagnosed', 'treatment']),
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'discharged')
    ])

    return {
      total: total || 0,
      activeConsultations: activeConsultations || 0,
      pendingDiagnoses: pendingDiagnoses || 0,
      discharged: discharged || 0
    }
  },

  /**
   * Get recent patients (Optimized for Dashboard list)
   */
  async getRecentPatients(limit: number = 10) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, status, registration_date')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data?.map((p: any) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      status: p.status,
      registrationDate: p.registration_date
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
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return null;
    const patientData = data[0];
    return {
      id: patientData.id,
      authUserId: patientData.auth_user_id,
      name: `${patientData.first_name} ${patientData.last_name}`,
      age: patientData.age,
      gender: patientData.gender,
      email: patientData.email,
      phone: patientData.phone,
      address: patientData.address,
      emergencyContact: {
        name: patientData.emergency_contact_name,
        phone: patientData.emergency_contact_phone,
        relationship: patientData.emergency_contact_relationship
      },
      medicalHistory: patientData.medical_history ? patientData.medical_history.split(',') : [],
      allergies: patientData.allergies ? patientData.allergies.split(',') : [],
      registrationDate: patientData.registration_date,
      status: patientData.status
    }
  },

  /**
   * Get patient by Auth User ID
   */
  async getPatientByAuthId(authId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', authId)
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return null;
    const patientData = data[0];
    return {
      id: patientData.id,
      authUserId: patientData.auth_user_id,
      name: `${patientData.first_name} ${patientData.last_name}`,
      age: patientData.age,
      gender: patientData.gender,
      email: patientData.email,
      phone: patientData.phone,
      address: patientData.address,
      emergencyContact: {
        name: patientData.emergency_contact_name,
        phone: patientData.emergency_contact_phone,
        relationship: patientData.emergency_contact_relationship
      },
      medicalHistory: patientData.medical_history ? patientData.medical_history.split(',') : [],
      allergies: patientData.allergies ? patientData.allergies.split(',') : [],
      registrationDate: patientData.registration_date,
      status: patientData.status
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
      systolic_bp: consultationData.vitalSigns?.systolicBP || null,
      diastolic_bp: consultationData.vitalSigns?.diastolicBP || null,
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
        systolicBP: c.systolic_bp,
        diastolicBP: c.diastolic_bp,
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

    if (error) throw error
    if (!data || data.length === 0) return null;
    const treatmentData = data[0];
    return {
      id: treatmentData.id,
      patientId: treatmentData.patient_id,
      consultationId: treatmentData.consultation_id,
      diagnosisId: treatmentData.diagnosis_id,
      plan: treatmentData.treatment_plan,
      procedures: treatmentData.procedures ? treatmentData.procedures.split(',') : [],
      followUpDate: treatmentData.follow_up_date,
      status: treatmentData.status,
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

    if (error) throw error
    return data?.[0] || null
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
          created_at: new Date(),
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
      .order('created_at', { ascending: false })

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
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(feedbackId: string, status: 'reviewed') {
    const { data, error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId)
      .select()

    if (error) throw error
    return data?.[0]
  }
}

// ============= AUTH & USER SERVICES =============
export const authServices = {
  /**
   * Signup a new doctor
   */
  async signupDoctor(
    email: string, password: string, fullName: string, specialization: string, 
    phone: string, hospitalName: string, hospitalAddress: string, inviteCode: string
  ) {
    // 1. Pre-flight Validation: Check if invite code is valid before creating Auth user
    const { data: inviteData, error: inviteError } = await supabase
      .from('doctor_invitations')
      .select('id, current_uses, max_uses, expires_at, hospital_name')
      .eq('code', inviteCode)
      .single()

    if (inviteError || !inviteData) {
      throw new Error('Invalid invite code. Please check and try again.')
    }
    if (inviteData.current_uses >= inviteData.max_uses) {
      throw new Error('This invite code has reached its maximum number of uses.')
    }
    if (new Date(inviteData.expires_at) < new Date()) {
      throw new Error('This invite code has expired.')
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed')

    const { error } = await supabase.rpc('register_doctor_profile', {
      p_user_id: authData.user.id,
      p_full_name: fullName,
      p_email: email,
      p_specialization: specialization,
      p_phone: phone,
      p_hospital_name: inviteData.hospital_name || hospitalName, // Enforce hospital name if invite has it
      p_hospital_address: hospitalAddress,
      p_invite_code: inviteCode
    })

    if (error) {
      // Best-effort message if RPC fails after auth creates the user
      console.error('Doctor profile creation failed:', error)
      throw new Error(error.message || 'Failed to create doctor profile.')
    }

    // If user is confirmed, sign them in automatically
    if (authData.user && authData.user.email_confirmed_at) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
    }

    return { user: authData.user }
  },

  /**
   * Signup a new patient
   */
  async signupPatient(email: string, password: string, fullName: string, age: number, gender: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed')

    // Improved name parsing to handle mononyms and multiple words
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          auth_user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          age: age,
          gender: gender,
          phone: '',
          address: '',
          status: 'registered'
        }
      ])
      .select()

    if (error) {
      console.error('Patient profile creation failed:', error)
      throw new Error(error.message || 'Failed to create patient profile.')
    }

    // If user is confirmed, sign them in automatically
    if (authData.user && authData.user.email_confirmed_at) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
    }

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

    // Check if the user exists in our app tables
    if (data.user) {
      const { data: doctor } = await supabase.from('doctors').select('id').eq('id', data.user.id).single()
      const { data: patient } = await supabase.from('patients').select('auth_user_id').eq('auth_user_id', data.user.id).single()

      if (!doctor && !patient) {
        const errorMsg = 'Account data missing. Your database record was likely cleared during testing. Please sign up again.'
        sessionStorage.setItem('auth_error', errorMsg)
        await supabase.auth.signOut()
        throw new Error(errorMsg)
      }
    }

    return data
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Update user password
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
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

    if (doctor) {
      const spec = doctor.specialization?.toLowerCase() || ''
      if (spec.includes('pharmacist')) return { ...user, profile: doctor, role: 'pharmacist' }
      if (spec.includes('admin') || spec.includes('billing')) return { ...user, profile: doctor, role: 'admin' }
      return { ...user, profile: doctor, role: 'doctor' }
    }

    // Check if patient
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (patient) return { ...user, profile: patient, role: 'patient' }

    // User exists in Auth but not in our tables (e.g. database cleared)
    // Sign them out automatically to prevent undefined state
    const errorMsg = 'Account data missing. Your database record was likely cleared during testing. Please sign up again.'
    sessionStorage.setItem('auth_error', errorMsg)
    await supabase.auth.signOut()
    return null
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

// ============= ADMIN SERVICES =============

export const adminServices = {
  /**
   * Get all doctor invitations
   */
  async getInvitations() {
    const { data, error } = await supabase
      .from('doctor_invitations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Generate a new doctor invitation code
   */
  async generateInvitation(email?: string, daysValid: number = 7, maxUses: number = 1, hospitalName?: string) {
    const code = 'HC-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear()
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + daysValid)

    const { data, error } = await supabase
      .from('doctor_invitations')
      .insert([
        {
          code,
          assigned_email: email || null,
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses,
          current_uses: 0,
          hospital_name: hospitalName || null
        }
      ])
      .select()
    
    if (error) throw error
    return data[0]
  },

  /**
   * Revoke an active invitation
   */
  async revokeInvitation(id: string) {
    const { data, error } = await supabase
      .from('doctor_invitations')
      .update({ is_used: true, expires_at: new Date().toISOString() }) // Burn the code
      .eq('id', id)
      .select()

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
  adminServices,
  subscriptionServices
}
