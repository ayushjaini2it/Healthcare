import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  currentUser: any | null
  isLoading: boolean
  isInitialLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isInitialLoading: true,
  refreshUser: async () => {}
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const refreshUser = async () => {
    setIsLoading(true)
    try {
      const user = await supabaseServices.authServices.getCurrentUser()
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser()
      setIsInitialLoading(false)
    }
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, isInitialLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
