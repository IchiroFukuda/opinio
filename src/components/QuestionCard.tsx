'use client'

import { useState, useEffect } from 'react'
import { DailyQuestion, AnswerRequest } from '@/types'

interface QuestionCardProps {
  dailyQuestion: DailyQuestion
  onAnswerSubmit: (data: AnswerRequest) => Promise<void>
  disabled: boolean
}

export default function QuestionCard({ dailyQuestion, onAnswerSubmit, disabled }: QuestionCardProps) {
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(!!dailyQuestion.answer)

  useEffect(() => {
    if (isStarted && timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isCompleted) {
      // 時間切れで自動送信
      handleSubmit()
    }
  }, [isStarted, timeLeft, isCompleted])

  const handleStart = () => {
    setIsStarted(true)
  }

  const handleSubmit = async () => {
    if (isSubmitting || isCompleted) return

    setIsSubmitting(true)
    try {
      await onAnswerSubmit({
        questionId: dailyQuestion.question.id,
        content: content.trim() || '',
        elapsedSec: 45 - timeLeft
      })
      setIsCompleted(true)
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter送信を無効化（誤送信防止）
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isCompleted && dailyQuestion.answer && dailyQuestion.feedback) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {dailyQuestion.question.text}
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">あなたの回答:</p>
          <p className="text-gray-900 bg-gray-50 p-3 rounded">
            {dailyQuestion.answer.content || '(空の回答)'}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">AI評価:</p>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dailyQuestion.feedback.score_clarity}
              </div>
              <div className="text-xs text-gray-500">結論の明確さ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dailyQuestion.feedback.score_reasoning}
              </div>
              <div className="text-xs text-gray-500">理由の妥当性</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dailyQuestion.feedback.score_diversity}
              </div>
              <div className="text-xs text-gray-500">視点の多様性</div>
            </div>
          </div>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
            {dailyQuestion.feedback.summary}
          </p>
        </div>

        <div className="text-xs text-gray-500">
          回答時間: {dailyQuestion.answer.elapsed_sec}秒
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {dailyQuestion.question.text}
      </h3>

      {!isStarted ? (
        <button
          onClick={handleStart}
          disabled={disabled}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          開始
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-500">秒</div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ここに回答を入力してください..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isCompleted}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isCompleted || disabled}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? '送信中...' : '送信'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Ctrl+Enter または Cmd+Enter で送信できます
          </p>
        </div>
      )}
    </div>
  )
} 
