'use server'

import { prisma } from '@/lib/prisma'

export async function startExam() {
  const questions = await prisma.question.findMany({
    take: 150
  })

  const shuffled = questions.sort(() => Math.random() - 0.5)

  const attempt = await prisma.examAttempt.create({
    data: {
      startedAt: new Date()
    }
  })

  return {
    attemptId: attempt.id,
    questions: shuffled.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      domain: q.domain
    }))
  }
}

export async function submitExam(attemptId: string, answers: Map<string, number>) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true }
  })

  if (!attempt) {
    throw new Error('Exam attempt not found')
  }

  // Get all questions to check answers
  const questionIds = Array.from(answers.keys())
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } }
  })

  const questionMap = new Map(questions.map(q => [q.id, q]))

  let correctCount = 0
  const examAnswers = []

  const answerEntries = Array.from(answers.entries())
  for (const [questionId, selectedAnswer] of answerEntries) {
    const question = questionMap.get(questionId)!
    const isCorrect = question.correctAnswer === selectedAnswer

    if (isCorrect) correctCount++

    examAnswers.push({
      attemptId,
      questionId,
      selectedAnswer,
      isCorrect
    })
  }

  // Update progress for each domain
  for (const question of questions) {
    const answer = Array.from(answers.entries()).find(([qId]) => qId === question.id)
    if (!answer) continue

    const isCorrect = question.correctAnswer === answer[1]

    await prisma.progress.upsert({
      where: { domain: question.domain },
      update: {
        questionsAnswered: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined
      },
      create: {
        domain: question.domain
      }
    })
  }

  const score = Math.round((correctCount / questions.length) * 100)

  const completedAt = new Date()
  const timeSpent = Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000)

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt,
      score,
      timeSpent
    }
  })

  return {
    score,
    passed: score >= 70,
    correctCount,
    totalQuestions: questions.length,
    timeSpent
  }
}
