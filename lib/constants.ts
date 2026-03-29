export const CISSP_DOMAINS = [
  { value: 'SECURITY_RISK_MANAGEMENT', label: 'Security & Risk Management', weight: 16, number: 1 },
  { value: 'ASSET_SECURITY', label: 'Asset Security', weight: 10, number: 2 },
  { value: 'SECURITY_ARCHITECTURE', label: 'Security Architecture', weight: 13, number: 3 },
  { value: 'COMMUNICATION_NETWORK_SECURITY', label: 'Communication & Network Security', weight: 13, number: 4 },
  { value: 'IDENTITY_ACCESS_MANAGEMENT', label: 'Identity & Access Management', weight: 13, number: 5 },
  { value: 'SECURITY_ASSESSMENT', label: 'Security Assessment', weight: 12, number: 6 },
  { value: 'SECURITY_OPERATIONS', label: 'Security Operations', weight: 13, number: 7 },
  { value: 'SOFTWARE_DEVELOPMENT_SECURITY', label: 'Software Development Security', weight: 10, number: 8 },
] as const

/** Map domain value → number (1-8) */
export const DOMAIN_NUMBER: Record<string, number> = Object.fromEntries(
  CISSP_DOMAINS.map(d => [d.value, d.number])
)

/** Map domain value → CSS badge class suffix (first underscore-separated word, lowercase) */
export const DOMAIN_BADGE_CLASS: Record<string, string> = {
  SECURITY_RISK_MANAGEMENT: 'security',
  ASSET_SECURITY: 'asset',
  SECURITY_ARCHITECTURE: 'architecture',
  COMMUNICATION_NETWORK_SECURITY: 'network',
  IDENTITY_ACCESS_MANAGEMENT: 'identity',
  SECURITY_ASSESSMENT: 'assessment',
  SECURITY_OPERATIONS: 'operations',
  SOFTWARE_DEVELOPMENT_SECURITY: 'software',
}

export type DomainValue = typeof CISSP_DOMAINS[number]['value']

export const FLASHCARD_RATINGS = {
  AGAIN: { value: 0, label: 'Again' },
  HARD: { value: 1, label: 'Hard' },
  GOOD: { value: 2, label: 'Good' },
  EASY: { value: 3, label: 'Easy' },
} as const
