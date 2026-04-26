import { getMindMapStats } from '@/lib/actions/mindmaps'
import { MindMapCard } from '@/components/mindmap/mindmap-card'
import { getTranslations } from 'next-intl/server'
import { Network } from 'lucide-react'

export default async function MindMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('mindmaps')
  const stats = await getMindMapStats()

  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold page-title">{t('title')}</h1>
            <p className="text-sm mt-1 text-[#9ca3af]">{t('description')}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.isArray(stats) && stats.map((stat) => (
            <MindMapCard
              key={stat.domain}
              domain={stat.domain}
              nodeCount={stat.nodeCount}
              edgeCount={stat.edgeCount}
              lastEdited={stat.lastEdited}
              locale={locale}
            />
          ))}
        </div>

        {(!Array.isArray(stats) || ('error' in stats && typeof stats === 'object')) && (
          <div className="htb-card p-12 text-center">
            <Network className="h-16 w-16 mx-auto mb-4 text-muted" />
            <p className="text-xl page-title mb-2">{t('none')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
