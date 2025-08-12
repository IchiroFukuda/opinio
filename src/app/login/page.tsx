'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }

    setIsLoading(true)
    setError('')
    setIsSuccess(false)

    try {
      const result = await signIn('credentials', {
        email,
        redirect: false,
      })

      if (result?.error) {
        setError('ログインに失敗しました。もう一度お試しください。')
      } else {
        setIsSuccess(true)
        setError('')
        // 成功時は自動的にリダイレクトされる
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('ログインに失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opinio</h1>
          <p className="text-gray-600">1日3問で即答力を鍛える</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            ログイン
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
              ログインに成功しました。リダイレクト中...
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              メールアドレスを入力してログインしてください
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
