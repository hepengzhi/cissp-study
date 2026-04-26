'use client'

import Link from 'next/link'
import { DomainBadge } from '@/components/domain-badge'
import { getDomainLabel } from '@/lib/constants/i18n'
import type { SupportedLocale } from '@/lib/types/i18n'
import type { Domain } from '@prisma/client'
import { Calendar, GitBranch, Circle } from 'lucide-react'

interface MindMapCardProps {
  domain: string
  nodeCount: number
  edgeCount: number
  lastEdited: Date | null
  locale: string
}

export function MindMapCard({ domain, nodeCount, edgeCount, lastEdited, locale }: MindMapCardProps) {
  const typedLocale = (locale === 'zh' ? 'zh' : 'en') as SupportedLocale
  const domainLabel = getDomainLabel(domain as Domain, typedLocale)

  return (
    <Link href={`/${locale}/mindmaps/${domain}`}>
      <div className="htb-card p-5 h-full group hover-lift">
        <div className="flex items-center gap-2 mb-3">
          <DomainBadge domain={domain} label={domainLabel} />
        </div>
        <div className="flex items-center gap-4 text-sm text-[#a0aec0] mb-3">
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-[#9fef00]" />
            {nodeCount} nodes
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3 text-[#00d4ff]" />
            {edgeCount} edges
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-timestamp">
          <Calendar className="h-3 w-3" />
          <span>{lastEdited ? new Date(lastEdited).toLocaleDateString() : 'Not yet created'}</span>
        </div>
      </div>
    </Link>
  )
}
