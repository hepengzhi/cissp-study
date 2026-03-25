import { prisma } from '@/lib/prisma'
import { DomainFilter } from '@/components/domain-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { NoteDomain } from '@/lib/actions/notes'

export default async function NotesPage({
  searchParams
}: {
  searchParams: { domain?: string }
}) {
  const domain = searchParams.domain || 'all'
  const notes = await prisma.note.findMany({
    where: domain && domain !== 'all' ? { domain: domain as NoteDomain } : undefined,
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Study Notes</h1>
        <div className="flex gap-4 items-center">
          <DomainFilter value={domain} />
          <Link href="/notes/new">
            <Button>Create Note</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="line-clamp-2">{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content.substring(0, 200)}...
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {note.domain.replace(/_/g, ' ')}
                  </span>
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Updated: {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {notes.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No notes found. Create your first note to get started!
          </div>
        )}
      </div>
    </div>
  )
}
