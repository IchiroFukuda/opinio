import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { answerRequestSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    // NextAuth.jsセッションの取得（App Router用）
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL, 
      env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // リクエストボディのバリデーション
    const body = await request.json()
    const validatedData = answerRequestSchema.parse(body)

    // ユーザーIDを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // 本日の回答制限チェック
    const { data: canAnswer, error: limitError } = await supabase.rpc('can_answer_today', {
      p_user_id: userId
    })
    
    if (limitError) {
      console.error('Limit Check Error:', limitError)
      return NextResponse.json({ error: 'Failed to check daily limit' }, { status: 500 })
    }

    if (!canAnswer) {
      return NextResponse.json({ error: 'Daily limit reached' }, { status: 403 })
    }

    // 回答を保存
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert({
        user_id: userId,
        question_id: validatedData.questionId,
        content: validatedData.content,
        elapsed_sec: validatedData.elapsedSec
      })
      .select()
      .single()

    if (answerError) {
      console.error('Answer Insert Error:', answerError)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }

    // AIフィードバックを取得（内部APIを呼び出し）
    try {
      const feedbackResponse = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal': env.INTERNAL_TOKEN
        },
        body: JSON.stringify({ answerId: answer.id })
      })

      if (feedbackResponse.ok) {
        const feedback = await feedbackResponse.json()
        return NextResponse.json({
          answer,
          feedback
        })
      } else {
        console.error('Feedback API Error:', feedbackResponse.status)
        // フィードバックが失敗しても回答は保存済み
        return NextResponse.json({
          answer,
          feedback: null
        })
      }
    } catch (feedbackError) {
      console.error('Feedback Request Error:', feedbackError)
      // フィードバックが失敗しても回答は保存済み
      return NextResponse.json({
        answer,
        feedback: null
      })
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
