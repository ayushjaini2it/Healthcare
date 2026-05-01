import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
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
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser, isInitialLoading } = useAuth()

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Keep showing Auth until we have a definitively valid currentUser
  if (!currentUser) {
    return <Auth />
  }

  return (
      <Layout>
        <Routes>
          {/* Shared routes — accessible by any authenticated user */}
          <Route path="/" element={<Dashboard />} />

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

          {/* Patient-only routes */}
          <Route path="/registration" element={
            <RoleProtectedRoute allowedRole="patient"><PatientRegistration /></RoleProtectedRoute>
          } />
          <Route path="/appointments" element={
            <RoleProtectedRoute allowedRole="patient"><AppointmentBooking /></RoleProtectedRoute>
          } />
          <Route path="/pharmacy" element={
            <RoleProtectedRoute allowedRole="patient"><Pharmacy /></RoleProtectedRoute>
          } />
          <Route path="/billing" element={
            <RoleProtectedRoute allowedRole="patient"><Billing /></RoleProtectedRoute>
          } />
          <Route path="/feedback" element={
            <RoleProtectedRoute allowedRole="patient"><Feedback /></RoleProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
  )
}

export default App
