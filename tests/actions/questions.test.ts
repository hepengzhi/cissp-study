import { getQuestions } from '@/lib/actions/questions'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'
import { Domain, Difficulty } from '@prisma/client'

describe('Questions Actions - getQuestions', () => {
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
    updatedAt: new Date()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('getQuestions', () => {
    it('should return paginated results with filters', async () => {
      const mockQuestions = [mockQuestion]

      mockPrisma.question.count.mockResolvedValue(1)
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion])

      const result = await getQuestions({
        search: 'canon',
        domain: Domain.SECURITY_RISK_MANAGEMENT,
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.question.count).toHaveBeenCalledWith({
        where: {
          questionText: { contains: 'canon', mode: 'insensitive' },
          domain: Domain.SECURITY_RISK_MANAGEMENT
        }
      })
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          questionText: { contains: 'canon', mode: 'insensitive' },
          domain: Domain.SECURITY_RISK_MANAGEMENT
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].questionText).toBe('What is the first canon of (ISC)² Code of Ethics?')
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should return empty list when no matches', async () => {
      mockPrisma.question.count.mockResolvedValue(0)
      mockPrisma.question.findMany.mockResolvedValue([])

      const result = await getQuestions({
        page: 1,
        pageSize: 20
      })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should return all questions without filters', async () => {
      const mockQuestions = [
        { ...mockQuestion, id: 'test-id-1' },
        { ...mockQuestion, id: 'test-id-2', domain: Domain.ASSET_SECURITY }
      ]

      mockPrisma.question.count.mockResolvedValue(2)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)

      const result = await getQuestions({ page: 1, pageSize: 20 })

      expect(mockPrisma.question.count).toHaveBeenCalledWith({ where: {} })
      expect(result.data).toHaveLength(2)
    })

    it('should handle database error', async () => {
      mockPrisma.question.count.mockRejectedValue(new Error('Database connection failed'))

      const result = await getQuestions({ page: 1, pageSize: 20 })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })

    it('should apply difficulty filter', async () => {
      mockPrisma.question.count.mockResolvedValue(1)
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion])

      const result = await getQuestions({
        difficulty: Difficulty.HARD,
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.question.count).toHaveBeenCalledWith({
        where: { difficulty: Difficulty.HARD }
      })
    })

    it('should calculate pagination correctly', async () => {
      const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
        ...mockQuestion,
        id: `test-id-${i + 1}`
      }))

      mockPrisma.question.count.mockResolvedValue(25)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)

      const result = await getQuestions({ page: 2, pageSize: 10 })

      expect(result.data).toHaveLength(10)
      expect(result.page).toBe(2)
    })
  })
})
