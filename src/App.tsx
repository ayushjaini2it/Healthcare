import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import Dashboard from './pages/Dashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientRegistration from './pages/PatientRegistration'
import PatientMedications from './pages/PatientMedications'
import PatientInvoices from './pages/PatientInvoices'
import PatientRecords from './pages/PatientRecords'
import Consultation from './pages/Consultation'
import Diagnosis from './pages/Diagnosis'
import TreatmentDecision from './pages/TreatmentDecision'
import Pharmacy from './pages/Pharmacy'
import Billing from './pages/Billing'
import Discharge from './pages/Discharge'
import Feedback from './pages/Feedback'
import FeedbackDashboard from './pages/FeedbackDashboard'

import AppointmentBooking from './pages/AppointmentBooking'
import DoctorAppointments from './pages/DoctorAppointments'
import LandingPage from './pages/LandingPage'
import ResetPassword from './pages/ResetPassword'
import { AboutUs, Contact, PrivacyPolicy, Resources } from './pages/StaticPages'
import { supabase } from './lib/supabase'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser, isInitialLoading } = useAuth()

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
      </div>
    )
  }

  // Keep showing unauthenticated routes until we have a definitively valid currentUser
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
      <Layout>
        <Routes>
          {/* Dynamic Home Route based on Role */}
          <Route path="/" element={
            currentUser?.role === 'doctor' ? <Dashboard /> : <PatientDashboard />
          } />

          {/* Doctor-only routes */}
          <Route path="/doctor-appointments" element={
            <RoleProtectedRoute allowedRole="doctor"><DoctorAppointments /></RoleProtectedRoute>
          } />
          <Route path="/consultation" element={
            <RoleProtectedRoute allowedRole="doctor"><Consultation /></RoleProtectedRoute>
          } />
          <Route path="/diagnosis" element={
            <RoleProtectedRoute allowedRole="doctor"><Diagnosis /></RoleProtectedRoute>
          } />
          <Route path="/treatment" element={
            <RoleProtectedRoute allowedRole="doctor"><TreatmentDecision /></RoleProtectedRoute>
          } />
          <Route path="/discharge" element={
            <RoleProtectedRoute allowedRole="doctor"><Discharge /></RoleProtectedRoute>
          } />

          <Route path="/pharmacy" element={
            <RoleProtectedRoute allowedRole={['pharmacist', 'doctor']}><Pharmacy /></RoleProtectedRoute>
          } />
          <Route path="/billing" element={
            <RoleProtectedRoute allowedRole={['admin', 'doctor']}><Billing /></RoleProtectedRoute>
          } />
          <Route path="/feedback-dashboard" element={
            <RoleProtectedRoute allowedRole={['admin', 'doctor']}><FeedbackDashboard /></RoleProtectedRoute>
          } />

          {/* Patient-only routes */}
          <Route path="/registration" element={
            <RoleProtectedRoute allowedRole="patient"><PatientRegistration /></RoleProtectedRoute>
          } />
          <Route path="/appointments" element={
            <RoleProtectedRoute allowedRole="patient"><AppointmentBooking /></RoleProtectedRoute>
          } />
          <Route path="/my-records" element={
            <RoleProtectedRoute allowedRole="patient"><PatientRecords /></RoleProtectedRoute>
          } />
          <Route path="/my-medications" element={
            <RoleProtectedRoute allowedRole="patient"><PatientMedications /></RoleProtectedRoute>
          } />
          <Route path="/my-bills" element={
            <RoleProtectedRoute allowedRole="patient"><PatientInvoices /></RoleProtectedRoute>
          } />
          <Route path="/feedback" element={
            <RoleProtectedRoute allowedRole="patient"><Feedback /></RoleProtectedRoute>
          } />

          {/* Static Pages for authenticated users as well */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
  )
}

export default App
