'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Link from 'next/link'

interface HistoryItem {
  date: string
  answers: Array<{
    id: number
    question: {
      id: number
      category: string
      text: string
    }
    answer: {
      id: number
      content: string
      elapsed_sec: number
      created_at: string
    }
    feedback: {
      id: number
      score_clarity: number
      score_reasoning: number
      score_diversity: number
      summary: string
    } | null
  }>
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !loading) {
      fetchHistory()
    }
  }, [user, loading])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/history')

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setHistory(data.history)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('履歴の取得に失敗しました')
    } finally {
      setIsLoading(false)
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
              onClick={fetchHistory}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">回答履歴</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">まだ回答がありません</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
              今日の出題に戻る
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {history.map((dateGroup, dateIndex) => (
              <div key={dateIndex} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                  {dateGroup.date}
                </h2>
                
                <div className="space-y-4">
                  {dateGroup.answers.map((item) => (
                    <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">
                          カテゴリ: {item.question.category}
                        </p>
                        <h3 className="font-medium text-gray-900">
                          {item.question.text}
                        </h3>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">あなたの回答:</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">
                          {item.answer.content || '(空の回答)'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          回答時間: {item.answer.elapsed_sec}秒
                        </p>
                      </div>

                      {item.feedback && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">AI評価:</p>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {item.feedback.score_clarity}
                              </div>
                              <div className="text-xs text-gray-500">結論の明確さ</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {item.feedback.score_reasoning}
                              </div>
                              <div className="text-xs text-gray-500">理由の妥当性</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">
                                {item.feedback.score_diversity}
                              </div>
                              <div className="text-xs text-gray-500">視点の多様性</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                            {item.feedback.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 
