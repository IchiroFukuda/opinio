import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, validatePassword } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // セッションをチェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    // バリデーション
    if (!password) {
      return NextResponse.json(
        { error: 'パスワードは必須です' },
        { status: 400 }
      )
    }

    // パスワードの強度チェック
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザーのパスワードを更新
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'パスワードの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'パスワードが正常に設定されました'
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 
