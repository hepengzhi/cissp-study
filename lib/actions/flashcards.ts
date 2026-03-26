'use server'

import { prisma } from '@/prisma/config'
import { z } from 'zod'
import { calculateNextReview, SM2Quality, type ReviewResult } from '@/lib/spaced-repetition'

const FlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  domain: z.enum([
    'SECURITY_RISK_MANAGEMENT',
    'ASSET_SECURITY',
    'SECURITY_ARCHITECTURE',
    'COMMUNICATION_NETWORK_SECURITY',
    'IDENTITY_ACCESS_MANAGEMENT',
    'SECURITY_ASSESSMENT',
    'SECURITY_OPERATIONS',
    'SOFTWARE_DEVELOPMENT_SECURITY'
  ])
})

const RateFlashcardSchema = z.object({
  id: z.string().min(1),
  quality: z.nativeEnum(SM2Quality)
})

export type FlashcardDomain = z.infer<typeof FlashcardSchema>['domain']

export async function createFlashcard(data: z.infer<typeof FlashcardSchema>) {
  try {
    const validated = FlashcardSchema.parse(data)

    return await prisma.flashcard.create({
      data: {
        ...validated,
        nextReview: new Date(), // New cards are due immediately
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0
      }
    })
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

export async function getDueCards(domain?: FlashcardDomain) {
  try {
    const now = new Date()
    return await prisma.flashcard.findMany({
      where: {
        nextReview: { lte: now },
        ...(domain && { domain })
      },
      orderBy: { nextReview: 'asc' }
    })
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function rateFlashcard(id: string, quality: SM2Quality) {
  try {
    const validated = RateFlashcardSchema.parse({ id, quality })

    const card = await prisma.flashcard.findUnique({
      where: { id: validated.id }
    })

    if (!card) {
      return { error: 'Flashcard not found' }
    }

    const result: ReviewResult = calculateNextReview(
      {
        quality: validated.quality,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions
      },
      new Date()
    )

    return await prisma.flashcard.update({
      where: { id: validated.id },
      data: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReview: result.nextReview
      }
    })
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

export async function getAllFlashcards(domain?: FlashcardDomain) {
  try {
    return await prisma.flashcard.findMany({
      where: domain ? { domain } : undefined,
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function updateFlashcard(id: string, data: z.infer<typeof FlashcardSchema>) {
  try {
    const validated = FlashcardSchema.parse(data)

    return await prisma.flashcard.update({
      where: { id },
      data: {
        front: validated.front,
        back: validated.back,
        domain: validated.domain
      }
    })
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

export async function deleteFlashcard(id: string) {
  try {
    await prisma.flashcard.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function resetAllFlashcardProgress() {
  try {
    const result = await prisma.flashcard.updateMany({
      data: {
        nextReview: new Date(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0
      }
    })

    return { success: true, count: result.count }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
