import { getMindMapByDomain } from '@/lib/actions/mindmaps'
import { Domain } from '@prisma/client'
import { CISSP_DOMAINS } from '@/lib/constants'
import { notFound } from 'next/navigation'

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

  // Placeholder until MindMapCanvas is built (Task 8)
  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold page-title">{domain} Mind Map</h1>
        <p className="text-sm mt-1 text-muted">
          Nodes: {result.nodes?.length || 0}, Edges: {result.edges?.length || 0}
        </p>
      </div>
    </div>
  )
}
