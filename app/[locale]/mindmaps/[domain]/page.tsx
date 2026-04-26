import { getMindMapByDomain } from '@/lib/actions/mindmaps'
import { MindMapCanvas } from '@/components/mindmap/mindmap-canvas'
import { getTranslations } from 'next-intl/server'
import { CISSP_DOMAINS } from '@/lib/constants'
import type { Domain } from '@prisma/client'
import { notFound } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'

const VALID_DOMAINS = new Set(CISSP_DOMAINS.map((d) => d.value))

export default async function MindMapDomainPage({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>
}) {
  const { locale, domain } = await params

  // Validate domain
  if (!VALID_DOMAINS.has(domain as Domain)) {
    notFound()
  }

  const t = await getTranslations('mindmaps')
  const result = await getMindMapByDomain(domain as Domain)

  if ('error' in result) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="htb-card p-12 text-center">
          <p className="text-xl page-title mb-2">Error loading mind map</p>
          <p className="text-sm text-[#9ca3af]">{result.error}</p>
        </div>
      </div>
    )
  }

  if (!result.nodes.length) {
    return (
      <div className="mindmap-canvas" style={{ height: 'calc(100vh - 56px)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ReactFlowProvider>
          <MindMapCanvas mindMap={result} locale={locale} />
        </ReactFlowProvider>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" style={{ backgroundColor: 'rgba(13, 17, 23, 0.6)' }}>
          <div className="htb-card p-8 text-center pointer-events-auto" style={{ backgroundColor: 'rgba(22, 27, 34, 0.95)' }}>
            <p className="text-lg page-title mb-2">{t('emptyDomain')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <MindMapCanvas mindMap={result} locale={locale} />
    </ReactFlowProvider>
  )
}
