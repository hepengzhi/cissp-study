'use client'

import { useState, useCallback, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getQuizQuestions, updateProgress } from '@/lib/actions/quiz'
import { QuestionCard } from '@/components/question-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CISSP_DOMAINS } from '@/lib/constants'
import { CheckCircle2, XCircle, ArrowRight, Home, Target, ChevronRight, Play, Zap } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  questionText: string
  questionTextZh?: string | null
  options: string[]
  optionsZh?: string[]
  correctAnswer: number
  explanation: string
  explanationZh?: string | null
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
  const locale = useLocale()
  const tQuiz = useTranslations('quiz')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
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
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  // Get localized question data
  const getLocalizedQuestion = useCallback((question: Question) => ({
    ...question,
    questionText: locale === 'zh' && question.questionTextZh ? question.questionTextZh : question.questionText,
    options: locale === 'zh' && question.optionsZh ? question.optionsZh : question.options,
    explanation: locale === 'zh' && question.explanationZh ? question.explanationZh : question.explanation,
  }), [locale])

  const handleDomainToggle = useCallback((domainValue: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainValue)
        ? prev.filter(d => d !== domainValue)
        : [...prev, domainValue]
    )
  }, [])

  const handleStartQuiz = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
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
        setError('No questions found. Please try different settings.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }, [selectedDomains, questionCount, loading])

  const handleAnswer = useCallback(async (selected: number) => {
    if (submittingAnswer) return
    setSubmittingAnswer(true)

    const question = questions[currentIndex]
    const isCorrect = selected === question.correctAnswer

    try {
      await updateProgress(question.domain, isCorrect)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }

    setAnswers(prev => [...prev, {
      questionId: question.id,
      domain: question.domain,
      selectedAnswer: selected,
      isCorrect
    }])

    setSelectedAnswer(selected)
    setShowResult(true)
    setSubmittingAnswer(false)
  }, [questions, currentIndex, submittingAnswer])

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
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8 max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-[#9fef00]" />
              <h1 className="text-3xl font-bold text-white">{tQuiz('title')}</h1>
            </div>
            <p className="text-[#a0aec0]">{tQuiz('description')}</p>
          </div>

          <div className="htb-card p-6 space-y-6">
            {/* Domain Selection */}
            <div className="space-y-3">
              <Label className="text-base text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#9fef00]" />
                {tQuiz('setup.selectDomains')}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CISSP_DOMAINS.map((domain) => (
                  <button
                    key={domain.value}
                    onClick={() => handleDomainToggle(domain.value)}
                    aria-pressed={selectedDomains.includes(domain.value)}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                      selectedDomains.includes(domain.value)
                        ? 'bg-[#9fef00]/10 border-[#9fef00]/50 text-white'
                        : 'bg-[#161b22] border-[#30363d] text-[#a0aec0] hover:border-[#9fef00]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain.value)}
                      onChange={() => handleDomainToggle(domain.value)}
                      className="mt-0.5 min-w-4 min-h-4 accent-[#9fef00]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight">{domain.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label htmlFor="questionCount" className="text-white">{tQuiz('setup.questionCount')}</Label>
              <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                <SelectTrigger id="questionCount" className="bg-[#161b22] border-[#30363d] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((count) => (
                    <SelectItem key={count} value={count.toString()} className="text-white hover:bg-[#30363d]">
                      {count} {count !== 1 ? tQuiz('setup.questions') : tQuiz('setup.question')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-4 bg-[#f85149]/10 border-[#f85149]/30 rounded-lg text-[#f85149] text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleStartQuiz}
              disabled={loading}
              className="w-full htb-button"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d1117] border-t-transparent rounded-full animate-spin mr-2" />
                  {tQuiz('setup.starting')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {tQuiz('setup.start')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (quizState === 'active' && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    const localizedQuestion = getLocalizedQuestion(currentQuestion)

    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{tQuiz('question.of')} {currentIndex + 1}</h2>
                <div className="flex items-center gap-2 text-[#9fef00]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-mono">{answers.filter(a => a.isCorrect).length} {tQuiz('question.correct')}</span>
                </div>
              </div>
              <div className="htb-progress">
                <div
                  className="htb-progress-bar"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <QuestionCard
              question={localizedQuestion}
              onAnswer={handleAnswer}
              showResult={showResult}
              selectedAnswer={selectedAnswer}
            />

            {/* Next Button */}
            {showResult && (
              <div className="flex justify-center">
                <Button
                  onClick={handleNextQuestion}
                  size="lg"
                  className="htb-button"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      {tQuiz('actions.next')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      {tQuiz('actions.seeResults')}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (quizState === 'completed') {
    const correctCount = answers.filter(a => a.isCorrect).length
    const percentage = Math.round((correctCount / answers.length) * 100)
    const passed = percentage >= 70

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
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8 max-w-2xl space-y-8">
          {/* Result Header */}
          <div className="htb-card p-8 text-center">
            {passed ? (
              <CheckCircle2 className="h-16 w-16 text-[#9fef00] mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-[#f85149] mx-auto mb-4" />
            )}
            <h2 className="text-3xl font-bold text-white mb-2">
              {passed ? tQuiz('results.greatJob') : tQuiz('results.keepPracticing')}
            </h2>
            <div className="text-5xl font-bold font-mono mb-2" style={{ color: passed ? '#9fef00' : '#f85149' }}>
              {percentage}%
            </div>
            <p className="text-[#718096]">
              {tQuiz('results.score', { correct: correctCount, total: answers.length })}
            </p>
          </div>

          {/* Domain Breakdown */}
          {domainResults.length > 0 && (
            <div className="htb-card p-6 space-y-4">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-[#9fef00]" />
                {tQuiz('results.performanceByDomain')}
              </h3>
              <div className="space-y-3">
                {domainResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[#161b22] rounded-lg">
                    <div className={
                      result.percentage >= 80 ? 'text-[#9fef00]' :
                      result.percentage >= 60 ? 'text-[#ffd700]' :
                      'text-[#f85149]'
                    }>
                      {result.percentage >= 80 ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : result.percentage >= 60 ? (
                        <CheckCircle2 className="h-5 w-5 opacity-70" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{result.label}</div>
                      <div className="text-xs text-[#718096]">
                        {result.correct}/{result.total} correct
                      </div>
                    </div>
                    <div className="text-sm font-mono text-[#a0aec0]">{result.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleNewQuiz} className="flex-1 htb-button">
              <Play className="h-4 w-4 mr-2" />
              {tQuiz('results.newQuiz')}
            </Button>
            <Button variant="outline" asChild className="flex-1 htb-button-outline">
              <Link href={`/${locale}`}>
                <Home className="h-4 w-4 mr-2" />
                {tQuiz('results.dashboard')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-2 border-[#9fef00] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#718096]">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}

export default QuizPage
