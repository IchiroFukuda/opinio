'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import DynamicHtmlLang from './DynamicHtmlLang'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <AuthProvider>
          <DynamicHtmlLang />
          {children}
        </AuthProvider>
      </LanguageProvider>
    </SessionProvider>
  )
} 
