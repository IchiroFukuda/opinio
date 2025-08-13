import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export async function GET() {
  try {
    // NextAuth.jsセッションの取得（App Router用）
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

    // 回答履歴を取得（日付降順）
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        *,
        questions (*),
        feedback (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (answersError) {
      console.error('History Fetch Error:', answersError)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // 日付ごとにグループ化
    const historyByDate = answers.reduce((acc, answer) => {
      const date = new Date(answer.created_at).toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      if (!acc[date]) {
        acc[date] = []
      }

      acc[date].push({
        id: answer.id,
        question: {
          id: answer.question_id,
          text: answer.content,
          category: answer.questions.category,
          is_active: answer.questions.is_active,
          created_at: answer.questions.created_at
        },
        answer: {
          id: answer.id,
          user_id: answer.user_id,
          question_id: answer.question_id,
          content: answer.content,
          elapsed_sec: answer.elapsed_sec,
          created_at: answer.created_at
        },
        feedback: answer.feedback ? {
          id: answer.feedback.id,
          answer_id: answer.feedback.answer_id,
          score_clarity: answer.feedback.score_clarity,
          score_reasoning: answer.feedback.score_reasoning,
          score_diversity: answer.feedback.score_diversity,
          summary: answer.feedback.summary,
          created_at: answer.feedback.created_at
        } : null
      })

      return acc
    }, {} as Record<string, {
      id: string;
      question: {
        id: string;
        text: string;
        category: string;
        is_active: boolean;
        created_at: string;
      };
      answer: {
        id: string;
        user_id: string;
        question_id: string;
        content: string;
        elapsed_sec: number;
        created_at: string;
      };
      feedback: {
        id: string;
        answer_id: string;
        score_clarity: number;
        score_reasoning: number;
        score_diversity: number;
        summary: string;
        created_at: string;
      } | null;
    }[]>)

    // 日付の配列を作成（降順）
    const dates = Object.keys(historyByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime()
    })

    const history = dates.map(date => ({
      date,
      answers: historyByDate[date]
    }))

    return NextResponse.json({ history })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
