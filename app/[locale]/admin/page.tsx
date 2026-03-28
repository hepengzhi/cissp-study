import Link from 'next/link'
import { FileQuestion, Upload, Plus } from 'lucide-react'
import { getQuestions } from '@/lib/actions/questions'
import { useLocale, useTranslations } from 'next-intl'

export default async function AdminDashboardPage() {
  const t = useTranslations('admin')
  const locale = useLocale()

  const result = await getQuestions({ page: 1, pageSize: 1 })
  const totalQuestions = 'total' in result ? result.total : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f8fafc]">{t('dashboard.title')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-sm text-[#8b949e]">{t('dashboard.totalQuestions')}</div>
          <div className="text-2xl font-bold text-[#f8fafc]">{totalQuestions}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-sm text-[#8b949e]">{t('dashboard.domains')}</div>
          <div className="text-2xl font-bold text-[#f8fafc]">8</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-sm text-[#8b949e]">{t('dashboard.difficulties')}</div>
          <div className="text-2xl font-bold text-[#f8fafc]">3</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#f8fafc]">{t('dashboard.quickActions')}</h2>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/admin/questions/new`}
            className="flex items-center gap-2 px-4 py-2 bg-[#9fef00] text-[#0d1117] rounded-md font-medium text-sm hover:bg-[#9fef00]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.addQuestion')}
          </Link>
          <Link
            href={`/${locale}/admin/questions/import`}
            className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#f8fafc] rounded-md font-medium text-sm hover:border-[#9fef00] transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('dashboard.importQuestions')}
          </Link>
          <Link
            href={`/${locale}/admin/questions`}
            className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#f8fafc] rounded-md font-medium text-sm hover:border-[#9fef00] transition-colors"
          >
            <FileQuestion className="h-4 w-4" />
            {t('dashboard.manageQuestions')}
          </Link>
        </div>
      </div>
    </div>
  )
}
