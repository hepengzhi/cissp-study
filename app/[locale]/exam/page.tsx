'use client'

import { useState, useCallback, Suspense, useEffect } from 'react'
import { startExam, submitExam } from '@/lib/actions/exam'
import { QuestionCard } from '@/components/question-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer } from '@/components/timer'
import { CISSP_DOMAINS, DomainValue } from '@/lib/constants'
import { CheckCircle2, XCircle, Home, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface ExamQuestion {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  explanation: string
  domain: DomainValue
}

type ExamState = 'setup' | 'active' | 'submitting' | 'completed'

// Exam time limit: 3 hours = 180 minutes = 10800 seconds
const EXAM_TIME_LIMIT = 180 * 60

// Passing score: 70%
const PASSING_SCORE = 70

// Total questions in CISSP exam
const TOTAL_QUESTIONS = 150

// Minimum questions to pass (70% of 150)
const PASSING_COUNT = Math.ceil(TOTAL_QUESTIONS * (PASSING_SCORE / 100))

function ExamContent() {
  const [examState, setExamState] = useState<ExamState>('setup')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, number>>(new Map())
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [results, setResults] = useState<{
    score: number
    passed: boolean
    correctCount: number
    totalQuestions: number
    timeSpent: number
  } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(EXAM_TIME_LIMIT)

  // Track visited questions
  useEffect(() => {
    if (examState === 'active' && questions.length > 0) {
      setVisitedQuestions(prev => {
        const newSet = new Set(prev)
        newSet.add(currentIndex)
        return newSet
      })
    }
  }, [currentIndex, examState, questions.length])

  const handleStartExam = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await startExam()

      if (result && 'error' in result) {
        setError(result.error as string)
      } else if (result && 'attemptId' in result && 'questions' in result) {
        // Add placeholder values for correctAnswer and explanation
        // These won't be shown during the exam (showResult is false)
        const examQuestions: ExamQuestion[] = result.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: 0, // Placeholder - not shown during exam
          explanation: '', // Placeholder - not shown during exam
          domain: q.domain as DomainValue
        }))

        setQuestions(examQuestions)
        setAttemptId(result.attemptId)
        setCurrentIndex(0)
        setAnswers(new Map())
        setVisitedQuestions(new Set([0]))
        setTimeRemaining(EXAM_TIME_LIMIT)
        setExamState('active')
      } else {
        setError('Failed to start exam. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exam')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleAnswer = useCallback((selected: number) => {
    const question = questions[currentIndex]
    setAnswers(prev => new Map(prev).set(question.id, selected))
  }, [questions, currentIndex])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, questions.length])

  const handleNavigateToQuestion = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const handleSubmitExam = useCallback(async () => {
    setLoading(true)
    setError(null)
    setExamState('submitting')

    try {
      const result = await submitExam(attemptId, answers)

      if (result && 'error' in result) {
        setError(result.error as string)
        setExamState('active')
      } else {
        setResults(result as {
          score: number
          passed: boolean
          correctCount: number
          totalQuestions: number
          timeSpent: number
        })
        setExamState('completed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam')
      setExamState('active')
    } finally {
      setLoading(false)
    }
  }, [attemptId, answers])

  const handleTimerExpire = useCallback(() => {
    setShowSubmitConfirm(true)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatTimeSpent = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }, [])

  const getAnsweredCount = useCallback(() => {
    return answers.size
  }, [answers])

  const getQuestionStatus = useCallback((index: number) => {
    const question = questions[index]
    const isAnswered = answers.has(question.id)
    const isVisited = visitedQuestions.has(index)
    const isCurrent = index === currentIndex

    if (isCurrent) return 'current'
    if (isAnswered) return 'answered'
    if (isVisited) return 'visited'
    return 'unvisited'
  }, [questions, answers, visitedQuestions, currentIndex])

  // Setup screen
  if (examState === 'setup') {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">CISSP Exam Simulation</CardTitle>
            <CardDescription>
              Simulate the full CISSP exam experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Time Limit</h3>
                  <p className="text-sm text-muted-foreground">3 hours (180 minutes)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Questions</h3>
                  <p className="text-sm text-muted-foreground">{TOTAL_QUESTIONS} questions from all CISSP domains</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Passing Score</h3>
                  <p className="text-sm text-muted-foreground">{PASSING_SCORE}% ({PASSING_COUNT} or more correct)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">Important</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions cannot be skipped or reviewed after submission. Make sure you are ready before starting.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartExam}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Starting Exam...' : 'Start Exam'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Active exam screen
  if (examState === 'active' && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    const isAnswered = answers.has(currentQuestion.id)

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with timer and progress */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CISSP Exam</h1>
              <p className="text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <Timer
              initialSeconds={timeRemaining}
              onExpire={handleTimerExpire}
            />
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Answered count */}
          <div className="text-sm text-muted-foreground text-center">
            {getAnsweredCount()} of {questions.length} questions answered
          </div>

          {/* Question card */}
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            showResult={false}
            selectedAnswer={answers.get(currentQuestion.id)}
          />

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>

          {/* Question navigator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index)
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigateToQuestion(index)}
                      className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                        status === 'current'
                          ? 'bg-primary text-primary-foreground'
                          : status === 'answered'
                          ? 'bg-green-500 text-white'
                          : status === 'visited'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      aria-label={`Question ${index + 1}`}
                      aria-current={status === 'current' ? 'true' : undefined}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span>Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <span>Unvisited</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit button */}
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <Button
                onClick={() => setShowSubmitConfirm(true)}
                variant="destructive"
                className="w-full"
                disabled={getAnsweredCount() === 0}
              >
                Submit Exam
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You have {formatTime(timeRemaining)} remaining
              </p>
            </CardContent>
          </Card>

          {/* Submit confirmation dialog */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Submit Exam?</CardTitle>
                  <CardDescription>
                    Are you sure you want to submit your exam? This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Questions answered:</strong> {getAnsweredCount()} of {questions.length}
                    </p>
                    <p className="text-sm">
                      <strong>Time remaining:</strong> {formatTime(timeRemaining)}
                    </p>
                  </div>
                  {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button
                    onClick={handleSubmitExam}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                  <Button
                    onClick={() => setShowSubmitConfirm(false)}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Submitting screen
  if (examState === 'submitting') {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Submitting your exam...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we calculate your results.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results screen
  if (examState === 'completed' && results) {
    // Group results by domain
    // Note: We need to get the domain breakdown from the questions and results
    const domainResults = CISSP_DOMAINS.map(domain => {
      const domainQuestions = questions.filter(q => q.domain === domain.value)
      if (domainQuestions.length === 0) return null

      // For now, we can't calculate per-domain accuracy without the detailed results
      // The submitExam action only returns total score, not domain breakdown
      return {
        label: domain.label,
        total: domainQuestions.length,
        percentage: 0 // Can't calculate without detailed results
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null)

    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 rounded-full p-4 ${
              results.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {results.passed ? (
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {results.passed ? 'Congratulations!' : 'Keep Studying!'}
            </CardTitle>
            <CardDescription>
              {results.passed
                ? 'You have passed the exam simulation'
                : 'You did not reach the passing score this time'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className={`text-5xl font-bold mb-2 ${
                results.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.score}%
              </div>
              <div className="text-xl text-muted-foreground">
                {results.correctCount} of {results.totalQuestions} correct
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                (Passing score: {PASSING_SCORE}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{formatTimeSpent(results.timeSpent)}</div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{results.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>

            {domainResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Questions by Domain</h3>
                <div className="space-y-2">
                  {domainResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{result.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.total} questions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
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

function ExamPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8"><p className="text-center text-muted-foreground">Loading...</p></div>}>
      <ExamContent />
    </Suspense>
  )
}

export default ExamPage
