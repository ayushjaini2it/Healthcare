import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserCheck, Phone, Mail, MapPin, AlertCircle, Save, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const patientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.number().min(0).max(150, 'Please enter a valid age'),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency phone must be at least 10 digits'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

const PatientDetails: React.FC = () => {
  const { currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [patientId, setPatientId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  })

  // Load existing patient record on mount
  useEffect(() => {
    if (currentUser?.id) loadPatientProfile()
  }, [currentUser])

  const loadPatientProfile = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('auth_user_id', currentUser?.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setPatientId(data.id)
        // Pre-fill form with existing values
        reset({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          age: data.age || 0,
          gender: data.gender || 'other',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          emergencyContactName: data.emergency_contact_name || '',
          emergencyContactPhone: data.emergency_contact_phone || '',
          emergencyContactRelationship: data.emergency_contact_relationship || '',
          medicalHistory: data.medical_history || '',
          allergies: data.allergies || '',
        })
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load your profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const updatePayload = {
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        address: data.address,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        emergency_contact_relationship: data.emergencyContactRelationship,
        medical_history: data.medicalHistory || '',
        allergies: data.allergies || '',
      }

      if (patientId) {
        // UPDATE existing record
        const { error } = await supabase
          .from('patients')
          .update(updatePayload)
          .eq('id', patientId)
        if (error) throw error
      } else {
        // INSERT for the first time (profile not yet created)
        const { data: newRecord, error } = await supabase
          .from('patients')
          .insert([{ ...updatePayload, auth_user_id: currentUser?.id, status: 'registered' }])
          .select()
          .single()
        if (error) throw error
        if (newRecord) setPatientId(newRecord.id)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save your details. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <span className="ml-3 text-slate-500 text-lg">Loading your profile...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Patient Profile</h1>
          <p className="text-slate-600 mt-2">
            Keep your details up to date — doctors can view this information during your consultation.
          </p>
        </div>
        {patientId && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> Profile Active
          </span>
        )}
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <span className="text-green-700 font-medium">Your profile has been saved successfully!</span>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-teal-500" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
              <input {...register('firstName')} className="input-field" placeholder="Enter first name" />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
              <input {...register('lastName')} className="input-field" placeholder="Enter last name" />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age *</label>
              <input
                {...register('age', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="Enter age"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
              <select {...register('gender')} className="input-field">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="input-field pl-10"
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('phone')}
                  className="input-field pl-10"
                  placeholder="+91 98765 43210"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  {...register('address')}
                  className="input-field pl-10"
                  placeholder="123 Main St, City, State"
                />
              </div>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name *</label>
              <input
                {...register('emergencyContactName')}
                className="input-field"
                placeholder="Full name"
              />
              {errors.emergencyContactName && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone *</label>
              <input
                {...register('emergencyContactPhone')}
                className="input-field"
                placeholder="+91 98765 43210"
              />
              {errors.emergencyContactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Relationship *</label>
              <input
                {...register('emergencyContactRelationship')}
                className="input-field"
                placeholder="Spouse, Parent, Sibling..."
              />
              {errors.emergencyContactRelationship && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactRelationship.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-teal-500" />
            Medical Information
            <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Visible to your doctor</span>
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Medical History</label>
              <textarea
                {...register('medicalHistory')}
                rows={4}
                className="input-field"
                placeholder="List any medical conditions, surgeries, or chronic illnesses (separate with commas)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Allergies</label>
              <textarea
                {...register('allergies')}
                rows={3}
                className="input-field"
                placeholder="List any known allergies — medications, food, etc. (separate with commas)..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={loadPatientProfile}
            className="btn-secondary"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Profile</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PatientDetails
