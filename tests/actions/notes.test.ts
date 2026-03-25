import { createNote, getNotes, updateNote, deleteNote } from '@/lib/actions/notes'
import { prisma } from '@/lib/prisma'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'

describe('Notes Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Mock deleteMany to resolve successfully
    mockPrisma.note.deleteMany.mockResolvedValue({ count: 0 })
  })

  it('should create a note', async () => {
    const mockNote = {
      id: 'test-id',
      title: 'Test Note',
      content: 'Test content',
      domain: 'SECURITY_RISK_MANAGEMENT' as const,
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrisma.note.create.mockResolvedValue(mockNote)

    const note = await createNote({
      title: 'Test Note',
      content: 'Test content',
      domain: 'SECURITY_RISK_MANAGEMENT',
      tags: ['test']
    })

    expect(mockPrisma.note.create).toHaveBeenCalledWith({
      data: {
        title: 'Test Note',
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['test']
      }
    })
    expect(note.title).toBe('Test Note')
    expect(note.domain).toBe('SECURITY_RISK_MANAGEMENT')
  })

  it('should get notes filtered by domain', async () => {
    const mockNotes = [
      {
        id: '1',
        title: 'Note 1',
        content: 'Content 1',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Note 2',
        content: 'Content 2',
        domain: 'ASSET_SECURITY' as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Return only notes matching the domain filter
    mockPrisma.note.findMany.mockImplementation((args: any) => {
      const domain = args?.where?.domain
      if (domain) {
        return Promise.resolve(mockNotes.filter(n => n.domain === domain))
      }
      return Promise.resolve(mockNotes)
    })

    const notes = await getNotes({ domain: 'SECURITY_RISK_MANAGEMENT' })

    expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
      where: { domain: 'SECURITY_RISK_MANAGEMENT' },
      orderBy: { updatedAt: 'desc' }
    })
    expect(notes).toHaveLength(1)
    expect(notes[0].domain).toBe('SECURITY_RISK_MANAGEMENT')
  })
})
