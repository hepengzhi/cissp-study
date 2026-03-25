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

export async function createNote(data: z.infer<typeof NoteSchema>) {
  const validated = NoteSchema.parse(data)

  return await prisma.note.create({
    data: validated
  })
}

export async function getNotes(filters?: { domain?: string }) {
  return await prisma.note.findMany({
    where: filters?.domain ? { domain: filters.domain } : undefined,
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getNote(id: string) {
  return await prisma.note.findUnique({
    where: { id }
  })
}

export async function updateNote(id: string, data: z.infer<typeof NoteSchema>) {
  const validated = NoteSchema.parse(data)

  return await prisma.note.update({
    where: { id },
    data: validated
  })
}

export async function deleteNote(id: string) {
  return await prisma.note.delete({
    where: { id }
  })
}
