'use client'

import { useState, useCallback, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getQuizQuestions, updateProgress } from '@/lib/actions/quiz'
import { isAnswerCorrect } from '@/lib/utils/question-grading'
import type { QuestionType } from '@prisma/client'
import { QuestionCard } from '@/components/question-card'
import { getLocalizedText, getLocalizedArray } from '@/lib/utils/localize'
import { CISSP_DOMAINS } from '@/lib/constants'
import { DomainBadge } from '@/components/domain-badge'
import { CheckCircle2, XCircle, ArrowRight, Home, Target, ChevronRight, Play, Zap, Shield, Trophy, RotateCcw, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  questionText: string
  questionTextZh?: string | null
  options: string[]
  optionsZh?: string[]
  correctAnswer: string
  questionType?: QuestionType
  matchItems?: string[]
  matchItemsZh?: string[]
  explanation: string
  explanationZh?: string | null
  domain: string
  questionImages?: string[]
}

interface QuizAnswer {
  questionId: string
  domain: string
  selectedAnswer: string
  isCorrect: boolean
}

type QuizState = 'setup' | 'active' | 'completed'

function QuizContent() {
  const locale = useLocale()
  const tQuiz = useTranslations('quiz')
  const tCommon = useTranslations('common')
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>()
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  const getLocalizedQuestion = useCallback((question: Question) => ({
    ...question,
    questionText: getLocalizedText(question.questionText, question.questionTextZh, locale),
    questionTextZh: question.questionTextZh,
    options: getLocalizedArray(question.options, question.optionsZh, locale),
    optionsZh: question.optionsZh,
    explanation: getLocalizedText(question.explanation, question.explanationZh, locale),
    explanationZh: question.explanationZh,
    matchItems: getLocalizedArray(question.matchItems, question.matchItemsZh, locale),
    matchItemsZh: question.matchItemsZh,
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

  const handleAnswer = useCallback(async (selected: number | number[]) => {
    if (submittingAnswer) return
    setSubmittingAnswer(true)

    const question = questions[currentIndex]
    const answerStr = Array.isArray(selected) ? JSON.stringify(selected) : String(selected)
    const isCorrect = isAnswerCorrect('SINGLE_CHOICE', question.correctAnswer, answerStr)

    try {
      await updateProgress(question.domain, isCorrect)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }

    setAnswers(prev => [...prev, {
      questionId: question.id,
      domain: question.domain,
      selectedAnswer: answerStr,
      isCorrect
    }])

    setSelectedAnswer(answerStr)
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

  // ==================== SETUP SCREEN ====================
  if (quizState === 'setup') {
    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-6 max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#9fef00]/10 border border-[#9fef00]/20">
              <Target className="h-6 w-6 text-[#9fef00]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{tQuiz('title')}</h1>
              <p className="text-sm text-[#718096]">{tQuiz('description')}</p>
            </div>
          </div>

          {/* Config Card */}
          <div className="htb-card p-5 space-y-5">
            {/* Domain Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-3.5 w-3.5 text-[#9fef00]" />
                {tQuiz('setup.selectDomains')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {CISSP_DOMAINS.map((domain) => {
                  const isSelected = selectedDomains.includes(domain.value)
                  return (
                    <button
                      key={domain.value}
                      onClick={() => handleDomainToggle(domain.value)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#9fef00]/8 border-[#9fef00]/30 hover:bg-[#9fef00]/12'
                          : 'bg-[#0d1117] border-[#21262d] hover:border-[#30363d] hover:bg-[#161b22]'
                      }`}
                    >
                      <span className={`relative w-[18px] h-[18px] flex-shrink-0 transition-all duration-200 ${
                        isSelected ? 'drop-shadow-[0_0_3px_rgba(159,239,0,0.5)]' : ''
                      }`}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-colors duration-200" style={{ color: isSelected ? '#9fef00' : '#484f58' }}>
                          <path d="M1 6V2.5C1 1.67157 1.67157 1 2.5 1H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <path d="M12 1H15.5C16.3284 1 17 1.67157 17 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <path d="M17 12V15.5C17 16.3284 16.3284 17 15.5 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <path d="M6 17H2.5C1.67157 17 1 16.3284 1 15.5V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-[6px] h-[6px] rounded-full bg-[#9fef00]" style={{ boxShadow: '0 0 6px #9fef00' }} />
                          </span>
                        )}
                      </span>
                      <DomainBadge domain={domain.value} label={domain.label} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">{tQuiz('setup.questionCount')}</label>
              <div className="flex gap-1.5">
                {[5, 10, 15, 20, 30, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all duration-150 ${
                      questionCount === count
                        ? 'bg-[#9fef00]/10 border-[#9fef00]/30 text-[#9fef00]'
                        : 'bg-[#0d1117] border-[#21262d] text-[#718096] hover:border-[#30363d] hover:text-[#a0aec0]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#f85149]/8 border border-[#f85149]/20 rounded-lg text-[#f85149] text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm bg-[#9fef00] text-[#0d1117] hover:bg-[#9fef00]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d1117] border-t-transparent rounded-full animate-spin" />
                  {tQuiz('setup.starting')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {tQuiz('setup.start')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== ACTIVE QUIZ SCREEN ====================
  if (quizState === 'active' && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    const localizedQuestion = getLocalizedQuestion(currentQuestion)
    const correctSoFar = answers.filter(a => a.isCorrect).length
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Compact Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#9fef00]" />
                <span className="text-sm font-semibold text-white font-mono">{currentIndex + 1}<span className="text-[#30363d]">/{questions.length}</span></span>
              </div>
              <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9fef00] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#9fef00]" />
                <span className="font-mono text-[#9fef00]">{correctSoFar}</span>
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
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-2.5 rounded-lg font-semibold text-sm bg-[#9fef00] text-[#0d1117] hover:bg-[#9fef00]/90 transition-all duration-150 flex items-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      {tQuiz('actions.next')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {tQuiz('actions.seeResults')}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==================== RESULTS SCREEN ====================
  if (quizState === 'completed') {
    const correctCount = answers.filter(a => a.isCorrect).length
    const percentage = Math.round((correctCount / answers.length) * 100)
    const passed = percentage >= 70

    const domainResults = CISSP_DOMAINS.map(domain => {
      const domainAnswers = answers.filter(a => a.domain === domain.value)
      if (domainAnswers.length === 0) return null
      const domainCorrect = domainAnswers.filter(a => a.isCorrect).length
      return {
        value: domain.value,
        label: domain.label,
        correct: domainCorrect,
        total: domainAnswers.length,
        percentage: Math.round((domainCorrect / domainAnswers.length) * 100)
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null)

    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-6 max-w-2xl space-y-5">
          {/* Result Hero */}
          <div className="htb-card p-6">
            <div className="flex items-center gap-5">
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${
                passed ? 'bg-[#9fef00]/10' : 'bg-[#f85149]/10'
              }`}>
                {passed ? (
                  <Trophy className="h-8 w-8 text-[#9fef00]" />
                ) : (
                  <RotateCcw className="h-8 w-8 text-[#f85149]" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {passed ? tQuiz('results.greatJob') : tQuiz('results.keepPracticing')}
                </h2>
                <p className="text-sm text-[#718096] mt-0.5">
                  {tQuiz('results.score', { correct: correctCount, total: answers.length })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-mono" style={{ color: passed ? '#9fef00' : '#f85149' }}>
                  {percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Domain Breakdown */}
          {domainResults.length > 0 && (
            <div className="htb-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-[#9fef00]" />
                {tQuiz('results.performanceByDomain')}
              </div>
              <div className="space-y-1.5">
                {domainResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 px-3 py-2.5 bg-[#0d1117] rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DomainBadge domain={result.value} label={result.label} />
                      </div>
                      <div className="w-full h-1 bg-[#21262d] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            result.percentage >= 80 ? 'bg-[#9fef00]' :
                            result.percentage >= 60 ? 'bg-[#ffd700]' :
                            'bg-[#f85149]'
                          }`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-mono font-bold ${
                        result.percentage >= 80 ? 'text-[#9fef00]' :
                        result.percentage >= 60 ? 'text-[#ffd700]' :
                        'text-[#f85149]'
                      }`}>
                        {result.percentage}%
                      </div>
                      <div className="text-[10px] text-[#484f58]">
                        {result.correct}/{result.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNewQuiz}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-[#9fef00] text-[#0d1117] hover:bg-[#9fef00]/90 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              {tQuiz('results.newQuiz')}
            </button>
            <Link href={`/${locale}`} className="flex-1">
              <button className="w-full py-2.5 rounded-lg font-semibold text-sm bg-transparent border border-[#21262d] text-[#e6edf3] hover:border-[#9fef00]/30 hover:text-[#9fef00] transition-all duration-150 flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                {tQuiz('results.dashboard')}
              </button>
            </Link>
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
            <div className="w-10 h-10 border-2 border-[#9fef00] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#484f58]">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}

export default QuizPage
