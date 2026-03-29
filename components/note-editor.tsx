'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { MarkdownEditor } from '@/components/markdown-editor'
import { updateNote, deleteNote, type NoteDomain } from '@/lib/actions/notes'
import { useRouter } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'
import { DomainBadge } from '@/components/domain-badge'

interface Note {
  id: string
  title: string
  content: string
  domain: NoteDomain
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface NoteEditorProps {
  note: Note
}

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [domain, setDomain] = useState<NoteDomain>(note.domain)
  const [tags, setTags] = useState(note.tags.join(', '))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const result = await updateNote(note.id, {
      title,
      content,
      domain,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })

    setIsSaving(false)

    if (result && 'error' in result) {
      setError(result.error)
      return
    }

    // Stay on edit page to continue editing
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    const result = await deleteNote(note.id)
    if (result && 'error' in result) {
      setError(result.error)
      return
    }

    router.push('/notes')
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/notes">
          <Button variant="ghost">← Back to Notes</Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(note.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <select
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value as NoteDomain)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                <option value="">Select a domain...</option>
                {CISSP_DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.number}. {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., encryption, access-control, risk"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Write your note content in Markdown..."
              minHeight="500px"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/notes">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="ml-auto"
          >
            Delete Note
          </Button>
        </div>
      </form>
    </div>
  )
}
