'use client'

import { useState, useEffect, useCallback } from 'react'
import { LocaleService } from '@/lib/services/locale'
import type { SupportedLocale } from '@/lib/types/i18n'

/**
 * Hook for managing language in client components
 * Similar pattern to ThemeToggle
 */
export function useClientLocale() {
  const [locale, setLocale] = useState<SupportedLocale>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLocale = LocaleService.getClientLocale()
    setLocale(savedLocale)
  }, [])

  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    setLocale(newLocale)
    LocaleService.setClientLocale(newLocale)

    // Sync with server
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale })
      })

      // Reload to apply changes
      window.location.reload()
    } catch (error) {
      console.error('Failed to sync locale:', error)
    }
  }, [])

  return {
    locale,
    changeLocale,
    mounted
  }
}
