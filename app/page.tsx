import { BookOpen, Brain, HelpCircle, Target, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/stat-card'
import { getDashboardStats } from '@/lib/actions/dashboard'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CISSP Study Platform</h1>
          <p className="text-lg text-gray-600">Your comprehensive study companion for CISSP certification</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Notes"
            value={stats.totalNotes}
            icon={BookOpen}
            description="Study materials created"
          />
          <StatCard
            title="Total Flashcards"
            value={stats.totalFlashcards}
            icon={Brain}
            description="Cards available for review"
          />
          <StatCard
            title="Total Questions"
            value={stats.totalQuestions}
            icon={HelpCircle}
            description="Practice questions"
          />
          <StatCard
            title="Overall Accuracy"
            value={`${(stats.overallAccuracy * 100).toFixed(1)}%`}
            icon={Target}
            description="Across all domains"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/notes">
              <Button className="w-full h-20 text-lg" variant="outline">
                <BookOpen className="mr-2 h-5 w-5" />
                Notes
              </Button>
            </Link>
            <Link href="/flashcards">
              <Button className="w-full h-20 text-lg" variant="outline">
                <Brain className="mr-2 h-5 w-5" />
                Flashcards
              </Button>
            </Link>
            <Link href="/quiz">
              <Button className="w-full h-20 text-lg" variant="outline">
                <HelpCircle className="mr-2 h-5 w-5" />
                Quiz
              </Button>
            </Link>
            <Link href="/exam">
              <Button className="w-full h-20 text-lg" variant="outline">
                <BarChart3 className="mr-2 h-5 w-5" />
                Exam
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Exam Attempts */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Exam Attempts</h2>
          <Card>
            <CardHeader>
              <CardTitle>Exam History</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentExamAttempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No exam attempts yet. Take your first exam to see your progress!</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentExamAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(attempt.startedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s` : 'In progress'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={attempt.score && attempt.score >= 70 ? 'default' : 'destructive'}>
                          {attempt.score ? `${attempt.score}%` : 'In progress'}
                        </Badge>
                        {attempt.score && (attempt.score >= 70 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
