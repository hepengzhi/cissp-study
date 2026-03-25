'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CISSP_DOMAINS } from '@/lib/constants'
import { useRouter, useSearchParams } from 'next/navigation'

interface DomainFilterProps {
  value?: string
  onChange?: (value: string) => void
}

export function DomainFilter({ value, onChange }: DomainFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDomain = value || searchParams.get('domain') || 'all'

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
    <Tabs value={currentDomain} onValueChange={handleChange}>
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        {CISSP_DOMAINS.map((domain) => (
          <TabsTrigger key={domain.value} value={domain.value}>
            {domain.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
