'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { validatePassword } from '@/lib/auth-utils'

type AuthMode = 'login' | 'register'

export default function UnifiedAuthForm() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; message: string } | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // パスワードの強度チェック（登録モードのみ）
    if (name === 'password' && mode === 'register') {
      setPasswordStrength(validatePassword(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      // ログイン処理
      try {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else {
          setSuccess('ログインに成功しました')
          setTimeout(() => {
            router.push('/')
            router.refresh()
          }, 1000)
        }
      } catch (error) {
        setError('ログイン中にエラーが発生しました')
      }
    } else {
      // 新規登録処理
      if (formData.password !== formData.confirmPassword) {
        setError('パスワードが一致しません')
        setLoading(false)
        return
      }

      if (!passwordStrength?.isValid) {
        setError('パスワードの強度が不足しています')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || '登録に失敗しました')
        } else {
          setSuccess('アカウントが正常に作成されました。ログインしてください。')
          // 登録成功後、ログインモードに切り替え
          setMode('login')
          setFormData({ email: '', password: '', confirmPassword: '', name: '' })
          setPasswordStrength(null)
        }
      } catch (error) {
        setError('登録中にエラーが発生しました')
      }
    }

    setLoading(false)
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
    setFormData({ email: '', password: '', confirmPassword: '', name: '' })
    setPasswordStrength(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opinio</h1>
          <p className="text-gray-600">1日3問で即答力を鍛える</p>
        </div>

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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="お名前を入力"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                mode === 'register' && passwordStrength ? (passwordStrength.isValid ? 'border-green-300' : 'border-red-300') : 'border-gray-300'
              }`}
              placeholder="パスワードを入力"
              required
            />
            {mode === 'register' && passwordStrength && (
              <div className={`text-sm mt-1 ${
                passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordStrength.message}
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="パスワードを再入力"
                required={mode === 'register'}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="text-red-600 text-sm mt-1">
                  パスワードが一致しません
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading 
              ? (mode === 'login' ? 'ログイン中...' : '登録中...') 
              : (mode === 'login' ? 'ログイン' : 'アカウント作成')
            }
          </button>
        </form>
      </div>
    </div>
  )
} 
