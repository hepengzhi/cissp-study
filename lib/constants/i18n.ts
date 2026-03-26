import type { SupportedLocale } from '@/lib/types/i18n'
import { Domain } from '@prisma/client'

/**
 * Bilingual domain labels
 */
export const DOMAIN_LABELS: Record<Domain, Record<SupportedLocale, string>> = {
  [Domain.SECURITY_RISK_MANAGEMENT]: {
    en: 'Security & Risk Management',
    zh: '安全与风险管理'
  },
  [Domain.ASSET_SECURITY]: {
    en: 'Asset Security',
    zh: '资产安全'
  },
  [Domain.SECURITY_ARCHITECTURE]: {
    en: 'Security Architecture',
    zh: '安全架构'
  },
  [Domain.COMMUNICATION_NETWORK_SECURITY]: {
    en: 'Communication & Network Security',
    zh: '通信与网络安全'
  },
  [Domain.IDENTITY_ACCESS_MANAGEMENT]: {
    en: 'Identity & Access Management',
    zh: '身份与访问管理'
  },
  [Domain.SECURITY_ASSESSMENT]: {
    en: 'Security Assessment',
    zh: '安全评估'
  },
  [Domain.SECURITY_OPERATIONS]: {
    en: 'Security Operations',
    zh: '安全运营'
  },
  [Domain.SOFTWARE_DEVELOPMENT_SECURITY]: {
    en: 'Software Development Security',
    zh: '软件开发安全'
  }
}

/**
 * Get domain label for specific locale
 */
export function getDomainLabel(domain: Domain, locale: SupportedLocale): string {
  return DOMAIN_LABELS[domain][locale] || DOMAIN_LABELS[domain].en
}

/**
 * Get all domains with localized labels
 */
export function getLocalizedDomains(locale: SupportedLocale) {
  const weights: Record<string, number> = {
    [Domain.SECURITY_RISK_MANAGEMENT]: 16,
    [Domain.ASSET_SECURITY]: 10,
    [Domain.SECURITY_ARCHITECTURE]: 13,
    [Domain.COMMUNICATION_NETWORK_SECURITY]: 13,
    [Domain.IDENTITY_ACCESS_MANAGEMENT]: 13,
    [Domain.SECURITY_ASSESSMENT]: 12,
    [Domain.SECURITY_OPERATIONS]: 13,
    [Domain.SOFTWARE_DEVELOPMENT_SECURITY]: 10
  }

  return Object.entries(DOMAIN_LABELS).map(([domain, labels]) => ({
    value: domain,
    label: labels[locale] || labels.en,
    weight: weights[domain] || 0
  }))
}

/**
 * Difficulty labels (bilingual)
 */
export const DIFFICULTY_LABELS: Record<string, Record<SupportedLocale, string>> = {
  EASY: { en: 'Easy', zh: '简单' },
  MEDIUM: { en: 'Medium', zh: '中等' },
  HARD: { en: 'Hard', zh: '困难' }
}

/**
 * Get difficulty label for specific locale
 */
export function getDifficultyLabel(difficulty: string, locale: SupportedLocale): string {
  return DIFFICULTY_LABELS[difficulty]?.[locale] || DIFFICULTY_LABELS[difficulty]?.en || difficulty
}
