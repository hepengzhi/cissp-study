'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, FileText, Brain, ClipboardCheck, Trophy, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { useTranslations, useLocale } from 'next-intl'

const navItems = [
  { href: '/', labelKey: 'dashboard', icon: Shield },
  { href: '/notes', labelKey: 'notes', icon: FileText },
  { href: '/flashcards', labelKey: 'flashcards', icon: Brain },
  { href: '/quiz', labelKey: 'quiz', icon: ClipboardCheck },
  { href: '/exam', labelKey: 'exam', icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  const locale = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  // Get base path with locale prefix
  const getLocaleHref = (href: string) => {
    return locale === 'en' ? href : `/zh${href === '/' ? '' : href}`
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/95 dark:bg-[#0d1117]/95 backdrop-blur-sm border-b border-[#30363d]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={getLocaleHref('/')} className="flex items-center gap-2 group">
            <Shield className="h-6 w-6 text-[#9fef00] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white dark:text-white hidden sm:block">{t('logo')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const localeHref = getLocaleHref(item.href)
              const isActive = pathname === localeHref ||
                (item.href !== '/' && pathname.startsWith(localeHref))

              return (
                <Link
                  key={item.href}
                  href={localeHref}
                  className={cn(
                    'nav-link',
                    isActive && 'active'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - Theme toggle, Language toggle & Mobile menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[#a0aec0] hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#30363d] space-y-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const localeHref = getLocaleHref(item.href)
                const isActive = pathname === localeHref ||
                  (item.href !== '/' && pathname.startsWith(localeHref))

                return (
                  <Link
                    key={item.href}
                    href={localeHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'nav-link-mobile',
                      isActive && 'active'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
            <div className="pt-2 border-t border-[#30363d] flex gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
