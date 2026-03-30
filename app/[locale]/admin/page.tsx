import Link from 'next/link'
import { FileQuestion, Download, Plus } from 'lucide-react'
import { getQuestions, getDomainStats } from '@/lib/actions/questions'
import { getTranslations } from 'next-intl/server'
import { CISSP_DOMAINS, DOMAIN_BADGE_CLASS } from '@/lib/constants'
import { getDomainLabel } from '@/lib/constants/i18n'
import type { SupportedLocale } from '@/lib/types/i18n'
import { Domain } from '@prisma/client'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const t = await getTranslations('admin')
  const { locale } = await params
  const typedLocale = (locale === 'zh' ? 'zh' : 'en') as SupportedLocale

  const result = await getQuestions({ page: 1, pageSize: 1 })
  const totalQuestions = 'total' in result ? result.total : 0

  const domainStatsRaw = await getDomainStats()
  const domainStats = Array.isArray(domainStatsRaw) ? domainStatsRaw : []
  const domainCountMap = new Map(
    domainStats.map((d: { domain: string; count: number }) => [d.domain, d.count])
  )
  const maxCount = Math.max(...domainStats.map((d: { count: number }) => d.count), 1)

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

      {/* Domain Breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('dashboard.domainBreakdown')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CISSP_DOMAINS.map((domain) => {
            const count = domainCountMap.get(domain.value) || 0
            const pillClass = DOMAIN_BADGE_CLASS[domain.value] || 'security'
            const pct = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0

            return (
              <Link
                key={domain.value}
                href={`/${locale}/admin/questions?domain=${domain.value}`}
                className="group bg-card border border-border rounded-lg p-3.5 hover:border-primary/30 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/10"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`domain-pill pill-${pillClass}`}>
                    <span className="domain-pill-num">{domain.number}</span>
                    {getDomainLabel(domain.value as Domain, typedLocale)}
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: `hsl(var(--foreground))` }}>
                    {count}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{t('dashboard.questions')}</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      background: `hsl(${getBarHue(pillClass)})`,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <div className="text-[0.65rem] text-muted-foreground mt-1.5 tabular-nums">
                  {pct.toFixed(1)}% {t('dashboard.questions')}
                </div>
              </Link>
            )
          })}
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
            <Download className="h-4 w-4" />
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

function getBarHue(pillClass: string): string {
  const hues: Record<string, string> = {
    security: '0 70% 50%',
    asset: '30 80% 50%',
    architecture: '78 70% 40%',
    network: '190 80% 45%',
    identity: '270 60% 55%',
    assessment: '320 60% 50%',
    operations: '45 80% 45%',
    software: '200 80% 50%',
  }
  return hues[pillClass] || '78 100% 50%'
}
