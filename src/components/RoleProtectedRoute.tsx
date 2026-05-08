import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRole: 'doctor' | 'patient'
}

/**
 * Wraps a route and redirects to "/" if the logged-in user's role
 * does not match the required role. This prevents patients from
 * accessing doctor-only pages (and vice versa) by typing URLs directly.
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
  if (currentUser.role !== allowedRole) return <Navigate to="/" replace />

  return <>{children}</>
}
