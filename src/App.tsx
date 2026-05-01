import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PatientRegistration from './pages/PatientRegistration'
import Consultation from './pages/Consultation'
import Diagnosis from './pages/Diagnosis'
import TreatmentDecision from './pages/TreatmentDecision'
import Pharmacy from './pages/Pharmacy'
import Billing from './pages/Billing'
import Discharge from './pages/Discharge'
import Feedback from './pages/Feedback'
import Auth from './pages/Auth'
import AppointmentBooking from './pages/AppointmentBooking'
import DoctorAppointments from './pages/DoctorAppointments'
import { supabase } from './lib/supabase'
import { AuthProvider } from './context/AuthContext'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registration" element={<PatientRegistration />} />
          <Route path="/appointments" element={<AppointmentBooking />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/treatment" element={<TreatmentDecision />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/discharge" element={<Discharge />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
