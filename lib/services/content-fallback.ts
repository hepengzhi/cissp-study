import type { SupportedLocale } from '@/lib/types/i18n'

/**
 * Content Fallback Service
 * Handles bilingual content retrieval with automatic fallback to English
 */
export class ContentFallbackService {
  /**
   * Get localized field value with automatic fallback
   * @param entity - Database record
   * @param field - Base field name (e.g., 'questionText')
   * @param locale - Target locale
   * @returns Localized value (zh if available, else en)
   */
  static getField<T extends Record<string, any>>(
    entity: T,
    field: string,
    locale: SupportedLocale
  ): string {
    if (locale === 'en') {
      return entity[field] || ''
    }

    const zhField = `${field}Zh`
    const zhValue = entity[zhField]

    // Return Chinese if available, else fallback to English
    return zhValue || entity[field] || ''
  }

  /**
   * Get localized array field with fallback
   * @param entity - Database record
   * @param field - Base field name (e.g., 'options')
   * @param locale - Target locale
   * @returns Localized array
   */
  static getArrayField<T extends Record<string, any>>(
    entity: T,
    field: string,
    locale: SupportedLocale
  ): string[] {
    if (locale === 'en') {
      return entity[field] || []
    }

    const zhField = `${field}Zh`
    const zhValue = entity[zhField]

    // Return Chinese array if available and non-empty, else fallback to English
    return (Array.isArray(zhValue) && zhValue.length > 0) ? zhValue : (entity[field] || [])
  }

  /**
   * Process database record with bilingual fields
   * Automatically replaces English fields with Chinese if available
   * @param locale - Target locale
   * @param record - Database record
   * @param fields - Array of field names to localize
   * @returns Processed record with locale-specific content
   */
  static processRecord<T extends Record<string, any>>(
    locale: SupportedLocale,
    record: T,
    fields: string[]
  ): T {
    if (locale === 'en') {
      return record
    }

    const processed: Record<string, any> = { ...record }

    for (const field of fields) {
      processed[field] = this.getField(record, field, locale)
    }

    return processed as T
  }

  /**
   * Process array fields in a record
   * @param locale - Target locale
   * @param record - Database record
   * @param arrayFields - Array of array field names to localize
   * @returns Processed record with localized arrays
   */
  static processArrayFields<T extends Record<string, any>>(
    locale: SupportedLocale,
    record: T,
    arrayFields: string[]
  ): T {
    if (locale === 'en') {
      return record
    }

    const processed: Record<string, any> = { ...record }

    for (const field of arrayFields) {
      processed[field] = this.getArrayField(record, field, locale)
    }

    return processed as T
  }

  /**
   * Process a Question record with all its bilingual fields
   * @param locale - Target locale
   * @param question - Question record from database
   * @returns Localized question
   */
  static processQuestion<T extends Record<string, any>>(
    locale: SupportedLocale,
    question: T
  ): T {
    const textFields = ['questionText', 'explanation']
    const arrayFields = ['options']

    let processed = this.processRecord(locale, question, textFields)
    processed = this.processArrayFields(locale, processed, arrayFields)

    return processed
  }

  /**
   * Process a Note record with all its bilingual fields
   * @param locale - Target locale
   * @param note - Note record from database
   * @returns Localized note
   */
  static processNote<T extends Record<string, any>>(
    locale: SupportedLocale,
    note: T
  ): T {
    const textFields = ['title', 'content']

    return this.processRecord(locale, note, textFields)
  }

  /**
   * Process a Flashcard record with all its bilingual fields
   * @param locale - Target locale
   * @param flashcard - Flashcard record from database
   * @returns Localized flashcard
   */
  static processFlashcard<T extends Record<string, any>>(
    locale: SupportedLocale,
    flashcard: T
  ): T {
    const textFields = ['front', 'back']

    return this.processRecord(locale, flashcard, textFields)
  }
}
