'use client'

import { useState, useEffect } from 'react'
import { Globe, Languages } from 'lucide-react'
import { LocaleService } from '@/lib/services/locale'
import { useTranslations } from 'next-intl'
import type { SupportedLocale } from '@/lib/types/i18n'

const LANGUAGE_LABELS: Record<SupportedLocale, { label: string; flag: string }> = {
  en: { label: 'EN', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' }
}

export function LanguageToggle() {
  const tLanguage = useTranslations('language')
  const [locale, setLocale] = useState<SupportedLocale>('en')
  const [mounted, setMounted] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLocale = LocaleService.getClientLocale()
    setLocale(savedLocale)
  }, [])

  const handleToggle = async () => {
    if (switching) return

    const newLocale: SupportedLocale = locale === 'en' ? 'zh' : 'en'
    setSwitching(true)

    // Save to localStorage and update state
    LocaleService.setClientLocale(newLocale)
    setLocale(newLocale)

    // Delay navigation for smooth UI transition
    setTimeout(async () => {
      // Sync with server (cookie) and navigate to new locale URL
      try {
        const response = await fetch('/api/locale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: newLocale })
        })

        if (response.ok) {
          // Navigate directly to new locale path based on current URL
          const currentPath = window.location.pathname
          const currentHasZhPrefix = currentPath.startsWith('/zh/')
          const currentIsZhRoot = currentPath === '/zh'

          let newPath: string

          if (newLocale === 'en') {
            // Switching to English: remove /zh prefix
            if (currentHasZhPrefix) {
              newPath = currentPath.replace(/^\/zh/, '')
            } else if (currentIsZhRoot) {
              newPath = '/'
            } else {
              newPath = currentPath
            }
          } else {
            // Switching to Chinese: add /zh prefix (but don't duplicate)
            if (currentHasZhPrefix || currentIsZhRoot) {
              // Already on Chinese page, stay here
              newPath = currentPath
            } else if (currentPath === '/') {
              newPath = '/zh'
            } else {
              newPath = `/zh${currentPath}`
            }
          }

          window.location.href = newPath
        } else {
          throw new Error('Failed to set locale')
        }
      } catch (error) {
        console.error('Failed to sync locale:', error)
        setSwitching(false)
      }
    }, 200)
  }

  if (!mounted) {
    return (
      <div className="w-20 h-9 rounded-lg bg-[#161b22]" />
    )
  }

  const currentLang = LANGUAGE_LABELS[locale]

  return (
    <button
      onClick={handleToggle}
      disabled={switching}
      className={`
        relative flex items-center gap-2 px-3 py-1.5
        bg-[#161b22] border border-[#30363d] rounded-lg
        overflow-hidden
        transition-all duration-300 ease-in-out
        ${!switching
          ? 'hover:border-[#9fef00]/50 hover:shadow-lg hover:shadow-[#9fef00]/10'
          : 'cursor-not-allowed opacity-70'}
      `}
      title={tLanguage('switchTo', { language: locale === 'en' ? '中文' : 'English' })}
    >
      {/* Globe icon */}
      <div className="hover:scale-110 transition-transform duration-300">
        <Languages className={`h-5 w-5 transition-colors duration-300 ${switching ? 'text-[#9fef00]' : 'text-[#718096]'}`} />
      </div>

      {/* Flag and label */}
      <div className="transition-opacity duration-300 ease-in-out">
        <span className="text-lg transition-all duration-300">
          {currentLang.flag}
        </span>
        <span className="text-sm font-medium text-white transition-all duration-300">
          {currentLang.label}
        </span>
      </div>

      {/* Loading spinner */}
      {switching && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#161b22]/80 rounded-lg backdrop-blur-sm">
          <div className="h-4 w-4 border-2 border-[#9fef00] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  )
}
