import { prisma } from '@/lib/prisma'
import { updateNote, deleteNote } from '@/lib/actions/notes'
import { redirect, notFound } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

async function updateNoteAction(id: string, formData: FormData) {
  'use server'

  const result = await updateNote(id, {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    domain: formData.get('domain') as any,
    tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean)
  })

  if (result && 'error' in result) {
    throw new Error(result.error)
  }

  redirect(`/notes/${id}`)
}

async function deleteNoteAction(id: string) {
  'use server'

  const result = await deleteNote(id)

  if (result && 'error' in result) {
    throw new Error(result.error)
  }

  redirect('/notes')
}

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

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex gap-4">
        <Link href="/notes">
          <Button variant="ghost">← Back to Notes</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNoteAction.bind(null, note.id)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={note.title}
                placeholder="Enter note title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <select
                id="domain"
                name="domain"
                defaultValue={note.domain}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                <option value="">Select a domain...</option>
                {CISSP_DOMAINS.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={note.content}
                placeholder="Enter note content..."
                rows={12}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={note.tags.join(', ')}
                placeholder="e.g., encryption, access-control, risk"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Save Changes</Button>
              <Link href="/notes">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <form action={deleteNoteAction.bind(null, note.id)} className="ml-auto">
                <Button type="submit" variant="destructive">Delete Note</Button>
              </form>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{note.domain.replace(/_/g, ' ')}</Badge>
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary">#{tag}</Badge>
            ))}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {note.content}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Created: {new Date(note.createdAt).toLocaleString()}<br />
            Updated: {new Date(note.updatedAt).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
