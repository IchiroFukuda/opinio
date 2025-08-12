import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { env } from '@/lib/env'
import { feedbackRequestSchema, aiFeedbackResponseSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // 内部トークンの認証
    const internalToken = request.headers.get('x-internal')
    if (internalToken !== env.INTERNAL_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // リクエストボディのバリデーション
    const body = await request.json()
    const validatedData = feedbackRequestSchema.parse(body)

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 回答と質問の詳細を取得
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select(`
        *,
        questions (*)
      `)
      .eq('id', validatedData.answerId)
      .single()

    if (answerError || !answer) {
      console.error('Answer Fetch Error:', answerError)
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    const question = answer.questions
    if (!question) {
      console.error('Question not found for answer:', validatedData.answerId)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // OpenAIでフィードバックを生成
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    })

    const prompt = `あなたは「短時間で述べた意見」を採点する面接官です。
入力には「質問文」「回答文」が与えられます。以下を0-10で採点し、合計100文字以内で講評してください。

評価基準:
- 結論の明確さ（立場が最初に明言されているか）
- 理由の妥当性（具体性や根拠）
- 視点の多様性（反論/条件付きの補足があるか）

質問文: ${question.text}
回答文: ${answer.content}

出力は必ず次のJSONのみ:
{
  "score_clarity": number,
  "score_reasoning": number,
  "score_diversity": number,
  "summary": "100字以内の日本語"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは面接官です。必ず指定されたJSON形式で回答してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI response is empty')
    }

    // JSONレスポンスのパースとバリデーション
    let aiResponse
    try {
      aiResponse = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Content:', content)
      throw new Error('Invalid JSON response from OpenAI')
    }

    const validatedFeedback = aiFeedbackResponseSchema.parse(aiResponse)

    // フィードバックをデータベースに保存
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        answer_id: validatedData.answerId,
        score_clarity: validatedFeedback.score_clarity,
        score_reasoning: validatedFeedback.score_reasoning,
        score_diversity: validatedFeedback.score_diversity,
        summary: validatedFeedback.summary
      })
      .select()
      .single()

    if (feedbackError) {
      console.error('Feedback Insert Error:', feedbackError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    // 成功ログ（トークンは記録しない）
    console.log(`Feedback generated for answer ${validatedData.answerId}: ${validatedFeedback.summary}`)

    return NextResponse.json(feedback)

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('OpenAI')) {
      console.error('OpenAI Error:', error)
      return NextResponse.json({ error: 'AI evaluation failed' }, { status: 500 })
    }

    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
