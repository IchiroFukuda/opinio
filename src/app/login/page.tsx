'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
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
        if (mode === 'register') {
          setError('新規登録に失敗しました。もう一度お試しください。')
        } else {
          setError('ログインに失敗しました。もう一度お試しください。')
        }
      } else {
        setIsSuccess(true)
        setError('')
        // 成功時は自動的にリダイレクトされる
      }
    } catch (error) {
      console.error('Auth error:', error)
      if (mode === 'register') {
        setError('新規登録に失敗しました。もう一度お試しください。')
      } else {
        setError('ログインに失敗しました。もう一度お試しください。')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setIsSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opinio</h1>
          <p className="text-gray-600">1日3問で即答力を鍛える</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* タブ切り替え */}
          <div className="flex mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              新規登録
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {mode === 'login' ? 'ログイン' : '新規登録'}
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
              {isLoading 
                ? (mode === 'login' ? 'ログイン中...' : '新規登録中...') 
                : (mode === 'login' ? 'ログイン' : '新規登録')
              }
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
              {mode === 'login' ? 'ログイン' : '新規登録'}に成功しました。リダイレクト中...
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' 
                ? 'メールアドレスを入力してログインしてください'
                : 'メールアドレスを入力して新規登録してください'
              }
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'login' 
                ? 'アカウントをお持ちでない場合は、新規登録タブをクリックしてください'
                : '既にアカウントをお持ちの場合は、ログインタブをクリックしてください'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
