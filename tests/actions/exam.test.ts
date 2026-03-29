import { startExam, submitExam } from '@/lib/actions/exam'
import { prisma } from '@/lib/prisma'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'

describe('Exam Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('startExam', () => {
    it('should start a new exam and return questions', async () => {
      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'What is the primary goal of security?',
          questionTextZh: null,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Test explanation',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null
      }

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAttempt.create.mockResolvedValue(mockAttempt)

      const result = await startExam()

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        take: 150
      })
      expect(mockPrisma.examAttempt.create).toHaveBeenCalledWith({
        data: {
          startedAt: expect.any(Date)
        }
      })
      expect(result).toHaveProperty('attemptId', 'attempt-1')
      expect(result).toHaveProperty('questions')
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0].id).toBe('question-1')
    })

    it('should shuffle questions', async () => {
      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 1',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        },
        {
          id: 'question-2',
          questionText: 'Question 2',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '1',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 2',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null
      }

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAttempt.create.mockResolvedValue(mockAttempt)

      const result = await startExam()

      expect(result.questions).toHaveLength(2)
    })

    it('should limit questions to 150', async () => {
      const mockQuestions = Array.from({ length: 150 }, (_, i) => ({
        id: `question-${i}`,
        questionText: `Question ${i}`,
        questionTextZh: null,
        options: ['A', 'B', 'C', 'D'],
        optionsZh: [],
        correctAnswer: '0',
        questionType: 'SINGLE_CHOICE',
        matchItems: [],
        matchItemsZh: [],
        explanation: `Explanation ${i}`,
        explanationZh: null,
        domain: 'SECURITY_RISK_MANAGEMENT'
      }))

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null
      }

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAttempt.create.mockResolvedValue(mockAttempt)

      const result = await startExam()

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        take: 150
      })
      expect(result.questions).toHaveLength(150)
    })

    it('should return error on database failure', async () => {
      mockPrisma.question.findMany.mockRejectedValue(new Error('Database connection failed'))

      const result = await startExam()

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('submitExam', () => {
    it('should submit exam answers and calculate score', async () => {
      const answers = new Map([
        ['question-1', '0'], // Correct
        ['question-2', '2']  // Incorrect
      ])

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 1',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        },
        {
          id: 'question-2',
          questionText: 'Question 2',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '1',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 2',
          explanationZh: null,
          domain: 'ASSET_SECURITY'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 2 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)
      mockPrisma.examAttempt.update.mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        score: 50,
        timeSpent: 3600
      })

      const result = await submitExam('attempt-1', answers)

      expect(mockPrisma.examAttempt.findUnique).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        include: { answers: true }
      })
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['question-1', 'question-2'] } }
      })
      expect(mockPrisma.examAnswer.createMany).toHaveBeenCalledWith({
        data: [
          {
            attemptId: 'attempt-1',
            questionId: 'question-1',
            selectedAnswer: '0',
            isCorrect: true
          },
          {
            attemptId: 'attempt-1',
            questionId: 'question-2',
            selectedAnswer: '2',
            isCorrect: false
          }
        ]
      })
      expect(mockPrisma.examAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: {
          completedAt: expect.any(Date),
          score: 50,
          timeSpent: expect.any(Number)
        }
      })
      expect(result).toEqual({
        score: 50,
        passed: false,
        correctCount: 1,
        totalQuestions: 2,
        timeSpent: expect.any(Number)
      })
    })

    it('should update progress for each domain', async () => {
      const answers = new Map([
        ['question-1', '0'] // Correct
      ])

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 1',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)
      mockPrisma.examAttempt.update.mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        score: 100,
        timeSpent: 60
      })

      await submitExam('attempt-1', answers)

      expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
        where: { domain: 'SECURITY_RISK_MANAGEMENT' },
        update: {
          examQuestionsAnswered: { increment: 1 },
          examCorrectCount: { increment: 1 },
          lastStudied: expect.any(Date)
        },
        create: {
          domain: 'SECURITY_RISK_MANAGEMENT',
          quizQuestionsAnswered: 0,
          examQuestionsAnswered: 1,
          quizCorrectCount: 0,
          examCorrectCount: 1,
          lastStudied: expect.any(Date)
        }
      })
    })

    it('should not increment examCorrectCount for incorrect answers', async () => {
      const answers = new Map([
        ['question-1', '1'] // Incorrect (correct is '0')
      ])

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 1',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)
      mockPrisma.examAttempt.update.mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        score: 0,
        timeSpent: 60
      })

      await submitExam('attempt-1', answers)

      expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
        where: { domain: 'SECURITY_RISK_MANAGEMENT' },
        update: {
          examQuestionsAnswered: { increment: 1 },
          examCorrectCount: undefined, // Not incremented for incorrect answers
          lastStudied: expect.any(Date)
        },
        create: {
          domain: 'SECURITY_RISK_MANAGEMENT',
          quizQuestionsAnswered: 0,
          examQuestionsAnswered: 1,
          quizCorrectCount: 0,
          examCorrectCount: 0, // 0 for incorrect
          lastStudied: expect.any(Date)
        }
      })
    })

    it('should return error for non-existent attempt', async () => {
      mockPrisma.examAttempt.findUnique.mockResolvedValue(null)

      const answers = new Map([['question-1', '0']])

      const result = await submitExam('non-existent-attempt', answers)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Exam attempt not found')
    })

    it('should return error on database failure', async () => {
      mockPrisma.examAttempt.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const answers = new Map([['question-1', '0']])

      const result = await submitExam('attempt-1', answers)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })

    it('should calculate time spent correctly', async () => {
      const answers = new Map([['question-1', '0']])

      const startTime = new Date(Date.now() - 7265000) // 2 hours, 1 minute, 5 seconds ago
      const mockAttempt = {
        id: 'attempt-1',
        startedAt: startTime,
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Question 1',
          questionTextZh: null,
          options: ['A', 'B', 'C', 'D'],
          optionsZh: [],
          correctAnswer: '0',
          questionType: 'SINGLE_CHOICE',
          matchItems: [],
          matchItemsZh: [],
          explanation: 'Explanation 1',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)

      let capturedUpdateData: any
      mockPrisma.examAttempt.update.mockImplementation(async ({ data }: any) => {
        capturedUpdateData = data
        return {
          ...mockAttempt,
          completedAt: data.completedAt,
          score: data.score,
          timeSpent: data.timeSpent
        }
      })

      const result = await submitExam('attempt-1', answers)

      expect(result.timeSpent).toBe(7265) // 7265 seconds
      expect(capturedUpdateData.timeSpent).toBe(7265)
    })

    it('should correctly grade matching questions', async () => {
      const answers = new Map([
        ['question-1', '[0,2,3,1]'] // Correct matching answer
      ])

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Match the following:',
          questionTextZh: null,
          options: ['Description A', 'Description B', 'Description C', 'Description D'],
          optionsZh: [],
          correctAnswer: '[0,2,3,1]',
          questionType: 'MATCHING',
          matchItems: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
          matchItemsZh: [],
          explanation: 'All items matched correctly',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)
      mockPrisma.examAttempt.update.mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        score: 100,
        timeSpent: 60
      })

      const result = await submitExam('attempt-1', answers)

      expect(result.correctCount).toBe(1)
      expect(result.score).toBe(100)
    })

    it('should mark incorrect matching answer as wrong', async () => {
      const answers = new Map([
        ['question-1', '[0,2,3,0]'] // Wrong - last item incorrect
      ])

      const mockAttempt = {
        id: 'attempt-1',
        startedAt: new Date(),
        completedAt: null,
        score: null,
        timeSpent: null,
        answers: []
      }

      const mockQuestions = [
        {
          id: 'question-1',
          questionText: 'Match the following:',
          questionTextZh: null,
          options: ['Description A', 'Description B', 'Description C', 'Description D'],
          optionsZh: [],
          correctAnswer: '[0,2,3,1]',
          questionType: 'MATCHING',
          matchItems: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
          matchItemsZh: [],
          explanation: 'All items matched correctly',
          explanationZh: null,
          domain: 'SECURITY_RISK_MANAGEMENT'
        }
      ]

      mockPrisma.examAttempt.findUnique.mockResolvedValue(mockAttempt)
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions)
      mockPrisma.examAnswer.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.progress.upsert.mockResolvedValue(mockQuestions[0] as any)
      mockPrisma.examAttempt.update.mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        score: 0,
        timeSpent: 60
      })

      const result = await submitExam('attempt-1', answers)

      expect(result.correctCount).toBe(0)
      expect(result.score).toBe(0)
    })
  })
})
