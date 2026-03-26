import type { SupportedLocale } from '@/lib/types/i18n'

const LOCALE_STORAGE_KEY = 'cissp-locale'

/**
 * Locale Service (Client-Side Only)
 * Handles locale detection and storage using localStorage
 *
 * For server-side locale detection, use cookies directly in server components
 */
export class LocaleService {
  /**
   * Get locale from localStorage (client-side only)
   */
  static getClientLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'en'

    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      return (stored && this.isValidLocale(stored) ? stored : 'en') as SupportedLocale
    } catch {
      return 'en'
    }
  }

  /**
   * Set locale in localStorage (client-side only)
   */
  static setClientLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      console.warn('Failed to save locale to localStorage')
    }
  }

  /**
   * Validate locale string
   */
  static isValidLocale(locale: string): locale is SupportedLocale {
    return locale === 'en' || locale === 'zh'
  }
}
