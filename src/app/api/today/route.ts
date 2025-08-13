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

    // サービスロールキーを使用してSupabaseクライアントを作成
    // これによりRLSポリシーを回避できる
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL, 
      env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

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

    // RPCで本日の出題セットを取得または作成
    const { data: dailySet, error: rpcError } = await supabase.rpc('get_or_create_daily_set', {
      p_user_id: userId
    })
    
    if (rpcError) {
      console.error('RPC Error:', rpcError)
      return NextResponse.json({ error: 'Failed to get daily set' }, { status: 500 })
    }

    if (!dailySet) {
      return NextResponse.json({ error: 'No daily set found' }, { status: 404 })
    }

    // 質問の詳細を取得
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', dailySet.question_ids)
      .eq('is_active', true)

    if (questionsError) {
      console.error('Questions Error:', questionsError)
      return NextResponse.json({ error: 'Failed to get questions' }, { status: 500 })
    }

    // 既存の回答とフィードバックを取得
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        *,
        feedback (*)
      `)
      .eq('user_id', userId)
      .in('question_id', dailySet.question_ids)
      .gte('created_at', new Date().toISOString().split('T')[0])

    if (answersError) {
      console.error('Answers Error:', answersError)
      return NextResponse.json({ error: 'Failed to get answers' }, { status: 500 })
    }

    // 質問と回答を組み合わせて返却
    const dailyQuestions = questions.map(question => {
      const answer = answers.find(a => a.question_id === question.id)
      return {
        question,
        answer: answer ? {
          id: answer.id,
          user_id: answer.user_id,
          question_id: answer.question_id,
          content: answer.content,
          elapsed_sec: answer.elapsed_sec,
          created_at: answer.created_at
        } : undefined,
        feedback: answer?.feedback ? {
          id: answer.feedback.id,
          answer_id: answer.feedback.answer_id,
          score_clarity: answer.feedback.score_clarity,
          score_reasoning: answer.feedback.score_reasoning,
          score_diversity: answer.feedback.score_diversity,
          summary: answer.feedback.summary,
          created_at: answer.feedback.created_at
        } : undefined
      }
    })

    return NextResponse.json({
      daily_set: dailySet,
      questions: dailyQuestions
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
