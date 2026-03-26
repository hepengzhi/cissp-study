import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Brain, ClipboardCheck, TrendingUp, Clock, Trophy, XCircle, Shield, Network, Users, Target, Cpu, Search, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { SupportedLocale } from '@/lib/types/i18n'
import { getServerLocale } from '@/lib/utils/locale-server'
import { getDomainLabel } from '@/lib/constants/i18n'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData() {
  const [
    totalQuestions,
    totalNotes,
    totalFlashcards,
    totalExamAttempts,
    recentAttempts,
    progressStats
  ] = await Promise.all([
    prisma.question.count(),
    prisma.note.count(),
    prisma.flashcard.count(),
    prisma.examAttempt.count(),
    prisma.examAttempt.findMany({
      where: {
        completedAt: { not: null }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        score: true,
        completedAt: true,
        timeSpent: true
      }
    }),
    prisma.progress.findMany({
      select: {
        domain: true,
        quizQuestionsAnswered: true,
        examQuestionsAnswered: true,
        quizCorrectCount: true,
        examCorrectCount: true
      }
    })
  ])

  const passedExams = await prisma.examAttempt.count({
    where: {
      completedAt: { not: null },
      score: { gte: 70 }
    }
  })

  const totalQuestionsAnswered = progressStats.reduce((sum, p) =>
    sum + p.quizQuestionsAnswered + p.examQuestionsAnswered, 0
  )

  const totalCorrect = progressStats.reduce((sum, p) =>
    sum + p.quizCorrectCount + p.examCorrectCount, 0
  )

  const averageAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0

  return {
    totalQuestions,
    totalNotes,
    totalFlashcards,
    totalExamAttempts,
    passedExams,
    totalQuestionsAnswered,
    averageAccuracy,
    recentAttempts,
    progressStats
  }
}

export default async function DashboardPage() {
  const locale = await getServerLocale()
  const t = await getTranslations('dashboard')
  const tNav = await getTranslations('nav')
  const data = await getDashboardData()

  const quickLinks = [
    { href: '/notes', label: tNav('notes'), icon: FileText, color: 'text-green-400', bg: 'bg-green-400' },
    { href: '/flashcards', label: tNav('flashcards'), icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-400' },
    { href: '/quiz', label: tNav('quiz'), icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-400' },
    { href: '/exam', label: tNav('exam'), icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400' },
  ]

  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold page-title">{t('title')}</h1>
          <p className="page-description">{t('description')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="htb-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="card-label">{t('stats.questions')}</span>
              <BookOpen className="h-4 w-4 text-[#9fef00]" />
            </div>
            <div className="text-2xl font-bold page-title">{data.totalQuestions}</div>
          </div>

          <div className="htb-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="card-label">{t('stats.answered')}</span>
              <TrendingUp className="h-4 w-4 text-[#00d4ff]" />
            </div>
            <div className="text-2xl font-bold page-title">{data.totalQuestionsAnswered}</div>
          </div>

          <div className="htb-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="card-label">{t('stats.accuracy')}</span>
              <Target className="h-4 w-4 text-[#9fef00]" />
            </div>
            <div className="text-2xl font-bold text-[#9fef00]">{data.averageAccuracy}%</div>
          </div>

          <div className="htb-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="card-label">{t('stats.examsPassed')}</span>
              <Trophy className="h-4 w-4 text-[#ffd700]" />
            </div>
            <div className="text-2xl font-bold page-title">
              <span className="text-[#9fef00]">{data.passedExams}</span>
              <span className="text-muted">/{data.totalExamAttempts}</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <div className="htb-card p-5 flex flex-col items-center gap-3 hover-lift">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center icon-box group-hover:bg-[#9fef00]/10 transition-colors`}>
                  <link.icon className={`h-6 w-6 ${link.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="font-medium page-title group-hover:text-[#9fef00] transition-colors">
                  {link.label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exams */}
          <div className="htb-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-5 w-5 text-[#9fef00]" />
              <h2 className="text-lg font-semibold page-title">{t('recentExams.title')}</h2>
            </div>
            {data.recentAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-10 w-10 empty-icon mx-auto mb-2" />
                <p className="page-description">{t('recentExams.none')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentAttempts.map((attempt) => {
                  const passed = attempt.score! >= 70
                  const hours = Math.floor(attempt.timeSpent! / 3600)
                  const minutes = Math.floor((attempt.timeSpent! % 3600) / 60)
                  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 card-inner hover-border transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {passed ? (
                          <Trophy className="h-4 w-4 text-[#9fef00]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[#f85149]" />
                        )}
                        <div>
                          <div className="text-sm font-medium page-title">Exam</div>
                          <div className="text-xs text-muted">
                            {attempt.completedAt?.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={passed ? 'bg-[#9fef00]/10 text-[#9fef00] border-[#9fef00]/30' : 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30'}>
                          {attempt.score}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resources */}
          <div className="htb-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="h-5 w-5 text-[#9fef00]" />
              <h2 className="text-lg font-semibold page-title">{t('resources.title')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 card-inner hover-border transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#9fef00]" />
                  <span className="page-title">{t('resources.notes')}</span>
                </div>
                <span className="text-xl font-bold text-[#9fef00] font-mono">{data.totalNotes}</span>
              </div>
              <div className="flex items-center justify-between p-4 card-inner hover-border transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-[#00d4ff]" />
                  <span className="page-title">{t('resources.flashcards')}</span>
                </div>
                <span className="text-xl font-bold text-[#00d4ff] font-mono">{data.totalFlashcards}</span>
              </div>
              <div className="flex items-center justify-between p-4 card-inner hover-border transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-[#bf7af0]" />
                  <span className="page-title">{t('resources.questions')}</span>
                </div>
                <span className="text-xl font-bold text-[#bf7af0] font-mono">{data.totalQuestions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
