import { z } from 'zod'
import { Domain, Difficulty, QuestionType } from '@prisma/client'

// Regex to extract match items with brackets: "1.GLBA []2.PCI DSSS []"
const MATCH_ITEM_REGEX_WITH_BRACKETS = /(\d+)\.\s*([^[\]]+?)\s*\[\]/g
// Regex for format without brackets: "1.检查时间 2.隐蔽通道 3.使用时间"
const MATCH_ITEM_REGEX_NO_BRACKETS = /(\d+)\.\s*([^\d]+?)(?=\s*\d+\.|$)/g

export const QuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionTextZh: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  questionType: z.nativeEnum(QuestionType).default('SINGLE_CHOICE'),
  matchItems: z.array(z.string()).default([]),
  matchItemsZh: z.array(z.string()).default([]),
  explanation: z.string().min(1, 'Explanation is required'),
  explanationZh: z.string().optional(),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  questionImages: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.questionType === 'MATCHING') {
    try {
      const answers = JSON.parse(data.correctAnswer) as number[]
      // Must have same number of items and answers
      if (answers.length !== data.matchItems.length) return false
      // All indices must be valid
      return answers.every(idx => idx >= 0 && idx < data.options.length)
    } catch {
      return false
    }
  }
  // Single choice: must be a valid index string
  const idx = parseInt(data.correctAnswer, 10)
  return !isNaN(idx) && idx >= 0 && idx < data.options.length
}, {
  message: 'correctAnswer must be a valid index for SINGLE_CHOICE or a valid index array for MATCHING',
  path: ['correctAnswer'],
})

// Relaxed schema for import: EN or ZH question+explanation pair is enough
export const ImportQuestionSchema = z.object({
  questionText: z.string().default(''),
  questionTextZh: z.string().default(''),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  questionType: z.nativeEnum(QuestionType).default('SINGLE_CHOICE'),
  matchItems: z.array(z.string()).default([]),
  matchItemsZh: z.array(z.string()).default([]),
  explanation: z.string().default(''),
  explanationZh: z.string().default(''),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  questionImages: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.questionType === 'MATCHING') {
    try {
      const answers = JSON.parse(data.correctAnswer) as number[]
      if (answers.length !== data.matchItems.length) return false
      return answers.every(idx => idx >= 0 && idx < data.options.length)
    } catch {
      return false
    }
  }
  const idx = parseInt(data.correctAnswer, 10)
  return !isNaN(idx) && idx >= 0 && idx < data.options.length
}, {
  message: 'correctAnswer must be a valid index for SINGLE_CHOICE or a valid index array for MATCHING',
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

/**
 * Parse matching answer format "A,C,D,B" into index array "[0,2,3,1]"
 * Returns null if not a matching format
 */
function parseMatchingAnswer(answer: string, optionsCount: number): number[] | null {
  const trimmed = answer.trim()
  const parts = trimmed.split(',').map(s => s.trim())
  if (parts.length < 2) return null

  const result: number[] = []
  for (const part of parts) {
    if (part.length !== 1 || part < 'A' || part > 'F') return null
    const idx = part.charCodeAt(0) - 'A'.charCodeAt(0)
    if (idx >= optionsCount) return null
    result.push(idx)
  }

  return result
}

/**
 * Extract match items from questionText like "法律和行业标准1.GLBA []2.PCI DSSS []3.HIPAA []4.SOX []"
 * Also supports format without brackets: "1.检查时间 2.隐蔽通道 3.使用时间"
 * Returns { items: string[], cleanedText: string }
 */
function extractMatchItems(text: string): { items: string[]; cleanedText: string } {
  // First try format with brackets: "1.GLBA []2.PCI DSSS []"
  const matches: Array<{ num: number; text: string; start: number; end: number }> = []

  let match: RegExpExecArray | null
  const regex1 = new RegExp(MATCH_ITEM_REGEX_WITH_BRACKETS.source, 'g')
  while ((match = regex1.exec(text)) !== null) {
    const num = parseInt(match[1], 10)
    const itemText = match[2].trim()
    matches.push({ num, text: itemText, start: match.index, end: regex1.lastIndex })
  }

  // If no matches with brackets, try without brackets
  if (matches.length === 0) {
    const regex2 = new RegExp(MATCH_ITEM_REGEX_NO_BRACKETS.source, 'g')
    while ((match = regex2.exec(text)) !== null) {
      const num = parseInt(match[1], 10)
      const itemText = match[2].trim()
      if (itemText) {
        matches.push({ num, text: itemText, start: match.index, end: regex2.lastIndex })
      }
    }
  }

  if (matches.length === 0) {
    return { items: [], cleanedText: text }
  }

  // Sort by item number and extract in order
  matches.sort((a, b) => a.num - b.num)
  const items = matches.map(m => m.text)

  // Remove the matched portion from text (everything from first match to last match end)
  // But keep the prefix (question intro)
  const firstMatchStart = matches[0].start
  const cleanedText = text.substring(0, firstMatchStart).trim()

  return { items, cleanedText }
}

export function parseJSON(content: string): { data: ParsedRow[]; total: number; errors: number } {
  const raw = JSON.parse(content)
  const questions = raw.questions ?? []
  const rows: ParsedRow[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    let options: string[] = []
    let optionsZh: string[] = []
    let correctAnswer = ''
    let questionType: QuestionType = 'SINGLE_CHOICE'
    let matchItems: string[] = []
    let matchItemsZh: string[] = []
    let questionTextZh = q.questionTextZh || ''

    // Parse options
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const keys = Object.keys(q.options).sort()
      options = keys.map(k => q.options[k])
    } else if (Array.isArray(q.options)) {
      options = q.options
    }

    // Parse optionsZh if present
    if (q.optionsZh && typeof q.optionsZh === 'object' && !Array.isArray(q.optionsZh)) {
      const keys = Object.keys(q.optionsZh).sort()
      optionsZh = keys.map(k => q.optionsZh[k])
    } else if (Array.isArray(q.optionsZh)) {
      optionsZh = q.optionsZh
    }

    // Detect question type and parse correctAnswer
    const rawAnswer = q.correctAnswer
    if (typeof rawAnswer === 'string') {
      const matchingResult = parseMatchingAnswer(rawAnswer, options.length)
      if (matchingResult) {
        // It's a matching question
        questionType = 'MATCHING'
        correctAnswer = JSON.stringify(matchingResult)

        // Extract match items from questionTextZh
        const extracted = extractMatchItems(questionTextZh)
        if (extracted.items.length === matchingResult.length) {
          matchItems = extracted.items
          questionTextZh = extracted.cleanedText
        }
      } else if (rawAnswer.length === 1 && rawAnswer >= 'A' && rawAnswer <= 'F') {
        // Single letter - convert to index string
        correctAnswer = String(rawAnswer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0))
      } else {
        // Assume it's already an index string or number string
        correctAnswer = rawAnswer
      }
    } else if (typeof rawAnswer === 'number') {
      // Number - convert to string
      correctAnswer = String(rawAnswer)
    }

    const questionData = {
      questionText: q.questionText ?? '',
      questionTextZh,
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      questionType,
      matchItems,
      matchItemsZh,
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

    let correctAnswer = ''
    let questionType: QuestionType = 'SINGLE_CHOICE'
    let matchItems: string[] = []
    let questionTextZh = row['questiontextzh'] || ''

    const answerStr = (row['correctanswer'] ?? '').trim()

    // Check for matching format
    const matchingResult = parseMatchingAnswer(answerStr, options.length)
    if (matchingResult) {
      questionType = 'MATCHING'
      correctAnswer = JSON.stringify(matchingResult)

      // Extract match items from questionTextZh
      const extracted = extractMatchItems(questionTextZh)
      if (extracted.items.length === matchingResult.length) {
        matchItems = extracted.items
        questionTextZh = extracted.cleanedText
      }
    } else if (answerStr.length === 1 && answerStr.toUpperCase() >= 'A' && answerStr.toUpperCase() <= 'F') {
      // Single letter
      correctAnswer = String(answerStr.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0))
    } else {
      correctAnswer = answerStr
    }

    // Parse matchItems column if present (for explicit match items in CSV)
    const matchItemsStr = row['matchitems'] ?? ''
    if (matchItemsStr && matchItems.length === 0) {
      matchItems = matchItemsStr.split('|').map(s => s.trim()).filter(Boolean)
    }

    const tags = (row['tags'] ?? '').split('|').map(t => t.trim()).filter(Boolean)

    const questionData = {
      questionText: row['questiontext'] ?? '',
      questionTextZh,
      options,
      optionsZh: optionsZh.length > 0 ? optionsZh : undefined,
      correctAnswer,
      questionType,
      matchItems,
      matchItemsZh: [],
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
