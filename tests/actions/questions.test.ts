import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestions,
  checkDuplicateQuestions,
  importQuestionBatch,
  exportQuestions,
} from '@/lib/actions/questions'
import { parseJSON, parseCSV } from '@/lib/import-parser'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'
import { Domain, Difficulty } from '@prisma/client'

describe('Questions Actions', () => {
  const mockQuestion = {
    id: 'test-id-1',
    questionText: 'What is the first canon of (ISC)² Code of Ethics?',
    questionTextZh: '(ISC)² 职业道德守则的第一条准则是什么？',
    options: ['Act honorably, honestly, justly', 'Protect society, the common good', 'Provide diligent service', 'Advance the profession'],
    optionsZh: ['正当地、诚实、公正地行动', '保护社会、公共利益', '提供勤勉的服务', '推进职业发展'],
    correctAnswer: 1,
    explanation: 'The first canon emphasizes protecting society.',
    explanationZh: '第一条准则强调保护社会。',
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ['ethics', 'isc2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const validInput = {
    questionText: 'What is X?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Because...',
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ['test'],
  }

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  // ---- getQuestions ----

  describe('getQuestions', () => {
    it('should return paginated results with filters', async () => {
      mockPrisma.question.count.mockResolvedValue(1)
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion])

      const result = await getQuestions({
        search: 'canon',
        domain: Domain.SECURITY_RISK_MANAGEMENT,
        page: 1,
        pageSize: 20,
      })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
    })

    it('should return empty list when no matches', async () => {
      mockPrisma.question.count.mockResolvedValue(0)
      mockPrisma.question.findMany.mockResolvedValue([])

      const result = await getQuestions({ page: 1, pageSize: 20 })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should handle database error', async () => {
      mockPrisma.question.count.mockRejectedValue(new Error('Database connection failed'))

      const result = await getQuestions({ page: 1, pageSize: 20 })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })
  })

  // ---- getQuestionById ----

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion)

      const result = await getQuestionById('test-id-1')

      expect(mockPrisma.question.findUnique).toHaveBeenCalledWith({ where: { id: 'test-id-1' } })
      expect(result?.questionText).toBe('What is the first canon of (ISC)² Code of Ethics?')
    })

    it('should return null for non-existent id', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null)

      const result = await getQuestionById('non-existent')

      expect(result).toBeNull()
    })

    it('should handle database error', async () => {
      mockPrisma.question.findUnique.mockRejectedValue(new Error('DB error'))

      const result = await getQuestionById('test-id')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('DB error')
    })
  })

  // ---- createQuestion ----

  describe('createQuestion', () => {
    it('should create question with valid data', async () => {
      mockPrisma.question.create.mockResolvedValue({ ...mockQuestion, ...validInput })

      const result = await createQuestion(validInput)

      expect(mockPrisma.question.create).toHaveBeenCalledWith({ data: { ...validInput, questionImages: [] } })
      expect(result.questionText).toBe('What is X?')
    })

    it('should create question with optional Zh fields', async () => {
      const inputWithZh = {
        ...validInput,
        questionTextZh: 'X是什么？',
        explanationZh: '因为...',
      }
      mockPrisma.question.create.mockResolvedValue({ ...mockQuestion, ...inputWithZh })

      const result = await createQuestion(inputWithZh)

      expect(result.questionTextZh).toBe('X是什么？')
    })

    it('should return validation error for empty questionText', async () => {
      const result = await createQuestion({ ...validInput, questionText: '' })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
    })

    it('should return validation error for invalid domain', async () => {
      const result = await createQuestion({ ...validInput, domain: 'INVALID' as any })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('domain')
    })

    it('should return validation error for correctAnswer out of range', async () => {
      const result = await createQuestion({ ...validInput, correctAnswer: 99 })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('correctAnswer')
    })

    it('should return validation error for options fewer than 2', async () => {
      const result = await createQuestion({ ...validInput, options: ['Only one'] })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('options')
    })

    it('should handle database error', async () => {
      mockPrisma.question.create.mockRejectedValue(new Error('DB write failed'))

      const result = await createQuestion(validInput)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('DB write failed')
    })
  })

  // ---- updateQuestion ----

  describe('updateQuestion', () => {
    it('should update question with valid data', async () => {
      const updated = { ...mockQuestion, questionText: 'Updated question' }
      mockPrisma.question.update.mockResolvedValue(updated)

      const result = await updateQuestion('test-id-1', { ...validInput, questionText: 'Updated question' })

      expect(result.questionText).toBe('Updated question')
    })

    it('should return error for non-existent id', async () => {
      mockPrisma.question.update.mockRejectedValue(new Error('Record not found'))

      const result = await updateQuestion('non-existent', validInput)

      expect(result).toHaveProperty('error')
    })

    it('should return validation error for invalid data', async () => {
      const result = await updateQuestion('test-id-1', { ...validInput, questionText: '' })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
    })
  })

  // ---- deleteQuestion ----

  describe('deleteQuestion', () => {
    it('should delete successfully', async () => {
      mockPrisma.question.delete.mockResolvedValue(mockQuestion)

      const result = await deleteQuestion('test-id-1')

      expect(result).toEqual({ success: true })
    })

    it('should return error for non-existent id', async () => {
      mockPrisma.question.delete.mockRejectedValue(new Error('Record not found'))

      const result = await deleteQuestion('non-existent')

      expect(result).toHaveProperty('error')
    })
  })

  // ---- deleteQuestions (batch) ----

  describe('deleteQuestions', () => {
    it('should delete multiple by ids', async () => {
      mockPrisma.question.deleteMany.mockResolvedValue({ count: 3 })

      const result = await deleteQuestions(['id1', 'id2', 'id3'])

      expect(result).toEqual({ deleted: 3 })
    })

    it('should handle empty ids array', async () => {
      mockPrisma.question.deleteMany.mockResolvedValue({ count: 0 })

      const result = await deleteQuestions([])

      expect(result).toEqual({ deleted: 0 })
    })

    it('should handle database error', async () => {
      mockPrisma.question.deleteMany.mockRejectedValue(new Error('DB error'))

      const result = await deleteQuestions(['id1'])

      expect(result).toHaveProperty('error')
    })
  })

  // ---- checkDuplicateQuestions ----

  describe('checkDuplicateQuestions', () => {
    it('should return texts that already exist (en + zh)', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        { questionText: 'What is X?', questionTextZh: 'X是什么？', explanation: 'Because...', explanationZh: '因为...' },
      ])

      const result = await checkDuplicateQuestions(['What is X?', 'What is Y?'], ['X是什么？', 'Y是什么？'], ['Because...'], ['因为...'])

      expect(result.en).toEqual(['What is X?'])
      expect(result.zh).toEqual(['X是什么？'])
      expect(result.expEn).toEqual(['Because...'])
      expect(result.expZh).toEqual(['因为...'])
    })

    it('should return empty arrays when no duplicates', async () => {
      mockPrisma.question.findMany.mockResolvedValue([])

      const result = await checkDuplicateQuestions(['What is X?'], ['X是什么？'], ['Because...'], ['因为...'])

      expect(result.en).toEqual([])
      expect(result.zh).toEqual([])
      expect(result.expEn).toEqual([])
      expect(result.expZh).toEqual([])
    })

    it('should return empty arrays for empty input', async () => {
      const result = await checkDuplicateQuestions([], [], [], [])

      expect(result.en).toEqual([])
      expect(result.zh).toEqual([])
      expect(result.expEn).toEqual([])
      expect(result.expZh).toEqual([])
    })

    it('should filter out null zh fields', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        { questionText: 'Q1', questionTextZh: null, explanation: 'E1', explanationZh: null },
      ])

      const result = await checkDuplicateQuestions(['Q1'], [], ['E1'], [])

      expect(result.en).toEqual(['Q1'])
      expect(result.zh).toEqual([])
      expect(result.expEn).toEqual(['E1'])
      expect(result.expZh).toEqual([])
    })

    it('should handle database error', async () => {
      mockPrisma.question.findMany.mockRejectedValue(new Error('DB error'))

      const result = await checkDuplicateQuestions(['What is X?'], [], [], [])

      expect(result).toHaveProperty('error')
    })
  })

  // ---- importQuestionBatch ----

  describe('importQuestionBatch', () => {
    it('should import all valid questions in batch', async () => {
      mockPrisma.question.create.mockResolvedValue(mockQuestion)

      const rows = [validInput, { ...validInput, questionText: 'Q2' }]

      const result = await importQuestionBatch(rows)

      expect(result.imported).toBe(2)
      expect(result.errors).toBe(0)
      expect(mockPrisma.question.create).toHaveBeenCalledTimes(2)
    })

    it('should skip rows that fail validation', async () => {
      mockPrisma.question.create.mockResolvedValue(mockQuestion)

      const rows = [
        validInput,
        { ...validInput, questionText: '', explanation: '', questionTextZh: '', explanationZh: '' },
      ]

      const result = await importQuestionBatch(rows)

      expect(result.imported).toBe(1)
      expect(result.errors).toBe(1)
    })

    it('should accept Chinese-only questions in batch', async () => {
      mockPrisma.question.create.mockResolvedValue(mockQuestion)

      const zhOnly = {
        questionText: '',
        questionTextZh: '什么是X？',
        options: ['选项A', '选项B'],
        correctAnswer: 0,
        explanation: '',
        explanationZh: '因为...',
        domain: Domain.SECURITY_RISK_MANAGEMENT,
        difficulty: Difficulty.EASY,
      }

      const result = await importQuestionBatch([zhOnly])

      expect(result.imported).toBe(1)
      expect(result.errors).toBe(0)
    })

    it('should handle partial database failure', async () => {
      mockPrisma.question.create
        .mockResolvedValueOnce(mockQuestion)
        .mockRejectedValueOnce(new Error('Unique constraint'))

      const rows = [validInput, { ...validInput, questionText: 'Q2' }]

      const result = await importQuestionBatch(rows)

      expect(result.imported).toBe(1)
      expect(result.errors).toBe(1)
    })

    it('should handle empty batch', async () => {
      const result = await importQuestionBatch([])

      expect(result.imported).toBe(0)
      expect(result.errors).toBe(0)
    })

    it('should handle database error', async () => {
      mockPrisma.question.create.mockRejectedValue(new Error('DB down'))

      const result = await importQuestionBatch([validInput])

      expect(result.imported).toBe(0)
      expect(result.errors).toBe(1)
    })
  })

  // ---- exportQuestions ----

  describe('exportQuestions', () => {
    it('should export as JSON string', async () => {
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion])

      const result = await exportQuestions({ page: 1, pageSize: 20 }, 'json') as string

      const parsed = JSON.parse(result)
      expect(parsed.total_questions).toBe(1)
      expect(parsed.questions[0].questionText).toBe('What is the first canon of (ISC)² Code of Ethics?')
    })

    it('should export as CSV string', async () => {
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion])

      const result = await exportQuestions({ page: 1, pageSize: 20 }, 'csv') as string

      expect(result).toContain('questionText')
      expect(result).toContain('correctAnswer')
      expect(result).toContain(',B,')
    })

    it('should handle empty result set', async () => {
      mockPrisma.question.findMany.mockResolvedValue([])

      const jsonResult = await exportQuestions({ page: 1, pageSize: 20 }, 'json') as string
      const parsed = JSON.parse(jsonResult)
      expect(parsed.total_questions).toBe(0)
      expect(parsed.questions).toHaveLength(0)
    })
  })
})

// ---- Import Parser (client-side, no mocks needed) ----

describe('Import Parser', () => {
  const validJSON = JSON.stringify({
    total_questions: 2,
    questions: [
      {
        question_id: 'q1',
        domain: 'SECURITY_RISK_MANAGEMENT',
        type: 'single_choice',
        questionText: 'What is X?',
        questionTextZh: 'X是什么？',
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        correctAnswer: 'C',
        explanation: 'Because...',
        difficulty: 'EASY',
        tags: ['tag1', 'tag2'],
      },
      {
        domain: 'ASSET_SECURITY',
        questionText: 'Another question?',
        options: { A: 'Yes', B: 'No' },
        correctAnswer: 'A',
        explanation: 'Explanation here',
        difficulty: 'MEDIUM',
      },
    ],
  })

  describe('parseJSON', () => {
    it('should parse valid JSON with questions array', () => {
      const result = parseJSON(validJSON)

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.errors).toBe(0)
    })

    it('should convert options object to array', () => {
      const result = parseJSON(validJSON)

      expect(result.data[0].data.options).toEqual(['Option A', 'Option B', 'Option C', 'Option D'])
    })

    it('should convert correctAnswer letter to index', () => {
      const result = parseJSON(validJSON)

      expect(result.data[0].data.correctAnswer).toBe(2) // C → 2
      expect(result.data[1].data.correctAnswer).toBe(0) // A → 0
    })

    it('should ignore unknown fields like question_id', () => {
      const result = parseJSON(validJSON)

      expect(result.data[0].valid).toBe(true)
    })

    it('should throw on invalid JSON', () => {
      expect(() => parseJSON('not valid json{{{')).toThrow()
    })

    it('should flag invalid rows while keeping valid ones', () => {
      const mixedJSON = JSON.stringify({
        questions: [
          {
            questionText: 'Valid question',
            options: { A: 'Yes', B: 'No' },
            correctAnswer: 'A',
            explanation: 'Ok',
            domain: 'SECURITY_RISK_MANAGEMENT',
            difficulty: 'EASY',
          },
          {
            questionText: '',
            options: {},
            correctAnswer: 'Z',
            explanation: '',
            domain: 'INVALID',
            difficulty: 'INVALID',
          },
        ],
      })

      const result = parseJSON(mixedJSON)

      expect(result.data).toHaveLength(2)
      expect(result.data[0].valid).toBe(true)
      expect(result.data[1].valid).toBe(false)
      expect(result.errors).toBe(1)
    })

    it('should handle optional Zh fields', () => {
      const result = parseJSON(validJSON)

      expect(result.data[0].data.questionTextZh).toBe('X是什么？')
      expect(result.data[1].valid).toBe(true)
    })

    it('should count images from question_images', () => {
      const jsonWithImages = JSON.stringify({
        questions: [
          {
            questionText: 'Q with image',
            options: { A: 'A', B: 'B' },
            correctAnswer: 'A',
            explanation: 'ok',
            domain: 'SECURITY_RISK_MANAGEMENT',
            difficulty: 'EASY',
            question_images: ['img1', 'img2'],
          },
        ],
      })

      const result = parseJSON(jsonWithImages)

      expect(result.data[0].data.questionImages).toHaveLength(2)
    })

    it('should handle empty questions array', () => {
      const result = parseJSON('{"questions": []}')

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('parseCSV', () => {
    it('should parse valid CSV with headers', () => {
      const csv = `questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,domain,difficulty,tags
"What is X?","A","B","C","D",C,"Because...",SECURITY_RISK_MANAGEMENT,EASY,"tag1|tag2"`

      const result = parseCSV(csv)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].data.options).toEqual(['A', 'B', 'C', 'D'])
      expect(result.data[0].data.correctAnswer).toBe(2)
    })

    it('should return empty for CSV with only headers', () => {
      const csv = 'questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,domain,difficulty,tags'

      const result = parseCSV(csv)

      expect(result.data).toHaveLength(0)
    })

    it('should flag invalid CSV rows', () => {
      const csv = `questionText,optionA,optionB,correctAnswer,explanation,domain,difficulty
"Valid","A","B",A,"Ok",SECURITY_RISK_MANAGEMENT,EASY
"","","",A,"",INVALID,INVALID`

      const result = parseCSV(csv)

      expect(result.data).toHaveLength(2)
      expect(result.data[0].valid).toBe(true)
      expect(result.data[1].valid).toBe(false)
      expect(result.errors).toBe(1)
    })

    it('should accept Chinese-only questions (no English fields)', () => {
      const zhOnlyJSON = JSON.stringify({
        questions: [
          {
            questionTextZh: '什么是X？',
            options: { A: '选项A', B: '选项B', C: '选项C', D: '选项D' },
            correctAnswer: 'C',
            explanationZh: '因为...',
            domain: 'SECURITY_RISK_MANAGEMENT',
            difficulty: 'EASY',
          },
        ],
      })

      const result = parseJSON(zhOnlyJSON)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].valid).toBe(true)
      expect(result.errors).toBe(0)
    })

    it('should accept English-only questions (no Chinese fields)', () => {
      const enOnlyJSON = JSON.stringify({
        questions: [
          {
            questionText: 'What is X?',
            options: { A: 'A', B: 'B' },
            correctAnswer: 'A',
            explanation: 'Because...',
            domain: 'ASSET_SECURITY',
            difficulty: 'MEDIUM',
          },
        ],
      })

      const result = parseJSON(enOnlyJSON)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].valid).toBe(true)
      expect(result.errors).toBe(0)
    })

    it('should reject questions with neither EN nor ZH question+explanation', () => {
      const noLangJSON = JSON.stringify({
        questions: [
          {
            options: { A: 'A', B: 'B' },
            correctAnswer: 'A',
            domain: 'SECURITY_RISK_MANAGEMENT',
            difficulty: 'EASY',
          },
        ],
      })

      const result = parseJSON(noLangJSON)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].valid).toBe(false)
      expect(result.errors).toBe(1)
    })

    it('should reject question with only questionText but no explanation in either language', () => {
      const partialJSON = JSON.stringify({
        questions: [
          {
            questionText: 'Only question, no explanation',
            options: { A: 'A', B: 'B' },
            correctAnswer: 'A',
            domain: 'SECURITY_RISK_MANAGEMENT',
            difficulty: 'EASY',
          },
        ],
      })

      const result = parseJSON(partialJSON)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].valid).toBe(false)
      expect(result.errors).toBe(1)
    })
  })
})
