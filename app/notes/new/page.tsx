import { createNote } from '@/lib/actions/notes'
import { redirect } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

async function createNoteAction(formData: FormData) {
  'use server'

  const note = await createNote({
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    domain: formData.get('domain') as any,
    tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean)
  })

  if (note && 'error' in note) {
    throw new Error(note.error)
  }

  redirect(`/notes/${note.id}`)
}

export default function NewNotePage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/notes">
          <Button variant="ghost">← Back to Notes</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNoteAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter note title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <select
                id="domain"
                name="domain"
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
                placeholder="e.g., encryption, access-control, risk"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Create Note</Button>
              <Link href="/notes">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
