import Link from 'next/link'
import { FileQuestion, Upload, Plus } from 'lucide-react'
import { getQuestions } from '@/lib/actions/questions'
import { getTranslations } from 'next-intl/server'

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin')

  const result = await getQuestions({ page: 1, pageSize: 1 })
  const totalQuestions = 'total' in result ? result.total : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('dashboard.totalQuestions')}</div>
          <div className="text-2xl font-bold text-foreground">{totalQuestions}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('dashboard.domains')}</div>
          <div className="text-2xl font-bold text-foreground">8</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('dashboard.difficulties')}</div>
          <div className="text-2xl font-bold text-foreground">3</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
        <div className="flex gap-3">
          <Link
            href="/admin/questions/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.addQuestion')}
          </Link>
          <Link
            href="/admin/questions/import"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-md font-medium text-sm hover:border-primary transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('dashboard.importQuestions')}
          </Link>
          <Link
            href="/admin/questions"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-md font-medium text-sm hover:border-primary transition-colors"
          >
            <FileQuestion className="h-4 w-4" />
            {t('dashboard.manageQuestions')}
          </Link>
        </div>
      </div>
    </div>
  )
}
