'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User } from 'next-auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(status === 'loading')
  }, [status])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <AuthContext.Provider value={{ 
      user: session?.user || null, 
      loading, 
      signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
