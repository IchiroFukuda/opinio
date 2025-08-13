'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DynamicHtmlLang() {
  const { language } = useLanguage()

  useEffect(() => {
    // HTMLのlang属性を動的に設定
    document.documentElement.lang = language
  }, [language])

  return null
} 
