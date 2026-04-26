import { getMindMapByDomain } from '@/lib/actions/mindmaps'
import { Domain } from '@prisma/client'
import { CISSP_DOMAINS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import { MindMapCanvas } from '@/components/mindmap/mindmap-canvas'

export function generateStaticParams() {
  return CISSP_DOMAINS.map(d => ({ domain: d.value }))
}

export default async function MindMapDomainPage({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>
}) {
  const { locale, domain } = await params

  const validDomains = CISSP_DOMAINS.map(d => d.value)
  if (!validDomains.includes(domain as any)) {
    notFound()
  }

  const result = await getMindMapByDomain(domain as Domain)

  if ('error' in result) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="htb-card p-12 text-center">
          <p className="text-xl text-red-400">Failed to load mind map: {result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mindmap-page">
      <MindMapCanvas mindMap={result} locale={locale} />
    </div>
  )
}
