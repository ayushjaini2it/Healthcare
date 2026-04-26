import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, Phone, Mail, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:  { label: 'Scheduled',  color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  completed:  { label: 'Completed',  color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
  no_show:    { label: 'No Show',    color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200' },
}

const typeIcons: Record<string, string> = {
  general: '🩺', follow_up: '📋', emergency: '🚨', specialist: '🔬',
}

const DoctorAppointments: React.FC = () => {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [doctorRecordId, setDoctorRecordId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser?.id) loadAppointments()
  }, [currentUser])

  const loadAppointments = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      // Get the doctor's record ID from the doctors table
      const { data: doctorRecord } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', currentUser?.id)
        .maybeSingle()

      const docId = doctorRecord?.id || currentUser?.id
      setDoctorRecordId(docId)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            id, first_name, last_name, age, gender, email, phone
          )
        `)
        .eq('doctor_id', docId)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('appointments') && (msg.includes('does not exist') || msg.includes('relation'))) {
        setErrorMessage('Appointments table not set up yet. Please run the appointments SQL in Supabase.')
      } else {
        setErrorMessage(msg || 'Failed to load appointments.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    setUpdatingId(appointmentId)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
      if (error) throw error
      setAppointments(prev =>
        prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a)
      )
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const isFuture = (dateStr: string) => new Date(dateStr) > new Date()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">View and manage patient appointments booked with you.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <span className="text-red-700 text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'indigo', icon: Calendar },
          { label: 'Scheduled', value: stats.scheduled, color: 'blue', icon: Clock },
          { label: 'Completed', value: stats.completed, color: 'green', icon: CheckCircle },
          { label: 'Cancelled', value: stats.cancelled, color: 'red', icon: XCircle },
        ].map(stat => (
          <div key={stat.label} className="card flex items-center gap-4 py-4">
            <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {f === 'all' ? `All (${stats.total})` : f === 'scheduled' ? `Scheduled (${stats.scheduled})` : f === 'completed' ? `Completed (${stats.completed})` : `Cancelled (${stats.cancelled})`}
          </button>
        ))}
        <button
          onClick={loadAppointments}
          className="ml-auto px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <span className="ml-4 text-gray-500 text-lg">Loading appointments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No appointments found</h3>
          <p className="text-gray-400 mt-2 text-sm">
            {filter !== 'all' ? `No ${filter} appointments.` : 'Patients have not booked any appointments yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(appt => {
            const patient = appt.patients
            const sc = statusConfig[appt.status] || statusConfig.scheduled
            const todayAppt = isToday(appt.appointment_date)
            const future = isFuture(appt.appointment_date)

            return (
              <div
                key={appt.id}
                className={`card border-l-4 transition-all ${
                  todayAppt ? 'border-l-indigo-500 bg-indigo-50/30' : 'border-l-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Appointment Type + Date */}
                  <div className="flex items-center gap-4 md:w-56 shrink-0">
                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {typeIcons[appt.appointment_type] || '🩺'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {appt.appointment_type?.replace('_', ' ')}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className={todayAppt ? 'text-indigo-600 font-semibold' : ''}>
                          {todayAppt ? 'Today' : new Date(appt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {appt.time_slot}
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 border-l border-gray-100 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(patient?.name || 'P')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                        {patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown Patient'}
                      </p>
                        <p className="text-xs text-gray-400">
                          {patient?.age ? `${patient.age} yrs` : ''}{patient?.gender ? ` · ${patient.gender}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {patient?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {patient.phone}
                        </span>
                      )}
                      {patient?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {patient.email}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Reason: </span>{appt.reason}
                    </div>
                    {appt.notes && (
                      <div className="mt-1 text-xs text-gray-400">
                        <span className="font-medium">Notes: </span>{appt.notes}
                      </div>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div className="flex flex-col items-end gap-3 md:w-44 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>

                    {appt.status === 'scheduled' && (
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => updateStatus(appt.id, 'completed')}
                          disabled={updatingId === appt.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 w-full"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {updatingId === appt.id ? 'Updating...' : 'Mark Complete'}
                        </button>
                        <button
                          onClick={() => updateStatus(appt.id, 'cancelled')}
                          disabled={updatingId === appt.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 w-full"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}

                    {appt.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="h-4 w-4" /> Visit complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments
