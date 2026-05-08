import React, { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter, Phone, Mail, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-300' },
  accepted:   { label: 'Accepted',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  rejected:   { label: 'Rejected',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  completed:  { label: 'Completed', color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200' },
  cancelled:  { label: 'Cancelled', color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
}

const typeIcons: Record<string, string> = {
  general: '🩺', follow_up: '📋', emergency: '🚨', specialist: '🔬',
}

const DoctorAppointments: React.FC = () => {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [filter, setFilter] = useState<string>('pending')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [newNotif, setNewNotif] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    loadAppointments()
    const cleanup = subscribeToAppointments()
    return cleanup
  }, [currentUser?.id])

  const subscribeToAppointments = () => {
    const channel = supabase
      .channel('doctor-appt-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${currentUser?.id}` },
        (payload) => {
          setAppointments(prev => [payload.new as any, ...prev])
          setNewNotif(true)
          setTimeout(() => setNewNotif(false), 5000)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${currentUser?.id}` },
        (payload) => {
          setAppointments(prev =>
            prev.map(a => a.id === (payload.new as any).id ? { ...a, ...(payload.new as any) } : a)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const loadAppointments = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(id, first_name, last_name, age, gender, email, phone)')
        .eq('doctor_id', currentUser?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('appointments') && msg.includes('does not exist')) {
        setErrorMessage('Appointments table not set up yet. Please run the SQL in Supabase.')
      } else {
        setErrorMessage(msg || 'Failed to load appointments.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (appointmentId: string, newStatus: string, reason?: string) => {
    setUpdatingId(appointmentId)
    try {
      const updatePayload: any = { status: newStatus }
      if (reason) updatePayload.rejection_reason = reason

      const { error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', appointmentId)
      if (error) throw error

      setAppointments(prev =>
        prev.map(a => a.id === appointmentId ? { ...a, status: newStatus, rejection_reason: reason } : a)
      )
      setRejectingId(null)
      setRejectionReason('')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update appointment.')
    } finally {
      setUpdatingId(null)
    }
  }

  const pending = appointments.filter(a => a.status === 'pending')
  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const stats = {
    pending: appointments.filter(a => a.status === 'pending').length,
    accepted: appointments.filter(a => a.status === 'accepted').length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  }

  const patientName = (p: any) =>
    p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-600 mt-2">Manage patient appointment requests and your schedule.</p>
        </div>
        <button onClick={loadAppointments} className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {/* New appointment toast */}
      {newNotif && (
        <div className="mb-6 p-4 bg-teal-600 text-white rounded-xl flex items-center gap-3 animate-pulse shadow-sm border border-slate-200">
          <Bell className="h-5 w-5 shrink-0" />
          <span className="font-semibold">New appointment request received!</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <span className="text-red-700 text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending', value: stats.pending, color: 'amber' },
          { label: 'Accepted', value: stats.accepted, color: 'green' },
          { label: 'Rejected', value: stats.rejected, color: 'red' },
          { label: 'Completed', value: stats.completed, color: 'blue' },
        ].map(s => (
          <div key={s.label} className={`card py-4 border-l-4 ${
            s.label === 'Pending' ? 'border-l-amber-400' :
            s.label === 'Accepted' ? 'border-l-green-400' :
            s.label === 'Rejected' ? 'border-l-red-400' : 'border-l-teal-400'
          }`}>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── PENDING REQUESTS (prominent) ── */}
      {pending.length > 0 && filter !== 'accepted' && filter !== 'rejected' && filter !== 'completed' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Pending Requests
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">{pending.length}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {pending.map(appt => (
              <div key={appt.id} className="card border-2 border-amber-300 bg-amber-50/40 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Type + Date */}
                  <div className="flex items-center gap-4 md:w-52 shrink-0">
                    <div className="w-14 h-14 bg-white border-2 border-amber-200 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {typeIcons[appt.appointment_type] || '🩺'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 capitalize">{appt.appointment_type?.replace('_', ' ')}</p>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(appt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" /> {appt.time_slot}
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 border-l border-amber-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(patientName(appt.patients))[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patientName(appt.patients)}</p>
                        <p className="text-xs text-slate-400">
                          {appt.patients?.age ? `${appt.patients.age} yrs` : ''}
                          {appt.patients?.gender ? ` · ${appt.patients.gender}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      {appt.patients?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{appt.patients.phone}</span>}
                      {appt.patients?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{appt.patients.email}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Reason: </span>{appt.reason}</p>
                    {appt.notes && <p className="text-xs text-slate-400 mt-1"><span className="font-medium">Notes: </span>{appt.notes}</p>}
                  </div>

                  {/* Accept / Reject Actions */}
                  <div className="flex flex-col gap-2 md:w-48 shrink-0">
                    <button
                      onClick={() => updateStatus(appt.id, 'accepted')}
                      disabled={updatingId === appt.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {updatingId === appt.id ? 'Updating...' : 'Accept'}
                    </button>

                    {rejectingId === appt.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-red-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-red-400"
                          placeholder="Reason (optional)..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(appt.id, 'rejected', rejectionReason)}
                            disabled={updatingId === appt.id}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason('') }}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(appt.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 hover:bg-red-50 text-red-600 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-slate-400" />
        {(['all', 'pending', 'accepted', 'rejected', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            {f === 'all' ? `All (${appointments.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${appointments.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      {/* All appointments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
          <span className="ml-4 text-slate-500">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400">No appointments found</h3>
          <p className="text-slate-400 mt-2 text-sm">
            {filter !== 'all' ? `No ${filter} appointments yet.` : 'No appointments booked yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const sc = statusConfig[appt.status] || statusConfig.pending
            const isToday = appt.appointment_date === new Date().toISOString().split('T')[0]

            return (
              <div key={appt.id} className={`card border-l-4 ${isToday ? 'border-l-teal-500' : 'border-l-slate-200'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 md:w-52 shrink-0">
                    <span className="text-2xl">{typeIcons[appt.appointment_type] || '🩺'}</span>
                    <div>
                      <p className="font-semibold text-slate-900 capitalize text-sm">{appt.appointment_type?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">
                        {isToday ? '📅 Today' : new Date(appt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-500">⏰ {appt.time_slot}</p>
                    </div>
                  </div>

                  <div className="flex-1 border-l border-slate-100 pl-4">
                    <p className="font-semibold text-slate-900">{patientName(appt.patients)}</p>
                    <p className="text-xs text-slate-400">{appt.patients?.age ? `${appt.patients.age} yrs · ` : ''}{appt.patients?.gender}</p>
                    <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Reason: </span>{appt.reason}</p>
                    {appt.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1"><span className="font-medium">Rejection reason: </span>{appt.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                    {appt.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'completed')}
                        disabled={updatingId === appt.id}
                        className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
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
