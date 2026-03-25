'use client'

import { useState, useCallback, Suspense } from 'react'
import { getQuizQuestions, updateProgress } from '@/lib/actions/quiz'
import { QuestionCard } from '@/components/question-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CISSP_DOMAINS } from '@/lib/constants'
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  explanation: string
  domain: string
}

interface QuizAnswer {
  questionId: string
  domain: string
  selectedAnswer: number
  isCorrect: boolean
}

type QuizState = 'setup' | 'active' | 'completed'

function QuizContent() {
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>()
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDomainToggle = useCallback((domainValue: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainValue)
        ? prev.filter(d => d !== domainValue)
        : [...prev, domainValue]
    )
  }, [])

  const handleStartQuiz = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getQuizQuestions({
      domains: selectedDomains.length > 0 ? selectedDomains : undefined,
      count: questionCount
    })

    if (result && 'error' in result) {
      setError(result.error as string)
    } else if (Array.isArray(result) && result.length > 0) {
      setQuestions(result)
      setCurrentIndex(0)
      setAnswers([])
      setSelectedAnswer(undefined)
      setShowResult(false)
      setQuizState('active')
    } else {
      setError('No questions found. Please try different settings or add some questions first.')
    }

    setLoading(false)
  }, [selectedDomains, questionCount])

  const handleAnswer = useCallback(async (selected: number) => {
    const question = questions[currentIndex]
    const isCorrect = selected === question.correctAnswer

    // Update progress for this question's domain
    await updateProgress(question.domain, isCorrect)

    // Record the answer
    setAnswers(prev => [...prev, {
      questionId: question.id,
      domain: question.domain,
      selectedAnswer: selected,
      isCorrect
    }])

    setSelectedAnswer(selected)
    setShowResult(true)
  }, [questions, currentIndex])

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(undefined)
      setShowResult(false)
    } else {
      setQuizState('completed')
    }
  }, [currentIndex, questions.length])

  const handleNewQuiz = useCallback(() => {
    setQuizState('setup')
    setSelectedDomains([])
    setQuestionCount(10)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers([])
    setSelectedAnswer(undefined)
    setShowResult(false)
    setError(null)
  }, [])

  if (quizState === 'setup') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Practice Quiz</CardTitle>
            <CardDescription>
              Configure your quiz settings to practice CISSP exam questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">Select Domains (optional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CISSP_DOMAINS.map((domain) => (
                  <button
                    key={domain.value}
                    onClick={() => handleDomainToggle(domain.value)}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                      selectedDomains.includes(domain.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain.value)}
                      onChange={() => handleDomainToggle(domain.value)}
                      className="mt-0.5 min-w-4 min-h-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight">{domain.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                <SelectTrigger id="questionCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} question{count !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartQuiz}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Starting Quiz...' : 'Start Quiz'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (quizState === 'active' && questions.length > 0) {
    const currentQuestion = questions[currentIndex]

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Practice Quiz</h1>
              <p className="text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {answers.filter(a => a.isCorrect).length} correct so far
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            showResult={showResult}
            selectedAnswer={selectedAnswer}
          />

          {showResult && (
            <div className="flex justify-center">
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="gap-2"
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  'See Results'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (quizState === 'completed') {
    const correctCount = answers.filter(a => a.isCorrect).length
    const percentage = Math.round((correctCount / answers.length) * 100)

    // Group answers by domain
    const domainResults = CISSP_DOMAINS.map(domain => {
      const domainAnswers = answers.filter(a => a.domain === domain.value)
      if (domainAnswers.length === 0) return null
      const domainCorrect = domainAnswers.filter(a => a.isCorrect).length
      return {
        label: domain.label,
        correct: domainCorrect,
        total: domainAnswers.length,
        percentage: Math.round((domainCorrect / domainAnswers.length) * 100)
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null)

    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>
              Here&apos;s how you performed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="text-5xl font-bold mb-2">{percentage}%</div>
              <div className="text-xl text-muted-foreground">
                {correctCount} of {answers.length} correct
              </div>
            </div>

            {domainResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Performance by Domain</h3>
                <div className="space-y-2">
                  {domainResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className={`flex-shrink-0 ${
                        result.percentage >= 80 ? 'text-green-600' :
                        result.percentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {result.percentage >= 80 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : result.percentage >= 60 ? (
                          <CheckCircle2 className="h-5 w-5 opacity-70" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{result.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.correct}/{result.total} correct ({result.percentage}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={handleNewQuiz} className="flex-1">
              Start New Quiz
            </Button>
            <Button variant="outline" asChild className="flex-1 gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return null
}

function QuizPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8"><p className="text-center text-muted-foreground">Loading...</p></div>}>
      <QuizContent />
    </Suspense>
  )
}

export default QuizPage
