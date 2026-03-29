'use server'

import { prisma } from '@/prisma/config'
import { z } from 'zod'
import { Domain, Difficulty } from '@prisma/client'
import { QuestionSchema, ImportQuestionSchema, type QuestionInput } from '@/lib/import-parser'

export type { QuestionInput } from '@/lib/import-parser'

// Re-export ParsedRow for backward compat
export type { ParsedRow } from '@/lib/import-parser'

// Filter schema for getQuestions
const GetQuestionsFilterSchema = z.object({
  search: z.string().optional(),
  domain: z.nativeEnum(Domain).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type QuestionFilter = z.infer<typeof GetQuestionsFilterSchema>

// --- READ ---

export async function getQuestions(filters: QuestionFilter) {
  try {
    const { search, domain, difficulty, page, pageSize } = GetQuestionsFilterSchema.parse(filters)

    const where = {
      ...(search && { questionText: { contains: search, mode: 'insensitive' as const } }),
      ...(domain && { domain }),
      ...(difficulty && { difficulty }),
    }

    const skip = (page - 1) * pageSize
    const total = await prisma.question.count({ where })
    const data = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    })

    return { data, total, page, pageSize }
  } catch (error) {
    return handleError(error)
  }
}

export async function getQuestionById(id: string) {
  try {
    return await prisma.question.findUnique({ where: { id } })
  } catch (error) {
    return handleError(error)
  }
}

// --- CREATE ---

export async function createQuestion(data: QuestionInput) {
  try {
    const validated = QuestionSchema.parse(data)
    return await prisma.question.create({ data: validated })
  } catch (error) {
    return handleError(error)
  }
}

// --- UPDATE ---

export async function updateQuestion(id: string, data: QuestionInput) {
  try {
    const validated = QuestionSchema.parse(data)
    return await prisma.question.update({
      where: { id },
      data: validated,
    })
  } catch (error) {
    return handleError(error)
  }
}

// --- DELETE ---

export async function deleteQuestion(id: string) {
  try {
    await prisma.question.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteQuestions(ids: string[]) {
  try {
    const result = await prisma.question.deleteMany({
      where: { id: { in: ids } },
    })
    return { deleted: result.count }
  } catch (error) {
    return handleError(error)
  }
}

// --- IMPORT / EXPORT ---

export async function checkDuplicateQuestions(
  questionTexts: string[],
  questionTextsZh: string[],
  explanations: string[],
  explanationsZh: string[],
) {
  try {
    type Condition = { questionText: { in: string[] } } | { questionTextZh: { in: string[] } } | { explanation: { in: string[] } } | { explanationZh: { in: string[] } }
    const conditions: Condition[] = []
    if (questionTexts.length > 0) conditions.push({ questionText: { in: questionTexts } })
    if (questionTextsZh.length > 0) conditions.push({ questionTextZh: { in: questionTextsZh } })
    if (explanations.length > 0) conditions.push({ explanation: { in: explanations } })
    if (explanationsZh.length > 0) conditions.push({ explanationZh: { in: explanationsZh } })

    if (conditions.length === 0) return { en: [] as string[], zh: [] as string[], expEn: [] as string[], expZh: [] as string[] }

    const existing = await prisma.question.findMany({
      where: { OR: conditions },
      select: { questionText: true, questionTextZh: true, explanation: true, explanationZh: true },
    })
    return {
      en: existing.map(q => q.questionText),
      zh: existing.map(q => q.questionTextZh).filter(Boolean) as string[],
      expEn: existing.map(q => q.explanation),
      expZh: existing.map(q => q.explanationZh).filter(Boolean) as string[],
    }
  } catch (error) {
    return handleError(error)
  }
}

export async function importQuestionBatch(rows: QuestionInput[]) {
  try {
    let imported = 0
    let errors = 0

    for (const data of rows) {
      const validated = ImportQuestionSchema.safeParse(data)
      if (!validated.success) {
        errors++
        continue
      }
      try {
        await prisma.question.create({ data: validated.data })
        imported++
      } catch {
        errors++
      }
    }

    return { imported, errors }
  } catch (error) {
    return handleError(error)
  }
}

export async function exportQuestions(filters: QuestionFilter, format: 'json' | 'csv') {
  try {
    const { search, domain, difficulty } = GetQuestionsFilterSchema.parse(filters)

    const where = {
      ...(search && { questionText: { contains: search, mode: 'insensitive' as const } }),
      ...(domain && { domain }),
      ...(difficulty && { difficulty }),
    }

    const questions = await prisma.question.findMany({ where, orderBy: { createdAt: 'desc' } })

    if (format === 'json') {
      const exportData = questions.map(({ questionImages, ...q }) => ({
        ...q,
        question_images: questionImages,
      }))
      return JSON.stringify({ total_questions: questions.length, questions: exportData }, null, 2)
    }

    // CSV format
    const headers = 'questionText,questionTextZh,optionA,optionB,optionC,optionD,optionAZh,optionBZh,optionCZh,optionDZh,correctAnswer,explanation,explanationZh,domain,difficulty,tags,questionType,matchItems'
    const letterFromIndex = (i: number) => String.fromCharCode(65 + i)

    const rows = questions.map(q => {
      const opts = q.options
      const optsZh = q.optionsZh ?? []

      // Handle correctAnswer based on questionType
      let correctLetter: string
      if (q.questionType === 'MATCHING') {
        // Convert "[0,2,3,1]" to "A,C,D,B"
        const indices = JSON.parse(q.correctAnswer) as number[]
        correctLetter = indices.map(idx => letterFromIndex(idx)).join(',')
      } else {
        // Single choice: convert "0" to "A"
        correctLetter = letterFromIndex(parseInt(q.correctAnswer, 10))
      }

      const tagsStr = (q.tags ?? []).join('|')
      const matchItemsStr = (q.matchItems ?? []).join('|')

      const escapeCSV = (v: string) => {
        if (v.includes(',') || v.includes('"') || v.includes('\n')) {
          return `"${v.replace(/"/g, '""')}"`
        }
        return v
      }

      return [
        escapeCSV(q.questionText),
        escapeCSV(q.questionTextZh ?? ''),
        ...opts.map(escapeCSV),
        ...Array(4 - opts.length).fill(''),
        ...optsZh.map(escapeCSV),
        ...Array(4 - optsZh.length).fill(''),
        correctLetter,
        escapeCSV(q.explanation),
        escapeCSV(q.explanationZh ?? ''),
        q.domain,
        q.difficulty,
        escapeCSV(tagsStr),
        q.questionType,
        escapeCSV(matchItemsStr),
      ].join(',')
    })

    return [headers, ...rows].join('\n')
  } catch (error) {
    return handleError(error)
  }
}

// --- ERROR HANDLER ---

function handleError(error: unknown): { error: string } {
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
