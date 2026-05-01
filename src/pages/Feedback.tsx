import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Star, ThumbsUp, Users, AlertCircle, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'


const feedbackSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  rating: z.number().min(1).max(5, 'Rating must be between 1-5'),
  comments: z.string().min(10, 'Comments must be at least 10 characters'),
  wouldRecommend: z.boolean(),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

const Feedback: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)

  const [doctors, setDoctors] = useState<any[]>([])
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [monthlyStats, setMonthlyStats] = useState({
    totalResponses: 0,
    recommendationRate: 0,
    averageRating: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadFeedbackData()
  }, [])

  const loadFeedbackData = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMessage('User not authenticated')
        setIsLoading(false)
        return
      }

      // Fetch appointments for the current user
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*, doctors(*)')
        .eq('patient_id', user.id)
        .eq('status', 'completed')
      
      // Extract unique doctors from appointments
      const uniqueDoctors = appointmentsData?.reduce((acc: any[], apt) => {
        if (apt.doctors && !acc.some(d => d.id === apt.doctors.id)) {
          acc.push(apt.doctors)
        }
        return acc
      }, []) || []

      setDoctors(uniqueDoctors.map(d => ({
        id: d.id,
        name: d.full_name,
        specialization: d.specialization,
        hospital: d.hospital_name,
        rating: 0 // Will be calculated from feedback
      })))

      // Fetch all feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*, doctors(full_name, specialization)')
        .order('created_at', { ascending: false })
      
      const feedback = feedbackData?.map(f => ({
        id: f.id,
        doctorName: f.doctors ? f.doctors.full_name : 'Unknown',
        rating: f.rating,
        comments: f.comments,
        date: new Date(f.created_at).toLocaleDateString(),
        wouldRecommend: f.rating >= 4,
      })) || []

      setRecentFeedback(feedback)

      // Calculate monthly stats
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const monthlyFeedback = feedbackData?.filter(f => 
        new Date(f.created_at) >= monthStart
      ) || []

      const totalResponses = monthlyFeedback.length
      const recommendationCount = monthlyFeedback.filter(f => f.rating >= 4).length
      const avgRating = totalResponses > 0 
        ? (monthlyFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / totalResponses).toFixed(1)
        : 0

      setMonthlyStats({
        totalResponses,
        recommendationRate: totalResponses > 0 ? Math.round((recommendationCount / totalResponses) * 100) : 0,
        averageRating: parseFloat(avgRating as string)
      })

      // Calculate doctor ratings from all feedback
      const updatedDoctors = uniqueDoctors.map(d => {
        const doctorFeedback = feedbackData?.filter(f => f.doctor_id === d.id) || []
        const avgDocRating = doctorFeedback.length > 0
          ? (doctorFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / doctorFeedback.length).toFixed(1)
          : 0
        return {
          ...d,
          id: d.id,
          name: d.full_name,
          specialization: d.specialization,
          hospital: d.hospital_name,
          rating: parseFloat(avgDocRating as string)
        }
      })

      setDoctors(updatedDoctors)
      
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

  const selectedDoctor = doctors.find(d => d.id === watch('doctorId'))


  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      await supabase
        .from('feedback')
        .insert([{
          doctor_id: data.doctorId,
          patient_id: user.id,
          rating: data.rating,
          comments: data.comments,
          created_at: new Date().toISOString()
        }])
      
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
                Thank you for your feedback. Your input helps doctors improve their services.
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
        <h1 className="text-3xl font-bold text-gray-900">Doctor Feedback</h1>
        <p className="text-gray-600 mt-2">
          Share your feedback about doctors you've had appointments with.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Submit Doctor Feedback
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor *
                </label>
                <select {...register('doctorId')} className="input-field">
                  <option value="">Choose a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization} ({doctor.hospital})
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="text-red-500 text-sm mt-1">{errors.doctorId.message}</p>
                )}
              </div>

              {/* Doctor Info */}
              {selectedDoctor && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Doctor Information
                  </h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Name:</span>
                      <span className="text-blue-900 ml-2">{selectedDoctor.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Specialization:</span>
                      <span className="text-blue-900 ml-2">{selectedDoctor.specialization}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700">Current Rating:</span>
                      <span className="text-blue-900 ml-2 font-semibold flex items-center">
                        {selectedDoctor.rating > 0 ? (
                          <>
                            {selectedDoctor.rating} / 5.0
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ml-1 ${
                                  i < Math.round(selectedDoctor.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </>
                        ) : (
                          'No ratings yet'
                        )}
                      </span>
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

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments *
                </label>
                <textarea
                  {...register('comments')}
                  rows={4}
                  className="input-field"
                  placeholder="Please share your experience with this doctor..."
                />
                {errors.comments && (
                  <p className="text-red-500 text-sm mt-1">{errors.comments.message}</p>
                )}
              </div>

              {/* Recommendation */}
              <div>
                <div className="flex items-center">
                  <input
                    {...register('wouldRecommend')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    I would recommend this doctor to others
                  </label>
                </div>
              </div>

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
              {recentFeedback.length > 0 ? (
                recentFeedback.slice(0, 5).map(feedback => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{feedback.doctorName}</h4>
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
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {feedback.wouldRecommend ? 'Recommended' : 'Neutral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No feedback submitted yet.</p>
              )}
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
                <span className="text-lg font-semibold text-gray-900">{monthlyStats.totalResponses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Recommendation Rate</span>
                </div>
                <span className="text-lg font-semibold text-green-600">{monthlyStats.recommendationRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Average Rating</span>
                </div>
                <span className="text-lg font-semibold text-yellow-600">{monthlyStats.averageRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feedback
