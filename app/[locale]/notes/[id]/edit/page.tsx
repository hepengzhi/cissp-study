import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { NoteEditor } from '@/components/note-editor'

export default async function NotePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const note = await prisma.note.findUnique({
    where: { id }
  })

  if (!note) {
    notFound()
  }

  return <NoteEditor note={note} />
}
