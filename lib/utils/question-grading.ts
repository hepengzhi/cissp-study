import { QuestionType } from '@prisma/client'

export function isAnswerCorrect(
  questionType: QuestionType | string,
  correctAnswer: string,
  selectedAnswer: string,
): boolean {
  if (questionType === 'MATCHING') {
    try {
      const correct = JSON.parse(correctAnswer) as number[]
      const selected = JSON.parse(selectedAnswer) as number[]
      if (correct.length !== selected.length) return false
      return correct.every((val, i) => val === selected[i])
    } catch {
      return false
    }
  }

  // SINGLE_CHOICE (default)
  return correctAnswer === selectedAnswer
}
