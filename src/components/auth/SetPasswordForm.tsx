'use client'

import { useState } from 'react'
import { validatePassword } from '@/lib/auth-utils'

interface SetPasswordFormProps {
  onSuccess: () => void
}

export default function SetPasswordForm({ onSuccess }: SetPasswordFormProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; message: string } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // パスワードの強度チェック
    if (name === 'password') {
      setPasswordStrength(validatePassword(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // バリデーション
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
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'パスワードの設定に失敗しました')
      } else {
        onSuccess()
      }
    } catch (error) {
      setError('パスワード設定中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          パスワード設定
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          セキュリティのため、パスワードを設定してください
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                passwordStrength ? (passwordStrength.isValid ? 'border-green-300' : 'border-red-300') : 'border-gray-300'
              }`}
              placeholder="新しいパスワードを入力"
              required
            />
            {passwordStrength && (
              <div className={`text-sm mt-1 ${
                passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordStrength.message}
              </div>
            )}
          </div>

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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="パスワードを再入力"
              required
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="text-red-600 text-sm mt-1">
                パスワードが一致しません
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '設定中...' : 'パスワード設定'}
          </button>
        </form>
      </div>
    </div>
  )
} 
