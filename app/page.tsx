import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Brain, ClipboardCheck, TrendingUp, Clock, Trophy, XCircle } from 'lucide-react'
import Link from 'next/link'

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
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            CISSP Study Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your progress and master the CISSP domains
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Questions"
            value={data.totalQuestions}
            icon={BookOpen}
            description="Available for practice"
          />
          <StatCard
            title="Questions Answered"
            value={data.totalQuestionsAnswered}
            icon={TrendingUp}
            description="Across quizzes and exams"
          />
          <StatCard
            title="Average Accuracy"
            value={`${data.averageAccuracy}%`}
            icon={Trophy}
            description="Overall performance"
          />
          <StatCard
            title="Passed Exams"
            value={`${data.passedExams}/${data.totalExamAttempts}`}
            icon={Trophy}
            description="70% or higher"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/notes">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <FileText className="h-6 w-6" />
              Notes
            </Button>
          </Link>
          <Link href="/flashcards">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <Brain className="h-6 w-6" />
              Flashcards
            </Button>
          </Link>
          <Link href="/quiz">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <ClipboardCheck className="h-6 w-6" />
              Quiz
            </Button>
          </Link>
          <Link href="/exam">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <Trophy className="h-6 w-6" />
              Exam
            </Button>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exam Attempts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Exam Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentAttempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No exam attempts yet. Start practicing!
                </p>
              ) : (
                <div className="space-y-4">
                  {data.recentAttempts.map((attempt) => {
                    const passed = attempt.score! >= 70
                    const hours = Math.floor(attempt.timeSpent! / 3600)
                    const minutes = Math.floor((attempt.timeSpent! % 3600) / 60)
                    const timeStr = hours > 0
                      ? `${hours}h ${minutes}m`
                      : `${minutes}m`

                    return (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {passed ? (
                            <Trophy className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-semibold">Exam Attempt</div>
                            <div className="text-sm text-muted-foreground">
                              {attempt.completedAt?.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={passed ? 'default' : 'destructive'}>
                            {passed ? 'PASSED' : 'FAILED'}
                          </Badge>
                          <Badge variant="outline">
                            {attempt.score}%
                          </Badge>
                          <Badge variant="secondary">
                            {timeStr}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress by Domain */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress by Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.progressStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Start practicing to see your progress!
                </p>
              ) : (
                <div className="space-y-4">
                  {data.progressStats.map((progress) => {
                    const totalAnswered = progress.quizQuestionsAnswered + progress.examQuestionsAnswered
                    const totalCorrect = progress.quizCorrectCount + progress.examCorrectCount
                    const accuracy = totalAnswered > 0
                      ? Math.round((totalCorrect / totalAnswered) * 100)
                      : 0

                    const domainLabel = progress.domain
                      .toLowerCase()
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')

                    return (
                      <div key={progress.domain} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{domainLabel}</span>
                          <span className="text-muted-foreground">
                            {totalAnswered} questions
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${Math.min(accuracy, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {accuracy}% accuracy
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resources Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Study Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.totalNotes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Notes Available
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.totalFlashcards}
                </div>
                <div className="text-sm text-muted-foreground">
                  Flashcards Ready
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Practice Questions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
