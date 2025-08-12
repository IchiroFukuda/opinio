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
    console.log('AuthContext: status changed:', status)
    console.log('AuthContext: session:', session)
    
    // statusの値を安定化して処理
    const isLoading = status === 'loading'
    setLoading(isLoading)
    
    console.log('AuthContext: loading state set to:', isLoading)
  }, [status, session])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // デバッグ用のログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('AuthContext: render - loading:', loading, 'status:', status, 'user:', session?.user)
  }

  return (
    <AuthContext.Provider value={{ 
      user: session?.user ? {
        id: (session.user as { id?: string }).id || '',
        email: session.user.email || '',
        name: session.user.name || ''
      } : null, 
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
