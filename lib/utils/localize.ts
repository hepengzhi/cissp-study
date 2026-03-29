/**
 * Get the localized text with fallback.
 * - For Chinese locale: prefer zh, fall back to en if zh is empty
 * - For English locale: prefer en, fall back to zh if en is empty
 */
export function getLocalizedText(
  en: string | null | undefined,
  zh: string | null | undefined,
  locale: string,
): string {
  const isZh = locale === 'zh'
  if (isZh) {
    return (zh && zh.trim()) || (en && en.trim()) || ''
  }
  return (en && en.trim()) || (zh && zh.trim()) || ''
}

/**
 * Get the localized array with fallback.
 * - For Chinese locale: prefer zh array, fall back to en if zh is empty
 * - For English locale: prefer en array, fall back to zh if en is empty
 */
export function getLocalizedArray(
  en: string[] | null | undefined,
  zh: string[] | null | undefined,
  locale: string,
): string[] {
  const isZh = locale === 'zh'
  if (isZh) {
    return (zh && zh.length > 0) ? zh : (en || [])
  }
  return (en && en.length > 0) ? en : (zh || [])
}
