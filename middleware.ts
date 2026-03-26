import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Use prefix when needed
})

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next/static files
    // - _next/image files
    // - favicon.ico
    // - public folder
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}
