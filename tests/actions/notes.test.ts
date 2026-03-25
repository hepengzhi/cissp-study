import { createNote, getNotes, getNote, updateNote, deleteNote } from '@/lib/actions/notes'
import { prisma } from '@/lib/prisma'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'

describe('Notes Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Mock deleteMany to resolve successfully
    mockPrisma.note.deleteMany.mockResolvedValue({ count: 0 })
  })

  describe('createNote', () => {
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

    it('should return validation error for invalid data', async () => {
      const result = await createNote({
        title: '', // Invalid: empty title
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['test']
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('title')
    })

    it('should return database error on failure', async () => {
      mockPrisma.note.create.mockRejectedValue(new Error('Database connection failed'))

      const result = await createNote({
        title: 'Test Note',
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['test']
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('getNotes', () => {
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
        }
      ]

      mockPrisma.note.findMany.mockResolvedValue(mockNotes)

      const notes = await getNotes({ domain: 'SECURITY_RISK_MANAGEMENT' })

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { domain: 'SECURITY_RISK_MANAGEMENT' },
        orderBy: { updatedAt: 'desc' }
      })
      expect(notes).toHaveLength(1)
      expect(notes[0].domain).toBe('SECURITY_RISK_MANAGEMENT')
    })

    it('should get all notes without filter', async () => {
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

      mockPrisma.note.findMany.mockResolvedValue(mockNotes)

      const notes = await getNotes()

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { updatedAt: 'desc' }
      })
      expect(notes).toHaveLength(2)
    })

    it('should return error on database failure', async () => {
      mockPrisma.note.findMany.mockRejectedValue(new Error('Database error'))

      const result = await getNotes()

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database error')
    })
  })

  describe('getNote', () => {
    it('should get a note by id', async () => {
      const mockNote = {
        id: 'test-id',
        title: 'Test Note',
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.note.findUnique.mockResolvedValue(mockNote)

      const note = await getNote('test-id')

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
      expect(note?.id).toBe('test-id')
      expect(note?.title).toBe('Test Note')
    })

    it('should return null for non-existent note', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null)

      const note = await getNote('non-existent-id')

      expect(note).toBeNull()
    })

    it('should return error on database failure', async () => {
      mockPrisma.note.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await getNote('test-id')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database error')
    })
  })

  describe('updateNote', () => {
    it('should update a note', async () => {
      const mockUpdatedNote = {
        id: 'test-id',
        title: 'Updated Note',
        content: 'Updated content',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        tags: ['updated'],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.note.update.mockResolvedValue(mockUpdatedNote)

      const note = await updateNote('test-id', {
        title: 'Updated Note',
        content: 'Updated content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['updated']
      })

      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          title: 'Updated Note',
          content: 'Updated content',
          domain: 'SECURITY_RISK_MANAGEMENT',
          tags: ['updated']
        }
      })
      expect(note.title).toBe('Updated Note')
      expect(note.tags).toEqual(['updated'])
    })

    it('should return validation error for invalid data', async () => {
      const result = await updateNote('test-id', {
        title: '', // Invalid: empty title
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['test']
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('title')
    })

    it('should return database error on failure', async () => {
      mockPrisma.note.update.mockRejectedValue(new Error('Note not found'))

      const result = await updateNote('non-existent-id', {
        title: 'Updated Note',
        content: 'Updated content',
        domain: 'SECURITY_RISK_MANAGEMENT',
        tags: ['test']
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Note not found')
    })
  })

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      const mockDeletedNote = {
        id: 'test-id',
        title: 'Test Note',
        content: 'Test content',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.note.delete.mockResolvedValue(mockDeletedNote)

      const note = await deleteNote('test-id')

      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
      expect(note.id).toBe('test-id')
    })

    it('should return database error on failure', async () => {
      mockPrisma.note.delete.mockRejectedValue(new Error('Note not found'))

      const result = await deleteNote('non-existent-id')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Note not found')
    })
  })
})
