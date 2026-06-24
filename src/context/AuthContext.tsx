import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  currentUser: any | null
  isLoading: boolean
  isInitialLoading: boolean
  requiresPasswordReset: boolean
  refreshUser: () => Promise<void>
  clearPasswordResetFlag: () => void
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isInitialLoading: true,
  requiresPasswordReset: false,
  refreshUser: async () => {},
  clearPasswordResetFlag: () => {}
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(() => {
    return sessionStorage.getItem('force_password_reset') === 'true'
  })

  const refreshUser = async () => {
    setIsLoading(true)
    try {
      // Legacy local storage check for same-browser
      const resetTime = localStorage.getItem('password_reset_in_progress')
      if (resetTime && Date.now() - parseInt(resetTime) < 3600000) {
        setRequiresPasswordReset(true)
        sessionStorage.setItem('force_password_reset', 'true')
        // We do NOT set currentUser to null, because we actually NEED the session
        // so they can securely update their password. We just lock the UI.
      }

      const user = await supabaseServices.authServices.getCurrentUser()
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearPasswordResetFlag = () => {
    sessionStorage.removeItem('force_password_reset')
    setRequiresPasswordReset(false)
  }

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser()
      setIsInitialLoading(false)
    }
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('force_password_reset', 'true')
        setRequiresPasswordReset(true)
      }
      refreshUser()
    })

    const handleStorage = (e: StorageEvent) => {
      // If another tab completes the password reset and clears the flag, refresh!
      if (e.key === 'password_reset_in_progress' && !e.newValue) {
        refreshUser()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, isInitialLoading, requiresPasswordReset, refreshUser, clearPasswordResetFlag }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
