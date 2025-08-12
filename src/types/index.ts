export interface Profile {
  id: string
  display_name: string | null
  created_at: string
}

export interface Question {
  id: number
  category: string
  text: string
  is_active: boolean
  created_at: string
}

export interface DailySet {
  id: number
  user_id: string
  date: string
  question_ids: number[]
  created_at: string
}

export interface Answer {
  id: number
  user_id: string
  question_id: number
  content: string
  elapsed_sec: number
  created_at: string
}

export interface Feedback {
  id: number
  answer_id: number
  score_clarity: number
  score_reasoning: number
  score_diversity: number
  summary: string
  created_at: string
}

export interface DailyQuestion {
  question: Question
  answer?: Answer
  feedback?: Feedback
}

export interface DailySetWithQuestions {
  daily_set: DailySet
  questions: DailyQuestion[]
}

export interface AnswerRequest {
  questionId: number
  content: string
  elapsedSec: number
}

export interface FeedbackRequest {
  answerId: number
}

export interface AIFeedbackResponse {
  score_clarity: number
  score_reasoning: number
  score_diversity: number
  summary: string
} 
