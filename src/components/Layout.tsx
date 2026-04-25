import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Users, 
  Stethoscope, 
  Microscope, 
  Pill, 
  FileText, 
  CreditCard, 
  Home, 
  MessageSquare,
  Activity,
  UserCheck
} from 'lucide-react'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Patient Entry', href: '/registration', icon: UserCheck },
    { name: 'Registration', href: '/registration', icon: Users },
    { name: 'Consultation', href: '/consultation', icon: Stethoscope },
    { name: 'Diagnosis', href: '/diagnosis', icon: Microscope },
    { name: 'Treatment', href: '/treatment', icon: Activity },
    { name: 'Pharmacy', href: '/pharmacy', icon: Pill },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Discharge', href: '/discharge', icon: FileText },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  ]

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
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
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
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
