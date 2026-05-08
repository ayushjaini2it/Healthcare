import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRole: 'doctor' | 'patient' | 'pharmacist' | 'admin' | string[]
}

/**
 * Wraps a route and redirects to "/" if the logged-in user's role
 * does not match the required role(s).
 */
export function RoleProtectedRoute({ children, allowedRole }: Props) {
  const { currentUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/?login=true" replace />
  
  const hasAccess = Array.isArray(allowedRole) 
    ? allowedRole.includes(currentUser.role)
    : currentUser.role === allowedRole;

  if (!hasAccess) return <Navigate to="/" replace />

  return <>{children}</>
}
