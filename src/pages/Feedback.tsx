import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Star, ThumbsUp, TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseServices } from '../services/supabaseServices'

const feedbackSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  rating: z.number().min(1).max(5, 'Rating must be between 1-5'),
  category: z.enum(['overall', 'staff', 'facility', 'treatment']),
  comments: z.string().min(10, 'Comments must be at least 10 characters'),
  wouldRecommend: z.boolean(),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().optional(),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

const Feedback: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)

  const [patients, setPatients] = useState<any[]>([])
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadFeedbackData()
  }, [])

  const loadFeedbackData = async () => {
    try {
      setIsLoading(true)
      
      const patientsData = await supabaseServices.patientServices.getAllPatients()
      // We can collect feedback for patients that are discharged or currently in a treatment phase
      const eligiblePatients = patientsData?.filter(p => 
        p.status === 'discharged' || p.status === 'discharge' || p.status === 'treatment'
      ) || []
      
      setPatients(eligiblePatients.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        age: p.age,
        dischargeDate: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'
      })))

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*, patients(first_name, last_name)')
        .order('created_at', { ascending: false })
      
      setRecentFeedback(feedbackData?.map(f => ({
        id: f.id,
        patientName: f.patients ? `${f.patients.first_name} ${f.patients.last_name}` : 'Unknown',
        rating: f.rating,
        category: f.category,
        comments: f.comments,
        date: new Date(f.created_at).toLocaleDateString(),
        wouldRecommend: f.rating >= 4,
      })) || [])
      
    } catch (error) {
      console.error('Error loading feedback data:', error)
      setErrorMessage('Failed to load feedback data')
    } finally {
      setIsLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema)
  })

  const selectedPatient = patients.find(p => p.id === watch('patientId'))
  const wouldRecommend = watch('wouldRecommend')
  const followUpRequired = watch('followUpRequired')

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
      
      console.log('Feedback submitted:', data)
      await loadFeedbackData()
      setFeedbackSuccess(true)
      setIsSubmitting(false)
      reset()
      setSelectedRating(0)
      
      setTimeout(() => setFeedbackSuccess(false), 5000)
    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      setErrorMessage(err.message || 'Failed to submit feedback')
      setIsSubmitting(false)
    }
  }

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating)
    setValue('rating', rating)
  }

  if (feedbackSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Feedback Submitted!</h3>
              <p className="text-green-700 mt-1">
                Thank you for your feedback. Your input helps us improve our services.
              </p>
              <button
                onClick={() => setFeedbackSuccess(false)}
                className="mt-3 btn-primary"
              >
                Submit Another Feedback
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
          <span className="ml-3">Loading feedback data...</span>
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
        <h1 className="text-3xl font-bold text-gray-900">Patient Satisfaction Feedback</h1>
        <p className="text-gray-600 mt-2">
          Collect and manage patient feedback to improve healthcare services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Submit Patient Feedback
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select {...register('patientId')} className="input-field">
                  <option value="">Select patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - Discharged: {patient.dischargeDate}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                )}
              </div>

              {/* Patient Info */}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Patient Information</h4>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Name:</span>
                      <span className="text-blue-900 ml-2">{selectedPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Age:</span>
                      <span className="text-blue-900 ml-2">{selectedPatient.age}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Discharge:</span>
                      <span className="text-blue-900 ml-2">{selectedPatient.dischargeDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= selectedRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {selectedRating > 0 ? `${selectedRating} out of 5` : 'Please select a rating'}
                  </span>
                </div>
                <input {...register('rating', { value: selectedRating })} type="hidden" />
                {errors.rating && (
                  <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Category *
                </label>
                <select {...register('category')} className="input-field">
                  <option value="overall">Overall Experience</option>
                  <option value="staff">Staff Performance</option>
                  <option value="facility">Facility & Environment</option>
                  <option value="treatment">Treatment & Care</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments *
                </label>
                <textarea
                  {...register('comments')}
                  rows={4}
                  className="input-field"
                  placeholder="Please share your experience and suggestions..."
                />
                {errors.comments && (
                  <p className="text-red-500 text-sm mt-1">{errors.comments.message}</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('wouldRecommend')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    I would recommend this hospital to others
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('followUpRequired')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Follow-up required for this feedback
                  </label>
                </div>
              </div>

              {/* Follow-up Notes */}
              {followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Notes
                  </label>
                  <textarea
                    {...register('followUpNotes')}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the follow-up actions needed..."
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setSelectedRating(0)
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
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Feedback */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Feedback
            </h2>

            <div className="space-y-4">
              {recentFeedback.map(feedback => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{feedback.patientName}</h4>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {feedback.comments}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{feedback.date}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          feedback.wouldRecommend 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {feedback.wouldRecommend ? 'Recommended' : 'Not Recommended'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Satisfaction Metrics */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Satisfaction Metrics
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Satisfaction</span>
                  <span className="text-sm font-semibold text-gray-900">4.2/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Staff Performance</span>
                  <span className="text-sm font-semibold text-gray-900">4.5/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Facility Quality</span>
                  <span className="text-sm font-semibold text-gray-900">4.0/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Treatment Effectiveness</span>
                  <span className="text-sm font-semibold text-gray-900">4.3/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '86%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">This Month</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Total Responses</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">47</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Recommendation Rate</span>
                </div>
                <span className="text-lg font-semibold text-green-600">89%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Response Rate</span>
                </div>
                <span className="text-lg font-semibold text-blue-600">72%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Average Rating</span>
                </div>
                <span className="text-lg font-semibold text-yellow-600">4.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feedback
