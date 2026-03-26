'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Theme = 'dark' | 'light' | 'system'

export function ThemeToggle() {
  const t = useTranslations('theme')
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Default to dark
      setTheme('dark')
      applyTheme('dark')
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('light-mode', !systemDark)
    } else {
      root.classList.toggle('light-mode', newTheme === 'light')
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#161b22] animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-[#161b22] rounded-lg border border-[#30363d]">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-[#9fef00] text-[#0d1117]'
            : 'text-[#718096] hover:text-white'
        }`}
        title={t('light')}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-[#9fef00] text-[#0d1117]'
            : 'text-[#718096] hover:text-white'
        }`}
        title={t('dark')}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-[#9fef00] text-[#0d1117]'
            : 'text-[#718096] hover:text-white'
        }`}
        title={t('system')}
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
