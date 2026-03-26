import { cookies } from 'next/headers'
import type { SupportedLocale } from '@/lib/types/i18n'

const LOCALE_COOKIE = 'cissp-locale'

/**
 * Get locale from cookie (server-side only)
 * Must be used in Server Components only
 */
export async function getServerLocale(): Promise<SupportedLocale> {
  try {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)

    if (cookieLocale?.value && isValidLocale(cookieLocale.value)) {
      return cookieLocale.value as SupportedLocale
    }

    return 'en'
  } catch (error) {
    console.error('Error getting server locale:', error)
    return 'en'
  }
}

/**
 * Validate locale string
 */
function isValidLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'zh'
}
