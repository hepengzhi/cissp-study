'use server'

import { prisma } from '@/prisma/config'
import { z } from 'zod'
import { Domain, Difficulty } from '@prisma/client'

// Zod schema for question validation
const QuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionTextZh: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().min(1, 'Explanation is required'),
  explanationZh: z.string().optional(),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  tags: z.array(z.string()).default([]),
})

// Refine schema for correctAnswer validation
const QuestionSchemaWithCorrectAnswer = QuestionSchema.refine((data, ctx) => {
  if (data.correctAnswer < 0 || data.correctAnswer >= data.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `correctAnswer must be a valid index (0-${data.options.length - 1})`,
      path: ['correctAnswer']
    })
  }
  return data
})

// Filter schema for getQuestions
const GetQuestionsFilterSchema = z.object({
  search: z.string().optional(),
  domain: z.nativeEnum(Domain).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type QuestionInput = z.infer<typeof QuestionSchema>
export type QuestionFilter = z.infer<typeof GetQuestionsFilterSchema>

// Get paginated list of questions with search and filters
export async function getQuestions(filters: QuestionFilter) {
  try {
    const { search, domain, difficulty, page, pageSize } = GetQuestionsFilterSchema.parse(filters)

    const where = {
      ...(search && {
        questionText: { contains: search, mode: 'insensitive' }
      }),
      ...(domain && { domain }),
      ...(difficulty && { difficulty })
    }

    const skip = (page - 1) * pageSize
    const total = await prisma.question.count({ where })

    const data = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    })

    return {
      data,
      total,
      page,
      pageSize
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
        return `${path}: ${e.message}`
      }).join(', ')
      return { error: 'Validation failed: ' + errorMessages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
