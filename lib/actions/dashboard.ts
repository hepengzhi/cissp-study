'use server'

import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
  const [totalNotes, totalFlashcards, totalQuestions, progress] = await Promise.all([
    prisma.note.count(),
    prisma.flashcard.count(),
    prisma.question.count(),
    prisma.progress.findMany()
  ])

  // Calculate overall accuracy
  let overallAccuracy = 0
  if (progress.length > 0) {
    const totalCorrect = progress.reduce((sum, p) => sum + p.correctCount, 0)
    const totalAnswered = progress.reduce((sum, p) => sum + p.questionsAnswered, 0)
    overallAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0
  }

  // Get recent exam attempts
  const recentExamAttempts = await prisma.examAttempt.findMany({
    where: { completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    take: 5
  })

  return {
    totalNotes,
    totalFlashcards,
    totalQuestions,
    overallAccuracy,
    recentExamAttempts
  }
}
