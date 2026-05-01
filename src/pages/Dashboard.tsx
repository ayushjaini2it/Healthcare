import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Stethoscope, Activity, FileText, TrendingUp, Clock } from 'lucide-react'
import { supabaseServices } from '../services/supabaseServices'
import { Patient } from '../types'

const Dashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await supabaseServices.patientServices.getAllPatients()
        if (data) setPatients(data)
      } catch (error) {
        console.error('Error fetching patients:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPatients()
  }, [])
  const stats = [
    { name: 'Total Patients', value: '1,246', icon: Users, change: '+12%', color: 'bg-teal-500' },
    { name: 'Active Consultations', value: '45', icon: Stethoscope, change: '+8%', color: 'bg-green-500' },
    { name: 'Pending Diagnoses', value: '23', icon: Activity, change: '-3%', color: 'bg-yellow-500' },
    { name: 'Discharges Today', value: '18', icon: FileText, change: '+15%', color: 'bg-teal-50/500' },
  ]

  const recentPatients = patients.slice(0, 10).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    time: new Date(p.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }))

  const flowSteps = [
    { name: 'Patient Entry', path: '/registration', status: 'active' },
    { name: 'Registration', path: '/registration', status: 'active' },
    { name: 'Consultation', path: '/consultation', status: 'active' },
    { name: 'Diagnosis', path: '/diagnosis', status: 'active' },
    { name: 'Treatment Decision', path: '/treatment', status: 'active' },
    { name: 'Pharmacy', path: '/pharmacy', status: 'active' },
    { name: 'Billing', path: '/billing', status: 'active' },
    { name: 'Discharge', path: '/discharge', status: 'active' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Healthcare Supply Chain Dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor and manage patient flow through the healthcare system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change} from yesterday</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Healthcare Flow Visualization */}
      <div className="card">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Patient Flow Process</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {flowSteps.map((step, index) => (
            <React.Fragment key={step.name}>
              <Link to={step.path}>
                <div className={`px-4 py-2 rounded-lg text-center transition-colors ${
                  step.status === 'active' 
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  <p className="text-sm font-medium">{step.name}</p>
                </div>
              </Link>
              {index < flowSteps.length - 1 && (
                <div className="text-slate-400">{'->'}</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center text-green-600">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm">Average processing time: 4.5 hours</span>
          </div>
        </div>
      </div>

      {/* Recent Patients and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Patients</h2>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-4 text-slate-500">Loading patients...</div>
            ) : recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{patient.name}</p>
                    <p className="text-sm text-slate-600">{patient.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{patient.time}</p>
                    <Link to={`/registration`} className="text-primary-600 hover:text-primary-700 text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">No recent patients found.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/registration" className="btn-primary text-center">
              Register New Patient
            </Link>
            <Link to="/consultation" className="btn-secondary text-center">
              Start Consultation
            </Link>
            <Link to="/diagnosis" className="btn-secondary text-center">
              Order Tests
            </Link>
            <Link to="/pharmacy" className="btn-secondary text-center">
              Dispense Medication
            </Link>
            <Link to="/billing" className="btn-secondary text-center">
              Process Payment
            </Link>
            <Link to="/discharge" className="btn-secondary text-center">
              Discharge Patient
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Today's Overview</h2>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600">Patient Satisfaction</p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <span className="ml-2 text-sm font-medium">92%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600">Bed Occupancy</p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <span className="ml-2 text-sm font-medium">78%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600">Staff Efficiency</p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-teal-50/500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="ml-2 text-sm font-medium">85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
