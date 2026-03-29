'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface MatchItem {
  id: string
  text: string
  textZh?: string
}

interface MatchingQuestion {
  id: string
  questionText: string
  questionTextZh?: string | null
  matchItems: MatchItem[]
  matchItemsZh?: MatchItem[] | null
  options: string[]
  optionsZh?: string[] | null
  correctAnswer: string // JSON array like "[0, 2, 3, 1]"
  explanation: string
  explanationZh?: string | null
  questionImages?: string[]
}

interface MatchingQuestionCardProps {
  question: MatchingQuestion
  onAnswer: (selected: number[]) => void
  showResult?: boolean
  selectedAnswer?: number[]
}

export function MatchingQuestionCard({ question, onAnswer, showResult = false, selectedAnswer }: MatchingQuestionCardProps) {
  const tQuiz = useTranslations('quiz')
  const locale = useLocale()
  const isZh = locale === 'zh'

  // Parse correct answer from JSON string to array
  const correctArray: number[] = (() => {
    try {
      return JSON.parse(question.correctAnswer)
    } catch {
      return []
    }
  })()

  // Initialize selections state - one selection per match item
  const [selections, setSelections] = useState<Map<number, number>>(() => {
    const initial: Map<number, number> = new Map()
    for (let i = 0; i < question.matchItems.length; i++) {
      initial.set(i, -1) // -1 means not selected
    }
    return initial
  })

  // Initialize from selectedAnswer prop if provided
  useEffect(() => {
    if (selectedAnswer) {
      const map = new Map<number, number>()
      selectedAnswer.forEach((val, idx) => map.set(idx, val))
      setSelections(map)
    }
  }, [selectedAnswer])

  // Handle selection change for a match item
  const handleSelectChange = (itemIndex: number, optionIndex: number) => {
    setSelections(prev => {
      const next = new Map(prev)
      next.set(itemIndex, optionIndex)
      return next
    })
  }

  // Check if all items are selected
  const allSelected = Array.from({ length: question.matchItems.length }).every((_, i) => selections.get(i) !== -1)

  // Handle submit
  const handleSubmit = () => {
    if (!allSelected) return

    // Convert selections map to array in order of matchItems
    const answerArray: number[] = []
    for (let i = 0; i < question.matchItems.length; i++) {
      answerArray.push(selections.get(i) ?? -1)
    }

    onAnswer(answerArray)
  }

  // Check correctness
  const isCorrect =
    correctArray.length === question.matchItems.length &&
    correctArray.every((val, idx) => val === (selections.get(idx) ?? -1))

  // Get items and options based on locale with fallback
  const items = isZh
    ? (question.matchItemsZh?.length ? question.matchItemsZh! : question.matchItems)
    : (question.matchItems.length ? question.matchItems : (question.matchItemsZh?.length ? question.matchItemsZh! : question.matchItems))
  const opts = isZh
    ? (question.optionsZh?.length ? question.optionsZh! : question.options)
    : (question.options.length ? question.options : (question.optionsZh?.length ? question.optionsZh! : question.options))

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">
          {isZh
            ? (question.questionTextZh?.trim() || question.questionText)
            : (question.questionText?.trim() || question.questionTextZh || '')}
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
        <p className="text-sm text-muted-foreground mb-4">
          {tQuiz('matchInstructions')}
        </p>

        {/* Match items with dropdowns */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-medium min-w-[200px]">
                {idx + 1}. {isZh && item.textZh ? item.textZh : item.text}
              </span>
              <select
                value={selections.get(idx) ?? ''}
                onChange={(e) => handleSelectChange(idx, parseInt(e.target.value))}
                disabled={showResult}
                className={`flex-1 border rounded-md p-2 ${
                  showResult && selections.get(idx) === correctArray[idx]
                    ? 'border-green-500 bg-green-50'
                    : showResult && selections.get(idx) !== correctArray[idx]
                    ? 'border-red-500 bg-red-50'
                    : 'border-input'
                }`}
              >
                <option value="">-- {tQuiz('selectOption')}</option>
                {opts.map((opt, optIdx) => (
                  <option key={optIdx} value={optIdx}>
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </option>
                ))}
              </select>
              {showResult && selections.get(idx) !== undefined && selections.get(idx) !== -1 && (
                selections.get(idx) === correctArray[idx] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )
              )}
            </div>
          ))}
        </div>

        {/* Result summary */}
        {showResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">{tQuiz('correct')}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">{tQuiz('incorrect')}</span>
                </>
              )}
            </div>
            <p className="text-sm mt-3">
              <span className="font-medium">{tQuiz('explanation')}:</span>
              <span className="ml-2">{
                isZh
                  ? (question.explanationZh?.trim() || question.explanation)
                  : (question.explanation?.trim() || question.explanationZh || '')
              }</span>
            </p>
          </div>
        )}

        {/* Submit button */}
        {!showResult && allSelected && (
          <Button onClick={handleSubmit} className="w-full">
            {tQuiz('actions.submit')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
