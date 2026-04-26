import React, { useState } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserCheck, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'

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

const PatientRegistration: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  })

  const onSubmit = async (data: PatientFormData) => {
  setIsSubmitting(true)
  setErrorMessage('')  // Clear previous errors
  
  try {
    // Step 1: Prepare patient data in the format Supabase expects
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
        relationship: data.emergencyContactRelationship,
      },
      medicalHistory: data.medicalHistory 
        ? data.medicalHistory.split(',').map(h => h.trim()) 
        : [],
      allergies: data.allergies 
        ? data.allergies.split(',').map(a => a.trim()) 
        : [],
      registrationDate: new Date(),
      status: 'registered' as const
    }

    // Step 2: Send data to Supabase via the service
    const result = await supabaseServices.patientServices.registerPatient(patientData)
    
    // Step 3: Verify success
    if (result) {
      console.log('Patient registered successfully:', result)
      setRegistrationSuccess(true)
      reset()
      
      // Hide success message after 5 seconds
      setTimeout(() => setRegistrationSuccess(false), 5000)
    }
  } catch (error) {
    // Step 4: Handle errors
    console.error('Error registering patient:', error)
    const errorMsg = error instanceof Error 
      ? error.message 
      : 'Failed to register patient. Please try again.'
    setErrorMessage(errorMsg)
  } finally {
    // Step 5: Stop loading state
    setIsSubmitting(false)
  }
}

  if (registrationSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Registration Successful!</h3>
              <p className="text-green-700 mt-1">
                Patient has been successfully registered and added to the system.
              </p>
              <button
                onClick={() => setRegistrationSuccess(false)}
                className="mt-3 btn-primary"
              >
                Register Another Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
        <p className="text-gray-600 mt-2">
          Register a new patient in the healthcare system. All fields marked with * are required.
        </p>
      </div>
      {errorMessage && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        <span className="text-red-700">{errorMessage}</span>
      </div>
    )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                {...register('firstName')}
                className="input-field"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                className="input-field"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                {...register('age', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="Enter age"
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select {...register('gender')} className="input-field">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="input-field pl-10"
                  placeholder="patient@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  {...register('phone')}
                  className="input-field pl-10"
                  placeholder="(555) 123-4567"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  {...register('address')}
                  className="input-field pl-10"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                {...register('emergencyContactName')}
                className="input-field"
                placeholder="Emergency contact name"
              />
              {errors.emergencyContactName && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone *
              </label>
              <input
                {...register('emergencyContactPhone')}
                className="input-field"
                placeholder="(555) 987-6543"
              />
              {errors.emergencyContactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <input
                {...register('emergencyContactRelationship')}
                className="input-field"
                placeholder="Spouse, Parent, etc."
              />
              {errors.emergencyContactRelationship && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContactRelationship.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Medical Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                {...register('medicalHistory')}
                rows={4}
                className="input-field"
                placeholder="List any relevant medical conditions, surgeries, or chronic illnesses..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <textarea
                {...register('allergies')}
                rows={3}
                className="input-field"
                placeholder="List any known allergies (medications, food, etc.)..."
              />
            </div>
          </div>
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
            {isSubmitting ? 'Registering...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PatientRegistration
