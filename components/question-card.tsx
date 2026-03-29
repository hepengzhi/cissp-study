'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  explanation: string
  questionImages?: string[]
}

interface QuestionCardProps {
  question: Question
  onAnswer: (selected: number) => void
  showResult?: boolean
  selectedAnswer?: number
}

export function QuestionCard({ question, onAnswer, showResult = false, selectedAnswer }: QuestionCardProps) {
  const tQuiz = useTranslations('quiz')
  const t = useTranslations('common')
  const [selected, setSelected] = useState<number | undefined>(selectedAnswer)

  useEffect(() => {
    setSelected(selectedAnswer)
  }, [selectedAnswer])

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected !== undefined) {
      onAnswer(selected)
    }
  }

  const isCorrect = selected === question.correctAnswer

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">{question.questionText}</CardTitle>
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
            const isSelected = selected === index
            const showCorrect = showResult && index === question.correctAnswer
            const showIncorrect = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  showCorrect
                    ? 'bg-green-50 border-green-500 text-green-900'
                    : showIncorrect
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
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
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
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
