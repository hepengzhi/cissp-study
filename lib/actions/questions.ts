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
}).refine((data) => {
  return data.correctAnswer >= 0 && data.correctAnswer < data.options.length
}, {
  message: 'correctAnswer must be a valid index into options array',
  path: ['correctAnswer'],
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

export interface ParsedRow {
  data: z.infer<typeof QuestionSchema>
  valid: boolean
  error?: string
  sourceIndex: number
}

export async function parseImportFile(content: string, format: 'json' | 'csv') {
  try {
    if (format === 'json') {
      return parseJSON(content)
    } else {
      return parseCSV(content)
    }
  } catch (error) {
    return handleError(error)
  }
}

function parseJSON(content: string): { data: ParsedRow[]; total: number; errors: number } {
  const raw = JSON.parse(content)
  const questions = raw.questions ?? []
  const rows: ParsedRow[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    // Convert options object {A: "...", B: "..."} → string[] and correctAnswer letter → index
    let options: string[] = []
    let optionsZh: string[] = []
    let correctAnswer = 0

    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const keys = Object.keys(q.options).sort()
      options = keys.map(k => q.options[k])
      // Convert correctAnswer letter to index
      if (typeof q.correctAnswer === 'string') {
        const letter = q.correctAnswer.toUpperCase()
        correctAnswer = letter.charCodeAt(0) - 'A'.charCodeAt(0)
      } else {
        correctAnswer = q.correctAnswer ?? 0
      }
    } else if (Array.isArray(q.options)) {
      options = q.options
      correctAnswer = q.correctAnswer ?? 0
    }

    const questionData = {
      questionText: q.questionText ?? '',
      questionTextZh: q.questionTextZh || undefined,
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      explanation: q.explanation ?? '',
      explanationZh: q.explanationZh || undefined,
      domain: q.domain ?? '',
      difficulty: q.difficulty ?? '',
      tags: q.tags ?? [],
    }

    const result = QuestionSchema.safeParse(questionData)
    if (result.success) {
      rows.push({ data: result.data, valid: true, sourceIndex: i })
    } else {
      const msgs = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      rows.push({ data: questionData as any, valid: false, error: msgs, sourceIndex: i })
    }
  }

  const errors = rows.filter(r => !r.valid).length
  return { data: rows, total: rows.length, errors }
}

function parseCSV(content: string): { data: ParsedRow[]; total: number; errors: number } {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    return { data: [], total: 0, errors: 0 }
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })

    // Build options array from optionA, optionB, etc.
    const options: string[] = []
    const optionsZh: string[] = []
    for (let j = 0; j < 6; j++) {
      const letter = String.fromCharCode(65 + j)
      const optVal = row[`option${letter.toLowerCase()}`]
      const optZhVal = row[`option${letter.toLowerCase()}zh`]
      if (optVal) {
        options.push(optVal)
        if (optZhVal) optionsZh.push(optZhVal)
      }
    }

    // Convert letter answer to index
    let correctAnswer = 0
    const answerStr = (row['correctanswer'] ?? '').toUpperCase().trim()
    if (answerStr.length === 1 && answerStr >= 'A' && answerStr <= 'F') {
      correctAnswer = answerStr.charCodeAt(0) - 'A'.charCodeAt(0)
    }

    // Parse tags
    const tags = (row['tags'] ?? '').split('|').map(t => t.trim()).filter(Boolean)

    const questionData = {
      questionText: row['questiontext'] ?? '',
      questionTextZh: row['questiontextzh'] || undefined,
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      explanation: row['explanation'] ?? '',
      explanationZh: row['explanationzh'] || undefined,
      domain: row['domain'] ?? '',
      difficulty: row['difficulty'] ?? '',
      tags,
    }

    const result = QuestionSchema.safeParse(questionData)
    if (result.success) {
      rows.push({ data: result.data, valid: true, sourceIndex: i - 1 })
    } else {
      const msgs = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      rows.push({ data: questionData as any, valid: false, error: msgs, sourceIndex: i - 1 })
    }
  }

  const errors = rows.filter(r => !r.valid).length
  return { data: rows, total: rows.length, errors }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export async function importQuestions(rows: ParsedRow[]) {
  try {
    let imported = 0
    let errors = 0

    for (const row of rows) {
      if (!row.valid) {
        errors++
        continue
      }
      try {
        await prisma.question.create({ data: row.data })
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
      return JSON.stringify({ total_questions: questions.length, questions }, null, 2)
    }

    // CSV format
    const headers = 'questionText,questionTextZh,optionA,optionB,optionC,optionD,optionAZh,optionBZh,optionCZh,optionDZh,correctAnswer,explanation,explanationZh,domain,difficulty,tags'
    const letterFromIndex = (i: number) => String.fromCharCode(65 + i)

    const rows = questions.map(q => {
      const opts = q.options
      const optsZh = q.optionsZh ?? []
      const correctLetter = letterFromIndex(q.correctAnswer)
      const tagsStr = (q.tags ?? []).join('|')

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
