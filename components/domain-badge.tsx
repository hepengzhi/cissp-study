'use client'

import { DOMAIN_NUMBER, DOMAIN_BADGE_CLASS } from '@/lib/constants'

interface DomainBadgeProps {
  domain: string
  label?: string
  className?: string
}

export function DomainBadge({ domain, label, className = '' }: DomainBadgeProps) {
  const num = DOMAIN_NUMBER[domain]
  const badge = DOMAIN_BADGE_CLASS[domain] ?? domain.split('_')[0].toLowerCase()

  // Pill mode: number + label in a colored pill
  if (label) {
    return (
      <span className={`domain-pill pill-${badge} ${className}`}>
        <span className="domain-pill-num">{num ?? ''}</span>
        {label}
      </span>
    )
  }

  // Compact mode: just the number circle (for tight spaces like dropdowns)
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.65rem] font-bold leading-none badge-circle-${badge} ${className}`}
      aria-hidden="true"
    >
      {num ?? ''}
    </span>
  )
}
