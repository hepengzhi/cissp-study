import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'zh'] as const
export const defaultLocale = 'en' as const

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});
