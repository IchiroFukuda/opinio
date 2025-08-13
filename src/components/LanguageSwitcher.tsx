'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageChange = (newLanguage: 'ja' | 'en') => {
    if (newLanguage !== language) {
      setLanguage(newLanguage)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">{t('language.switchLanguage')}:</span>
      <div className="flex bg-gray-100 rounded-md p-1">
        <button
          onClick={() => handleLanguageChange('ja')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            language === 'ja'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('language.ja')}
        </button>
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('language.en')}
        </button>
      </div>
    </div>
  )
} 
