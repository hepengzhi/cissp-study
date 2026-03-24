export const CISSP_DOMAINS = [
  { value: 'SECURITY_RISK_MANAGEMENT', label: 'Security & Risk Management', weight: 16 },
  { value: 'ASSET_SECURITY', label: 'Asset Security', weight: 10 },
  { value: 'SECURITY_ARCHITECTURE', label: 'Security Architecture', weight: 13 },
  { value: 'COMMUNICATION_NETWORK_SECURITY', label: 'Communication & Network Security', weight: 13 },
  { value: 'IDENTITY_ACCESS_MANAGEMENT', label: 'Identity & Access Management', weight: 13 },
  { value: 'SECURITY_ASSESSMENT', label: 'Security Assessment', weight: 12 },
  { value: 'SECURITY_OPERATIONS', label: 'Security Operations', weight: 13 },
  { value: 'SOFTWARE_DEVELOPMENT_SECURITY', label: 'Software Development Security', weight: 10 },
] as const

export type DomainValue = typeof CISSP_DOMAINS[number]['value']

export const FLASHCARD_RATINGS = {
  AGAIN: { value: 0, label: 'Again' },
  HARD: { value: 1, label: 'Hard' },
  GOOD: { value: 2, label: 'Good' },
  EASY: { value: 3, label: 'Easy' },
} as const
