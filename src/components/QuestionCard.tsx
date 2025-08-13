'use client'

import { useState, useEffect, useCallback } from 'react'
import { DailyQuestion, AnswerRequest } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface QuestionCardProps {
  dailyQuestion: DailyQuestion
  onAnswerSubmit: (data: AnswerRequest) => Promise<void>
  disabled: boolean
}

export default function QuestionCard({ dailyQuestion, onAnswerSubmit, disabled }: QuestionCardProps) {
  const { t } = useLanguage()
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(!!dailyQuestion.answer)

  const handleSubmit = useCallback(async () => {
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
  }, [isSubmitting, isCompleted, onAnswerSubmit, dailyQuestion.question.id, content, timeLeft])

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
  }, [isStarted, timeLeft, isCompleted, handleSubmit])

  const handleStart = () => {
    setIsStarted(true)
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
          <p className="text-sm text-gray-600 mb-2">{t('question.yourAnswer')}:</p>
          <p className="text-gray-900 bg-gray-50 p-3 rounded">
            {dailyQuestion.answer.content || t('question.emptyAnswer')}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">{t('question.aiEvaluation')}:</p>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dailyQuestion.feedback.score_clarity}
              </div>
              <div className="text-xs text-gray-500">{t('question.clarityScore')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dailyQuestion.feedback.score_reasoning}
              </div>
              <div className="text-xs text-gray-500">{t('question.reasoningScore')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dailyQuestion.feedback.score_diversity}
              </div>
              <div className="text-xs text-gray-500">{t('question.diversityScore')}</div>
            </div>
          </div>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
            {dailyQuestion.feedback.summary}
          </p>
        </div>

        <div className="text-xs text-gray-500">
          {t('question.answerTime')}: {dailyQuestion.answer.elapsed_sec}{t('question.seconds')}
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
          {t('question.start')}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-500">{t('question.seconds')}</div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('question.answerPlaceholder')}
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isCompleted}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isCompleted || disabled}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? t('question.submitting') : t('question.submit')}
          </button>

          <p className="text-xs text-gray-500 text-center">
            {t('question.submitShortcut')}
          </p>
        </div>
      )}
    </div>
  )
} 
