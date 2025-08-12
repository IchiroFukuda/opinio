'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Opinio
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link
              href="/history"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              履歴
            </Link>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
} 
