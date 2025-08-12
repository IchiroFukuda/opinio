import { z } from 'zod'

export const answerRequestSchema = z.object({
  questionId: z.number().int().positive(),
  content: z.string().max(1000),
  elapsedSec: z.number().int().min(0).max(60)
})

export const feedbackRequestSchema = z.object({
  answerId: z.number().int().positive()
})

export const aiFeedbackResponseSchema = z.object({
  score_clarity: z.number().int().min(0).max(10),
  score_reasoning: z.number().int().min(0).max(10),
  score_diversity: z.number().int().min(0).max(10),
  summary: z.string().max(100)
}) 
