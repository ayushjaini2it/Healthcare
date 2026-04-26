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
  UserCheck,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import { supabaseServices } from '../services/supabaseServices'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    supabaseServices.authServices.getCurrentUser().then(setUser)
  }, [])

  const handleLogout = async () => {
    await supabaseServices.authServices.signOut()
    window.location.reload()
  }

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
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-gray-500 hidden md:inline-block font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  
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
        </div>
      </div>
    </div>
  )
}

export default Layout
