import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestions,
  parseImportFile,
  importQuestions,
  exportQuestions,
  type ParsedRow,
} from '@/lib/actions/questions'
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

  // ---- parseImportFile ----

  describe('parseImportFile', () => {
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

    it('should parse valid JSON with total_questions', async () => {
      const result = await parseImportFile(validJSON, 'json')

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.errors).toBe(0)
    })

    it('should convert options object to array', async () => {
      const result = await parseImportFile(validJSON, 'json')

      expect(result.data[0].data.options).toEqual(['Option A', 'Option B', 'Option C', 'Option D'])
    })

    it('should convert correctAnswer letter to index', async () => {
      const result = await parseImportFile(validJSON, 'json')

      expect(result.data[0].data.correctAnswer).toBe(2) // C → 2
      expect(result.data[1].data.correctAnswer).toBe(0) // A → 0
    })

    it('should ignore question_id and type fields', async () => {
      const result = await parseImportFile(validJSON, 'json')

      expect(result.data[0].valid).toBe(true)
      // No error about unknown fields
    })

    it('should return error for invalid JSON', async () => {
      const result = await parseImportFile('not valid json{{{', 'json')

      expect(result).toHaveProperty('error')
    })

    it('should parse valid CSV with headers', async () => {
      const csv = `questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,domain,difficulty,tags
"What is X?","A","B","C","D",C,"Because...",SECURITY_RISK_MANAGEMENT,EASY,"tag1|tag2"`

      const result = await parseImportFile(csv, 'csv')

      expect(result.data).toHaveLength(1)
      expect(result.data[0].data.options).toEqual(['A', 'B', 'C', 'D'])
      expect(result.data[0].data.correctAnswer).toBe(2) // C → 2
    })

    it('should flag invalid rows while keeping valid ones', async () => {
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

      const result = await parseImportFile(mixedJSON, 'json')

      expect(result.data).toHaveLength(2)
      expect(result.data[0].valid).toBe(true)
      expect(result.data[1].valid).toBe(false)
      expect(result.errors).toBe(1)
    })

    it('should handle optional Zh fields gracefully', async () => {
      const result = await parseImportFile(validJSON, 'json')

      expect(result.data[0].data.questionTextZh).toBe('X是什么？')
      // Second question has no questionTextZh — that's fine
      expect(result.data[1].valid).toBe(true)
    })
  })

  // ---- importQuestions ----

  describe('importQuestions', () => {
    it('should import all valid questions', async () => {
      mockPrisma.question.create.mockResolvedValue(mockQuestion)

      const rows: ParsedRow[] = [
        { data: validInput as any, valid: true, sourceIndex: 0 },
        { data: { ...validInput, questionText: 'Q2' } as any, valid: true, sourceIndex: 1 },
      ]

      const result = await importQuestions(rows)

      expect(result.imported).toBe(2)
      expect(result.errors).toBe(0)
      expect(mockPrisma.question.create).toHaveBeenCalledTimes(2)
    })

    it('should skip invalid rows', async () => {
      mockPrisma.question.create.mockResolvedValue(mockQuestion)

      const rows: ParsedRow[] = [
        { data: validInput as any, valid: true, sourceIndex: 0 },
        { data: {} as any, valid: false, error: 'Missing fields', sourceIndex: 1 },
      ]

      const result = await importQuestions(rows)

      expect(result.imported).toBe(1)
      expect(result.errors).toBe(1)
    })

    it('should handle partial database failure', async () => {
      mockPrisma.question.create
        .mockResolvedValueOnce(mockQuestion)
        .mockRejectedValueOnce(new Error('Unique constraint'))

      const rows: ParsedRow[] = [
        { data: validInput as any, valid: true, sourceIndex: 0 },
        { data: validInput as any, valid: true, sourceIndex: 1 },
      ]

      const result = await importQuestions(rows)

      expect(result.imported).toBe(1)
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
      // correctAnswer should be letter B (index 1)
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
