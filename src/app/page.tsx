'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { DailySetWithQuestions, AnswerRequest } from '@/types'
import QuestionCard from '@/components/QuestionCard'
import Header from '@/components/Header'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function TodayPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const [dailyData, setDailyData] = useState<DailySetWithQuestions | null>(null)
  const [isLoading, setIsLoading] = useState(false) // 初期値をfalseに変更
  const [error, setError] = useState<string | null>(null)

  console.log('TodayPage: rendering with user:', user, 'loading:', loading)

  useEffect(() => {
    console.log('TodayPage: useEffect triggered, user:', user, 'loading:', loading)
    
    // 認証が完了し、ユーザーが存在する場合のみデータを取得
    if (!loading && user) {
      console.log('TodayPage: fetching questions...')
      fetchTodayQuestions()
    } else if (!loading && !user) {
      // 未認証の場合、データ取得を停止
      console.log('TodayPage: user not authenticated, stopping data fetch')
      setIsLoading(false)
    }
  }, [user, loading])

  const fetchTodayQuestions = async () => {
    try {
      console.log('TodayPage: fetchTodayQuestions started')
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/today')

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('TodayPage: questions fetched:', data)
      setDailyData(data)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(t('home.fetchError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSubmit = async (answerData: AnswerRequest) => {
    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.error === 'Daily limit reached') {
          throw new Error(t('home.dailyLimitReached'))
        }
        throw new Error(t('home.submitError', { status: response.status }))
      }

      const result = await response.json()
      
      // 回答データを更新
      if (dailyData) {
        const updatedQuestions = dailyData.questions.map(q => {
          if (q.question.id === answerData.questionId) {
            return {
              ...q,
              answer: result.answer,
              feedback: result.feedback
            }
          }
          return q
        })

        setDailyData({
          ...dailyData,
          questions: updatedQuestions
        })
      }

      console.log('Answer submitted successfully:', result)
    } catch (err) {
      console.error('Submit error:', err)
      throw err
    }
  }

  console.log('TodayPage: render state - loading:', loading, 'isLoading:', isLoading, 'user:', user, 'dailyData:', dailyData)

  // 認証中の場合
  if (loading) {
    console.log('TodayPage: showing auth loading state')
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 言語切り替えボタンを上部に配置 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('auth.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  // 未認証の場合
  if (!user) {
    console.log('TodayPage: showing login required state')
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 言語切り替えボタンを上部に配置 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Opinio</h1>
            <p className="text-gray-600 mb-4">{t('auth.loginRequired')}</p>
            <div className="space-x-4">
              <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                {t('auth.login')}
              </a>
              <a href="/login" className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700">
                {t('auth.register')}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // データ取得中の場合
  if (isLoading) {
    console.log('TodayPage: showing data loading state')
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 言語切り替えボタンを上部に配置 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('home.dataLoading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('TodayPage: showing error state:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 言語切り替えボタンを上部に配置 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchTodayQuestions}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!dailyData) {
    console.log('TodayPage: showing no data state')
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 言語切り替えボタンを上部に配置 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">{t('home.noData')}</p>
          </div>
        </div>
      </div>
    )
  }

  const answeredCount = dailyData.questions.filter(q => q.answer).length
  const isDailyComplete = answeredCount >= 10

  console.log('TodayPage: rendering main content with', dailyData.questions.length, 'questions')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('home.title')}</h1>
          
          {isDailyComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 font-medium">{t('home.dailyComplete')}</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">
                {t('home.dailyProgress', { count: answeredCount })}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {dailyData.questions.map((dailyQuestion) => (
            <QuestionCard
              key={dailyQuestion.question.id}
              dailyQuestion={dailyQuestion}
              onAnswerSubmit={handleAnswerSubmit}
              disabled={isDailyComplete}
            />
          ))}
        </div>
      </main>
    </div>
  )
} 
