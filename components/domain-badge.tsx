'use client'

import { DOMAIN_NUMBER, DOMAIN_BADGE_CLASS } from '@/lib/constants'

interface DomainBadgeProps {
  domain: string
  className?: string
}

export function DomainBadge({ domain, className = '' }: DomainBadgeProps) {
  const num = DOMAIN_NUMBER[domain]
  const badge = DOMAIN_BADGE_CLASS[domain] ?? domain.split('_')[0].toLowerCase()

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.65rem] font-bold leading-none badge-circle-${badge} ${className}`}
      aria-hidden="true"
    >
      {num ?? ''}
    </span>
  )
}
