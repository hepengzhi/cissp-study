/**
 * Core i18n type definitions
 * Central location for all language-related types
 */

export type SupportedLocale = 'en' | 'zh'

export interface LocaleString {
  en: string
  zh?: string | null
}

export interface LocaleArray<T = string> {
  en: T[]
  zh?: T[] | null
}

export interface BilingualContent<T = string> {
  value: T
  fallback?: T
  hasTranslation: boolean
  locale: SupportedLocale
}

export type DomainLabels = Record<SupportedLocale, string>

export interface LocaleConfig {
  code: SupportedLocale
  name: string
  nativeName: string
  flag: string
}

export const LOCALES: LocaleConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳'
  }
]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export function isValidLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'zh'
}
