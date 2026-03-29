import { z } from 'zod'
import { Domain, Difficulty } from '@prisma/client'

export const QuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionTextZh: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().min(1, 'Explanation is required'),
  explanationZh: z.string().optional(),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  questionImages: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  return data.correctAnswer >= 0 && data.correctAnswer < data.options.length
}, {
  message: 'correctAnswer must be a valid index into options array',
  path: ['correctAnswer'],
})

// Relaxed schema for import: EN or ZH question+explanation pair is enough
export const ImportQuestionSchema = z.object({
  questionText: z.string().default(''),
  questionTextZh: z.string().default(''),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().default(''),
  explanationZh: z.string().default(''),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  questionImages: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  return data.correctAnswer >= 0 && data.correctAnswer < data.options.length
}, {
  message: 'correctAnswer must be a valid index into options array',
  path: ['correctAnswer'],
}).refine((data) => {
  const hasEn = data.questionText.trim().length > 0 && data.explanation.trim().length > 0
  const hasZh = data.questionTextZh.trim().length > 0 && data.explanationZh.trim().length > 0
  return hasEn || hasZh
}, {
  message: 'At least one language pair (questionText+explanation or questionTextZh+explanationZh) must be provided',
  path: ['questionText'],
})

export type QuestionInput = z.infer<typeof QuestionSchema>

export interface ParsedRow {
  data: QuestionInput | Record<string, unknown>
  valid: boolean
  duplicate?: boolean
  error?: string
  sourceIndex: number
}

export function parseJSON(content: string): { data: ParsedRow[]; total: number; errors: number } {
  const raw = JSON.parse(content)
  const questions = raw.questions ?? []
  const rows: ParsedRow[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    let options: string[] = []
    let optionsZh: string[] = []
    let correctAnswer = 0

    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const keys = Object.keys(q.options).sort()
      options = keys.map(k => q.options[k])
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
      questionTextZh: q.questionTextZh || '',
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      explanation: q.explanation ?? '',
      explanationZh: q.explanationZh || '',
      domain: q.domain ?? '',
      difficulty: q.difficulty ?? '',
      questionImages: q.question_images ?? [],
      tags: q.tags ?? [],
    }

    const result = ImportQuestionSchema.safeParse(questionData)
    if (result.success) {
      rows.push({ data: result.data, valid: true, sourceIndex: i })
    } else {
      const msgs = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      rows.push({ data: questionData, valid: false, error: msgs, sourceIndex: i })
    }
  }

  const errors = rows.filter(r => !r.valid).length
  return { data: rows, total: rows.length, errors }
}

export function parseCSV(content: string): { data: ParsedRow[]; total: number; errors: number } {
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

    let correctAnswer = 0
    const answerStr = (row['correctanswer'] ?? '').toUpperCase().trim()
    if (answerStr.length === 1 && answerStr >= 'A' && answerStr <= 'F') {
      correctAnswer = answerStr.charCodeAt(0) - 'A'.charCodeAt(0)
    }

    const tags = (row['tags'] ?? '').split('|').map(t => t.trim()).filter(Boolean)

    const questionData = {
      questionText: row['questiontext'] ?? '',
      questionTextZh: row['questiontextzh'] || '',
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      explanation: row['explanation'] ?? '',
      explanationZh: row['explanationzh'] || '',
      domain: row['domain'] ?? '',
      difficulty: row['difficulty'] ?? '',
      tags,
    }

    const result = ImportQuestionSchema.safeParse(questionData)
    if (result.success) {
      rows.push({ data: result.data, valid: true, sourceIndex: i - 1 })
    } else {
      const msgs = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      rows.push({ data: questionData, valid: false, error: msgs, sourceIndex: i - 1 })
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
