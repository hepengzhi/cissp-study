'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getLocalizedDomains } from '@/lib/constants/i18n'
import { useLocale, useTranslations } from 'next-intl'
import type { SupportedLocale } from '@/lib/types/i18n'
import { ChevronDown } from 'lucide-react'

interface DomainFilterProps {
  value?: string
  onChange?: (value: string) => void
}

export function DomainFilter({ value, onChange }: DomainFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as SupportedLocale
  const t = useTranslations('domainFilter')
  const currentDomain = value || searchParams.get('domain') || 'all'

  const domains = getLocalizedDomains(locale)

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue === 'all') {
        params.delete('domain')
      } else {
        params.set('domain', newValue)
      }
      router.push(`?${params.toString()}`)
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentDomain}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-[#161b22] border border-[#30363d] text-white text-sm rounded-lg pl-3 pr-9 py-2.5 cursor-pointer hover:bg-[#1c2128] transition-colors focus:outline-none focus:ring-1 focus:ring-[#9fef00]/30 focus:border-[#9fef00]/50"
      >
        <option value="all">{t('allDomains')}</option>
        {domains.map((domain) => (
          <option key={domain.value} value={domain.value}>
            {domain.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#718096] pointer-events-none" />
    </div>
  )
}
