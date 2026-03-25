'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const QuizParamsSchema = z.object({
  domains: z.array(z.string()).optional(),
  count: z.number().min(1).max(50)
})

export async function getQuizQuestions(params: z.infer<typeof QuizParamsSchema>) {
  const validated = QuizParamsSchema.parse(params)
  const where = validated.domains && validated.domains.length > 0
    ? { domain: { in: validated.domains as any } }
    : {}

  const questions = await prisma.question.findMany({
    where,
    take: validated.count,
    orderBy: { createdAt: 'desc' }
  })

  // Shuffle questions
  return questions.sort(() => Math.random() - 0.5)
}

export async function updateProgress(domain: string, correct: boolean) {
  const progress = await prisma.progress.upsert({
    where: { domain: domain as any },
    update: {
      quizQuestionsAnswered: { increment: 1 },
      quizCorrectCount: correct ? { increment: 1 } : undefined,
      lastStudied: new Date()
    },
    create: {
      domain: domain as any,
      quizQuestionsAnswered: 1,
      examQuestionsAnswered: 0,
      quizCorrectCount: correct ? 1 : 0,
      examCorrectCount: 0
    }
  })

  return {
    accuracy: (progress.quizCorrectCount + progress.examCorrectCount) / (progress.quizQuestionsAnswered + progress.examQuestionsAnswered),
    total: progress.quizQuestionsAnswered + progress.examQuestionsAnswered
  }
}
