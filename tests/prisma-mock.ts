import { beforeEach, vi } from 'vitest'

// Create mock Prisma functions
const mockPrisma = {
  note: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  question: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  flashcard: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  progress: {
    findMany: vi.fn(),
    upsert: vi.fn()
  },
  examAttempt: {
    create: vi.fn()
  }
}

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

export { mockPrisma }
