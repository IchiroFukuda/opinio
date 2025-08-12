'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DailySetWithQuestions, AnswerRequest } from '@/types'
import QuestionCard from '@/components/QuestionCard'
import Header from '@/components/Header'

export default function TodayPage() {
  const { user, loading } = useAuth()
  const [dailyData, setDailyData] = useState<DailySetWithQuestions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !loading) {
      fetchTodayQuestions()
    }
  }, [user, loading])

  const fetchTodayQuestions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/today')

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setDailyData(data)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('今日の出題の取得に失敗しました')
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
          throw new Error('本日の回答上限に達しました')
        }
        throw new Error(`送信エラー: ${response.status}`)
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Opinio</h1>
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            ログイン
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchTodayQuestions}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!dailyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">データが見つかりません</p>
          </div>
        </div>
      </div>
    )
  }

  const answeredCount = dailyData.questions.filter(q => q.answer).length
  const isDailyComplete = answeredCount >= 3

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">今日の出題</h1>
          
          {isDailyComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 font-medium">本日は終了。また明日。</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">
                今日の残り: {answeredCount}/3
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {dailyData.questions.map((dailyQuestion, index) => (
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
