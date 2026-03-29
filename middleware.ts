import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const LOCALE_COOKIE = 'cissp-locale'

function isValidLocale(locale: string): locale is 'en' | 'zh' {
  return locale === 'en' || locale === 'zh'
}

export default async function middleware(request: NextRequest) {
  const cookieStore = await cookies()
  const savedLocale = cookieStore.get(LOCALE_COOKIE)?.value

  // Use the cookie locale if valid, otherwise use default
  const locale = (savedLocale && isValidLocale(savedLocale)) ? savedLocale : defaultLocale

  const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
    localeDetection: false,
  })

  const response = await intlMiddleware(request)
  response.headers.set('x-locale', locale)
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}
