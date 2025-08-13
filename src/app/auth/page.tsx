'use client'

import UnifiedAuthForm from '@/components/auth/UnifiedAuthForm'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <UnifiedAuthForm />
      </div>
    </div>
  )
} 
