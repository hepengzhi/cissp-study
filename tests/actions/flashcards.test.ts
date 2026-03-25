import { createFlashcard, getDueCards, rateFlashcard, getAllFlashcards } from '@/lib/actions/flashcards'
import { SM2Quality } from '@/lib/spaced-repetition'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'

describe('Flashcards Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('createFlashcard', () => {
    it('should create a flashcard with SM-2 initialization', async () => {
      const now = new Date()
      const mockFlashcard = {
        id: 'test-id',
        front: 'What is CIA triad?',
        back: 'Confidentiality, Integrity, Availability',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now,
        updatedAt: now
      }

      mockPrisma.flashcard.create.mockResolvedValue(mockFlashcard)

      const card = await createFlashcard({
        front: 'What is CIA triad?',
        back: 'Confidentiality, Integrity, Availability',
        domain: 'SECURITY_RISK_MANAGEMENT'
      })

      expect(mockPrisma.flashcard.create).toHaveBeenCalledWith({
        data: {
          front: 'What is CIA triad?',
          back: 'Confidentiality, Integrity, Availability',
          domain: 'SECURITY_RISK_MANAGEMENT',
          nextReview: expect.any(Date),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0
        }
      })
      expect(card.front).toBe('What is CIA triad?')
      expect(card.back).toBe('Confidentiality, Integrity, Availability')
      expect(card.domain).toBe('SECURITY_RISK_MANAGEMENT')
      expect(card.interval).toBe(0)
      expect(card.easeFactor).toBe(2.5)
      expect(card.repetitions).toBe(0)
      expect(card.nextReview).toBeInstanceOf(Date)
    })

    it('should create a flashcard for different domains', async () => {
      const now = new Date()
      const mockFlashcard = {
        id: 'test-id',
        front: 'Test question',
        back: 'Test answer',
        domain: 'ASSET_SECURITY' as const,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now,
        updatedAt: now
      }

      mockPrisma.flashcard.create.mockResolvedValue(mockFlashcard)

      const card = await createFlashcard({
        front: 'Test question',
        back: 'Test answer',
        domain: 'ASSET_SECURITY'
      })

      expect(card.domain).toBe('ASSET_SECURITY')
    })

    it('should return validation error for empty front', async () => {
      const result = await createFlashcard({
        front: '', // Invalid: empty front
        back: 'Test answer',
        domain: 'SECURITY_RISK_MANAGEMENT'
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('front')
    })

    it('should return validation error for empty back', async () => {
      const result = await createFlashcard({
        front: 'Test question',
        back: '', // Invalid: empty back
        domain: 'SECURITY_RISK_MANAGEMENT'
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('back')
    })

    it('should return validation error for invalid domain', async () => {
      const result = await createFlashcard({
        front: 'Test question',
        back: 'Test answer',
        domain: 'INVALID_DOMAIN' as any
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('domain')
    })

    it('should return database error on failure', async () => {
      mockPrisma.flashcard.create.mockRejectedValue(new Error('Database connection failed'))

      const result = await createFlashcard({
        front: 'Test question',
        back: 'Test answer',
        domain: 'SECURITY_RISK_MANAGEMENT'
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('getDueCards', () => {
    it('should get due cards filtered by domain', async () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 86400000) // 1 day ago
      const futureDate = new Date(now.getTime() + 86400000) // 1 day in future

      const mockDueCards = [
        {
          id: '1',
          front: 'Question 1',
          back: 'Answer 1',
          domain: 'SECURITY_RISK_MANAGEMENT' as const,
          nextReview: pastDate,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        }
      ]

      mockPrisma.flashcard.findMany.mockResolvedValue(mockDueCards)

      const cards = await getDueCards('SECURITY_RISK_MANAGEMENT')

      expect(mockPrisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          nextReview: { lte: expect.any(Date) },
          domain: 'SECURITY_RISK_MANAGEMENT'
        },
        orderBy: { nextReview: 'asc' }
      })
      expect(cards).toHaveLength(1)
      expect(cards[0].domain).toBe('SECURITY_RISK_MANAGEMENT')
      expect(cards[0].nextReview.getTime()).toBeLessThanOrEqual(now.getTime())
    })

    it('should get all due cards without domain filter', async () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 86400000)

      const mockDueCards = [
        {
          id: '1',
          front: 'Question 1',
          back: 'Answer 1',
          domain: 'SECURITY_RISK_MANAGEMENT' as const,
          nextReview: pastDate,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: '2',
          front: 'Question 2',
          back: 'Answer 2',
          domain: 'ASSET_SECURITY' as const,
          nextReview: pastDate,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        }
      ]

      mockPrisma.flashcard.findMany.mockResolvedValue(mockDueCards)

      const cards = await getDueCards()

      expect(mockPrisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          nextReview: { lte: expect.any(Date) }
        },
        orderBy: { nextReview: 'asc' }
      })
      expect(cards).toHaveLength(2)
    })

    it('should return empty array when no cards are due', async () => {
      mockPrisma.flashcard.findMany.mockResolvedValue([])

      const cards = await getDueCards()

      expect(cards).toHaveLength(0)
      expect(cards).toEqual([])
    })

    it('should return error on database failure', async () => {
      mockPrisma.flashcard.findMany.mockRejectedValue(new Error('Database error'))

      const result = await getDueCards()

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database error')
    })
  })

  describe('rateFlashcard', () => {
    it('should rate a card with GOOD quality', async () => {
      const now = new Date()
      const existingCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: new Date(now.getTime() - 86400000),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now,
        updatedAt: now
      }

      const updatedCard = {
        ...existingCard,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        nextReview: new Date(now.getTime() + 86400000)
      }

      mockPrisma.flashcard.findUnique.mockResolvedValue(existingCard)
      mockPrisma.flashcard.update.mockResolvedValue(updatedCard)

      const result = await rateFlashcard('test-id', SM2Quality.GOOD)

      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          easeFactor: expect.any(Number),
          interval: expect.any(Number),
          repetitions: expect.any(Number),
          nextReview: expect.any(Date)
        }
      })
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
    })

    it('should rate a card with AGAIN quality (reset)', async () => {
      const now = new Date()
      const existingCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: new Date(now.getTime() - 86400000),
        interval: 5,
        easeFactor: 2.5,
        repetitions: 3,
        createdAt: now,
        updatedAt: now
      }

      const updatedCard = {
        ...existingCard,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: now
      }

      mockPrisma.flashcard.findUnique.mockResolvedValue(existingCard)
      mockPrisma.flashcard.update.mockResolvedValue(updatedCard)

      const result = await rateFlashcard('test-id', SM2Quality.AGAIN)

      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          easeFactor: expect.any(Number),
          interval: 0,
          repetitions: 0,
          nextReview: expect.any(Date)
        }
      })
      expect(result.interval).toBe(0)
      expect(result.repetitions).toBe(0)
    })

    it('should rate a card with HARD quality', async () => {
      const now = new Date()
      const existingCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: new Date(now.getTime() - 86400000),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        createdAt: now,
        updatedAt: now
      }

      const updatedCard = {
        ...existingCard,
        interval: 6,
        easeFactor: 2.36,
        repetitions: 2,
        nextReview: new Date(now.getTime() + 6 * 86400000)
      }

      mockPrisma.flashcard.findUnique.mockResolvedValue(existingCard)
      mockPrisma.flashcard.update.mockResolvedValue(updatedCard)

      const result = await rateFlashcard('test-id', SM2Quality.HARD)

      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          easeFactor: expect.any(Number),
          interval: expect.any(Number),
          repetitions: expect.any(Number),
          nextReview: expect.any(Date)
        }
      })
      expect(result.repetitions).toBe(2)
    })

    it('should rate a card with EASY quality', async () => {
      const now = new Date()
      const existingCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: new Date(now.getTime() - 86400000),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        createdAt: now,
        updatedAt: now
      }

      const updatedCard = {
        ...existingCard,
        interval: 6,
        easeFactor: 2.6,
        repetitions: 2,
        nextReview: new Date(now.getTime() + 6 * 86400000)
      }

      mockPrisma.flashcard.findUnique.mockResolvedValue(existingCard)
      mockPrisma.flashcard.update.mockResolvedValue(updatedCard)

      const result = await rateFlashcard('test-id', SM2Quality.EASY)

      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          easeFactor: expect.any(Number),
          interval: expect.any(Number),
          repetitions: expect.any(Number),
          nextReview: expect.any(Date)
        }
      })
      expect(result.easeFactor).toBeGreaterThan(2.5)
    })

    it('should return error for non-existent card', async () => {
      mockPrisma.flashcard.findUnique.mockResolvedValue(null)

      const result = await rateFlashcard('non-existent-id', SM2Quality.GOOD)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Flashcard not found')
      expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
    })

    it('should return validation error for invalid id', async () => {
      const result = await rateFlashcard('', SM2Quality.GOOD)

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('id')
    })

    it('should return validation error for invalid quality', async () => {
      const result = await rateFlashcard('test-id', 99 as SM2Quality)

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('quality')
    })

    it('should return database error on failure', async () => {
      const now = new Date()
      const existingCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        nextReview: new Date(now.getTime() - 86400000),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: now,
        updatedAt: now
      }

      mockPrisma.flashcard.findUnique.mockResolvedValue(existingCard)
      mockPrisma.flashcard.update.mockRejectedValue(new Error('Database update failed'))

      const result = await rateFlashcard('test-id', SM2Quality.GOOD)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database update failed')
    })
  })

  describe('getAllFlashcards', () => {
    it('should get all flashcards filtered by domain', async () => {
      const now = new Date()
      const mockFlashcards = [
        {
          id: '1',
          front: 'Question 1',
          back: 'Answer 1',
          domain: 'SECURITY_RISK_MANAGEMENT' as const,
          nextReview: new Date(),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        }
      ]

      mockPrisma.flashcard.findMany.mockResolvedValue(mockFlashcards)

      const cards = await getAllFlashcards('SECURITY_RISK_MANAGEMENT')

      expect(mockPrisma.flashcard.findMany).toHaveBeenCalledWith({
        where: { domain: 'SECURITY_RISK_MANAGEMENT' },
        orderBy: { createdAt: 'desc' }
      })
      expect(cards).toHaveLength(1)
      expect(cards[0].domain).toBe('SECURITY_RISK_MANAGEMENT')
    })

    it('should get all flashcards without domain filter', async () => {
      const now = new Date()
      const mockFlashcards = [
        {
          id: '1',
          front: 'Question 1',
          back: 'Answer 1',
          domain: 'SECURITY_RISK_MANAGEMENT' as const,
          nextReview: new Date(),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: '2',
          front: 'Question 2',
          back: 'Answer 2',
          domain: 'ASSET_SECURITY' as const,
          nextReview: new Date(),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 1,
          createdAt: now,
          updatedAt: now
        }
      ]

      mockPrisma.flashcard.findMany.mockResolvedValue(mockFlashcards)

      const cards = await getAllFlashcards()

      expect(mockPrisma.flashcard.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' }
      })
      expect(cards).toHaveLength(2)
    })

    it('should return empty array when no flashcards exist', async () => {
      mockPrisma.flashcard.findMany.mockResolvedValue([])

      const cards = await getAllFlashcards()

      expect(cards).toHaveLength(0)
      expect(cards).toEqual([])
    })

    it('should return error on database failure', async () => {
      mockPrisma.flashcard.findMany.mockRejectedValue(new Error('Database error'))

      const result = await getAllFlashcards()

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database error')
    })
  })
})
