import { getMindMapStats } from '@/lib/actions/mindmaps'
import { MindMapCard } from '@/components/mindmap/mindmap-card'
import { getTranslations } from 'next-intl/server'
import { CISSP_DOMAINS } from '@/lib/constants'

export default async function MindMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('mindmaps')
  const statsResult = await getMindMapStats()

  const stats = Array.isArray(statsResult) ? statsResult : []

  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold page-title">{t('title')}</h1>
              <p className="text-sm mt-1 text-[#9ca3af]">
                {t('description')}
              </p>
            </div>
          </div>
        </div>

        {/* Domain Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CISSP_DOMAINS.map((domain) => {
            const domainStat = stats.find((s) => s.domain === domain.value)
            return (
              <MindMapCard
                key={domain.value}
                domain={domain.value}
                nodeCount={domainStat?.nodeCount ?? 0}
                edgeCount={domainStat?.edgeCount ?? 0}
                lastEdited={domainStat?.lastEdited ?? null}
                locale={locale}
              />
            )
          })}

        </div>
      </div>
    </div>
  )
}
