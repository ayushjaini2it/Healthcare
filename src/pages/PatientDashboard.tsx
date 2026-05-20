import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserCheck, Calendar, Pill, CreditCard, Activity, Clock } from 'lucide-react'

const PatientDashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const profile = currentUser?.profile

  // Check if profile is incomplete (age is 0 or missing)
  const needsProfileCompletion = !profile?.age || profile.age === 0

  const quickLinks = [
    { name: 'My Profile', href: '/registration', icon: UserCheck, color: 'bg-blue-500' },
    { name: 'Appointments', href: '/appointments', icon: Calendar, color: 'bg-teal-500' },
    { name: 'My Medications', href: '/my-medications', icon: Pill, color: 'bg-green-500' },
    { name: 'My Bills', href: '/my-bills', icon: CreditCard, color: 'bg-orange-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {profile?.first_name || profile?.full_name || 'Patient'}!
        </h1>
        <p className="text-slate-600 mt-2">Manage your healthcare journey from your personal dashboard.</p>
      </div>

      {needsProfileCompletion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
          <div className="bg-yellow-100 p-2 rounded-full shrink-0">
            <UserCheck className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900">Complete Your Profile</h3>
            <p className="text-yellow-700 mt-1">
              Your medical profile is incomplete. Please update your personal and medical details so our doctors can provide the best care.
            </p>
            <Link to="/registration" className="mt-3 inline-block btn-primary bg-yellow-600 hover:bg-yellow-700 border-none">
              Update Profile Now
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link) => (
          <Link key={link.name} to={link.href} className="card hover:shadow-md transition-all duration-200 group border border-slate-100 hover:border-teal-100">
            <div className="flex items-center">
              <div className={`${link.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <link.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-base font-semibold text-slate-900">{link.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="card border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-teal-500" />
          Current Medical Status
        </h2>
        <div className="flex items-center space-x-5 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
            <Clock className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Status</p>
            <p className="text-xl font-bold text-slate-900 capitalize mt-0.5">
              {profile?.status ? profile.status.replace(/_/g, ' ') : 'Registered'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
