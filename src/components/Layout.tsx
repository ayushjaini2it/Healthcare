import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Stethoscope, 
  Microscope, 
  Pill, 
  FileText, 
  CreditCard, 
  Home, 
  MessageSquare,
  Activity,
  UserCheck,
  LogOut,
  Calendar,
  Bell,
} from 'lucide-react'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser: user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const handleLogout = async () => {
    // Navigate strictly to the base path, dropping any ?login=true search params instantly
    navigate('/', { replace: true })
    await supabaseServices.authServices.signOut()
  }

  // Real-time pending appointment count for doctors
  useEffect(() => {
    if (user?.role !== 'doctor' || !user?.id) return

    const fetchPending = async () => {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('status', 'pending')
      setPendingCount(count || 0)
    }

    fetchPending()

    // Subscribe to real-time inserts/updates on appointments
    const channel = supabase
      .channel('doctor-appointment-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${user.id}` },
        () => fetchPending()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, user?.role])

  const doctorNav = [
    { name: 'Dashboard', href: '/', icon: Home, badge: 0 },
    { name: 'Appointments', href: '/doctor-appointments', icon: Calendar, badge: pendingCount },
    { name: 'Consultation', href: '/consultation', icon: Stethoscope, badge: 0 },
    { name: 'Diagnosis', href: '/diagnosis', icon: Microscope, badge: 0 },
    { name: 'Treatment', href: '/treatment', icon: Activity, badge: 0 },
    { name: 'Discharge', href: '/discharge', icon: FileText, badge: 0 },
    { name: 'Patient Feedback', href: '/feedback-dashboard', icon: MessageSquare, badge: 0 },
  ]

  const pharmacistNav = [
    { name: 'Pharmacy Queue', href: '/pharmacy', icon: Pill, badge: 0 },
  ]

  const adminNav = [
    { name: 'Billing & Invoices', href: '/billing', icon: CreditCard, badge: 0 },
    { name: 'Patient Feedback', href: '/feedback-dashboard', icon: MessageSquare, badge: 0 },
  ]

  const patientNav = [
    { name: 'Dashboard', href: '/', icon: Home, badge: 0 },
    { name: 'My Profile', href: '/registration', icon: UserCheck, badge: 0 },
    { name: 'Appointments', href: '/appointments', icon: Calendar, badge: 0 },
    { name: 'Clinical Records', href: '/my-records', icon: FileText, badge: 0 },
    { name: 'My Medications', href: '/my-medications', icon: Pill, badge: 0 },
    { name: 'My Bills', href: '/my-bills', icon: CreditCard, badge: 0 },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare, badge: 0 },
  ]

  let navigation = patientNav;
  if (user?.role === 'doctor') navigation = doctorNav;
  if (user?.role === 'pharmacist') navigation = pharmacistNav;
  if (user?.role === 'admin') navigation = adminNav;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <img src="/logo.png" alt="Health Connect Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Health-Connect
              </h1>
            </div>
          </div>
          
          <nav className="mt-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium">
                    Manage your healthcare journey
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-slate-500 hidden md:inline-block font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>

                  {/* Notification bell for doctors */}
                  {user?.role === 'doctor' && pendingCount > 0 && (
                    <Link
                      to="/doctor-appointments"
                      className="relative p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                      title={`${pendingCount} pending appointment${pendingCount > 1 ? 's' : ''}`}
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-4 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-100">
                    <div className="h-9 w-9 bg-teal-600 rounded-full flex items-center justify-center shadow-sm border border-slate-200 shadow-teal-100">
                      <span className="text-white text-sm font-bold">
                        {user?.profile?.full_name?.[0] || user?.profile?.first_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm font-bold text-slate-900 leading-none">
                        {user?.profile?.full_name || `${user?.profile?.first_name} ${user?.profile?.last_name}` || 'User'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto animate-fade-in opacity-0 ![animation-fill-mode:both]">
              {children}
            </div>
          </main>

          {/* Copyright Footer */}
          <footer className="border-t border-slate-100 bg-white px-8 py-4">
            <p className="text-center text-xs text-slate-400 font-medium">
              All rights are reserved since 2026 &copy; Lokesh and Ayush
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default Layout
