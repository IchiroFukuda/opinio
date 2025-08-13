'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()

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
              {t('common.history')}
            </Link>
            <LanguageSwitcher />
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('auth.logout')}
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
} 
