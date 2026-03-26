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
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLocale = LocaleService.getClientLocale()
    setLocale(savedLocale)
  }, [])

  const handleToggle = async () => {
    if (switching || isAnimating) return

    const newLocale: SupportedLocale = locale === 'en' ? 'zh' : 'en'
    setSwitching(true)
    setIsAnimating(true)

    // Animate flag swap
    await new Promise(resolve => setTimeout(resolve, 300))
    setLocale(newLocale)

    // Save to localStorage
    LocaleService.setClientLocale(newLocale)

    // Sync with server (cookie)
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale })
      })

      // Add a small delay for visual feedback before reload
      await new Promise(resolve => setTimeout(resolve, 500))

      // Reload to apply new locale across server components
      window.location.reload()
    } catch (error) {
      console.error('Failed to sync locale:', error)
      setSwitching(false)
      setIsAnimating(false)
    }
  }

  if (!mounted) {
    return (
      <div className="w-20 h-9 rounded-lg bg-[#161b22] animate-pulse" />
    )
  }

  const currentLang = LANGUAGE_LABELS[locale]

  return (
    <button
      onClick={handleToggle}
      disabled={switching || isAnimating}
      className={`
        relative flex items-center gap-2 px-3 py-1.5
        bg-[#161b22] border border-[#30363d] rounded-lg
        overflow-hidden
        transition-all duration-300 ease-in-out
        ${!switching
          ? 'hover:border-[#9fef00]/50 hover:shadow-lg hover:shadow-[#9fef00]/10'
          : 'cursor-not-allowed opacity-70'}
        ${isAnimating ? 'scale-95' : 'scale-100'}
      `}
      title={tLanguage('switchTo', { language: locale === 'en' ? '中文' : 'English' })}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-lg transition-all duration-500 ease-in-out
        ${isAnimating ? 'bg-[#9fef00]/10' : 'bg-transparent'}
      `} />

      {/* Globe icon with rotation animation */}
      <div className={`
        transition-transform duration-500 ease-in-out
        ${isAnimating ? 'rotate-180 scale-110' : 'rotate-0 scale-100 hover:scale-110'}
      `}>
        <Languages className={`h-5 w-5 transition-colors duration-300 ${switching ? 'text-[#9fef00]' : 'text-[#718096]'}`} />
      </div>

      {/* Flag and label container */}
      <div className={`
        relative transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
      `}>
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

      {/* Ripple effect on click */}
      {!switching && !isAnimating && (
        <span className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <span className="absolute inset-0 rounded-lg bg-[#9fef00]/20 animate-ping" />
        </span>
      )}
    </button>
  )
}
