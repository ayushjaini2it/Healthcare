import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const { currentUser: user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const handleLogout = async () => {
    await supabaseServices.authServices.signOut()
    window.location.reload()
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
  ]

  const patientNav = [
    { name: 'Dashboard', href: '/', icon: Home, badge: 0 },
    { name: 'My Profile', href: '/registration', icon: UserCheck, badge: 0 },
    { name: 'Appointments', href: '/appointments', icon: Calendar, badge: 0 },
    { name: 'Pharmacy', href: '/pharmacy', icon: Pill, badge: 0 },
    { name: 'Billing', href: '/billing', icon: CreditCard, badge: 0 },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare, badge: 0 },
  ]

  const navigation = user?.role === 'doctor' ? doctorNav : patientNav

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-600">
              Healthcare SCM
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Supply Chain Management
            </p>
            {user?.role && (
              <span className={`inline-flex items-center mt-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === 'doctor' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {user.role === 'doctor' ? '🩺 Doctor' : '🏥 Patient'}
              </span>
            )}
          </div>
          
          <nav className="mt-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Healthcare Service Supply Chain Management
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-gray-500 hidden md:inline-block font-medium">
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
                      className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title={`${pendingCount} pending appointment${pendingCount > 1 ? 's' : ''}`}
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-4 bg-gray-50 p-1.5 pr-4 rounded-full border border-gray-100">
                    <div className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center shadow-md shadow-indigo-100">
                      <span className="text-white text-sm font-bold">
                        {user?.profile?.full_name?.[0] || user?.profile?.first_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 leading-none">
                        {user?.profile?.full_name || `${user?.profile?.first_name} ${user?.profile?.last_name}` || 'User'}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                        {user?.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-8">
            {children}
          </main>

          {/* Copyright Footer */}
          <footer className="border-t border-gray-100 bg-white px-8 py-4">
            <p className="text-center text-xs text-gray-400 font-medium">
              All rights are reserved since 2026 &copy; Lokesh and Ayush
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default Layout
