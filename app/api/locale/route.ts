import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { SupportedLocale } from '@/lib/types/i18n'

const LOCALE_COOKIE = 'cissp-locale'

function isValidLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'zh'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale } = body as { locale: SupportedLocale }

    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })

    return NextResponse.json({ success: true, locale })
  } catch (error) {
    console.error('Error setting locale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
