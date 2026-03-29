'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { MatchingQuestionCard } from './matching-question-card'

import type { QuestionType } from '@prisma/client'

export interface Question {
  id: string
  questionText: string
  questionTextZh?: string | null
  options: string[]
  optionsZh?: string[] | null
  correctAnswer: string // String: "0" for single, "[0,2,3, 1]" for matching
  questionType?: QuestionType
  matchItems?: string[]
  matchItemsZh?: string[] | null
  explanation: string
  explanationZh?: string | null
  questionImages?: string[]
}

export interface QuestionCardProps {
  question: Question
  onAnswer: (selected: number | number[]) => void
  showResult?: boolean
  selectedAnswer?: string // JSON string for matching
}

export function QuestionCard({ question, onAnswer, showResult = false, selectedAnswer }: QuestionCardProps) {
  const tQuiz = useTranslations('quiz')
  const locale = useLocale()
  const isZh = locale === 'zh'

  // For single choice questions
  const [selected, setSelected] = useState<number | undefined>(() => {
    // Parse selectedAnswer if it's a string (from Map or single number)
    if (typeof selectedAnswer === 'string') {
      const parsed = parseInt(selectedAnswer, 10)
      if (!isNaN(parsed)) return parsed
    }
    return undefined
  })

  // Dispatch to matching question card if needed
  if (question.questionType === 'MATCHING') {
    return (
      <MatchingQuestionCard
        question={{
          id: question.id,
          questionText: question.questionText,
          questionTextZh: question.questionTextZh,
          matchItems: question.matchItems?.map((text, i) => ({
            id: `item-${i}`,
            text,
            textZh: question.matchItemsZh?.[i]
          })) || [],
          matchItemsZh: question.matchItemsZh?.map((text, i) => ({
            id: `item-zh-${i}`,
            text,
            textZh: text
          })) || [],
          options: question.options,
          optionsZh: question.optionsZh || [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          explanationZh: question.explanationZh,
          questionImages: question.questionImages
        }}
        onAnswer={onAnswer}
        showResult={showResult}
        selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : undefined}
      />
    )
  }

  // Single choice logic below
  const handleSelect = (index: number) => {
    if (showResult) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected !== undefined) {
      onAnswer(selected)
    }
  }

  const isCorrect = String(selected) === question.correctAnswer

  // Get text based on locale with fallback
  const getLocalizedText = (en?: string | null, zh?: string | null) => {
    if (isZh) {
      return (zh && zh.trim()) || (en && en.trim()) || ''
    }
    return (en && en.trim()) || (zh && zh.trim()) || ''
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">
          {getLocalizedText(question.questionText, question.questionTextZh)}
        </CardTitle>
        {question.questionImages && question.questionImages.length > 0 && (
          <div className="mt-3 space-y-2">
            {question.questionImages.map((img, i) => (
              <img key={i} src={img} alt={`Question image ${i + 1}`} className="max-w-full rounded-md" />
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const optionZh = question.optionsZh?.[index]
            const isSelected = selected === index
            const showCorrect = showResult && String(index) === question.correctAnswer
            const showIncorrect = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  showCorrect
                    ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20'
                    : showIncorrect
                    ? 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20'
                    : isSelected
                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                    : 'bg-background hover:bg-muted dark:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{getLocalizedText(option, optionZh)}</span>
                  {showCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-green-600" />}
                  {showIncorrect && <XCircle className="ml-auto h-5 w-5 text-red-600" />}
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">{tQuiz('explanation')}</p>
            <p className="text-sm text-muted-foreground">
              {getLocalizedText(question.explanation, question.explanationZh)}
            </p>
          </div>
        )}

        {!showResult && selected !== undefined && (
          <Button onClick={handleSubmit} className="w-full">
            {tQuiz('actions.submit')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
