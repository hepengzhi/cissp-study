'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const NoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  domain: z.enum([
    'SECURITY_RISK_MANAGEMENT',
    'ASSET_SECURITY',
    'SECURITY_ARCHITECTURE',
    'COMMUNICATION_NETWORK_SECURITY',
    'IDENTITY_ACCESS_MANAGEMENT',
    'SECURITY_ASSESSMENT',
    'SECURITY_OPERATIONS',
    'SOFTWARE_DEVELOPMENT_SECURITY'
  ]),
  tags: z.array(z.string()).default([])
})

export type NoteDomain = z.infer<typeof NoteSchema>['domain']

export async function createNote(data: z.infer<typeof NoteSchema>) {
  try {
    const validated = NoteSchema.parse(data)

    return await prisma.note.create({
      data: validated
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
        return `${path}: ${e.message}`
      }).join(', ')
      return { error: 'Validation failed: ' + errorMessages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function getNotes(filters?: { domain?: NoteDomain }) {
  try {
    return await prisma.note.findMany({
      where: filters?.domain ? { domain: filters.domain } : undefined,
      orderBy: { updatedAt: 'desc' }
    })
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function getNote(id: string) {
  try {
    return await prisma.note.findUnique({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function updateNote(id: string, data: z.infer<typeof NoteSchema>) {
  try {
    const validated = NoteSchema.parse(data)

    return await prisma.note.update({
      where: { id },
      data: validated
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
        return `${path}: ${e.message}`
      }).join(', ')
      return { error: 'Validation failed: ' + errorMessages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

export async function deleteNote(id: string) {
  try {
    return await prisma.note.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
