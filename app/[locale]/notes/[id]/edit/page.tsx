import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { NoteEditor } from '@/components/note-editor'

export default async function NotePage({
  params
}: {
  params: { id: string }
}) {
  const note = await prisma.note.findUnique({
    where: { id: params.id }
  })

  if (!note) {
    notFound()
  }

  return <NoteEditor note={note} />
}
