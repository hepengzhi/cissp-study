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
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn()
  },
  flashcard: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  },
  progress: {
    findMany: vi.fn(),
    upsert: vi.fn()
  },
  examAttempt: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  examAnswer: {
    createMany: vi.fn(),
    deleteMany: vi.fn()
  },
  $transaction: vi.fn((operations) => {
    if (typeof operations === 'function') {
      return operations(mockPrisma)
    }
    return Promise.all(operations)
  })
}

// Mock the prisma module (both paths)
vi.mock('@/prisma/config', () => ({
  prisma: mockPrisma
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

export { mockPrisma }
