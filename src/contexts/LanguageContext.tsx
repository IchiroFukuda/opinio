'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'ja' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ja')
  const [translations, setTranslations] = useState<Record<string, any>>({})

  useEffect(() => {
    // ローカルストレージから言語設定を読み込み
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['ja', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // 翻訳ファイルを動的に読み込み
    const loadTranslations = async () => {
      try {
        const translations = await import(`@/locales/${language}.json`)
        setTranslations(translations.default)
      } catch (error) {
        console.error('Failed to load translations:', error)
        // フォールバックとして日本語を使用
        const jaTranslations = await import('@/locales/ja.json')
        setTranslations(jaTranslations.default)
      }
    }

    loadTranslations()
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    // ローカルストレージに言語設定を保存
    localStorage.setItem('language', lang)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // 翻訳が見つからない場合はキーをそのまま返す
      }
    }

    if (typeof value === 'string') {
      // パラメータを置換
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return params[param]?.toString() || match
        })
      }
      return value
    }

    return key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 
