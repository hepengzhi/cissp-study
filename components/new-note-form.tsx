'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { MarkdownEditor } from '@/components/markdown-editor'
import { createNote, type NoteDomain } from '@/lib/actions/notes'
import { useRouter } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'

export function NewNoteForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [domain, setDomain] = useState<NoteDomain | ''>('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    if (!domain) {
      setError('Please select a domain')
      setIsSaving(false)
      return
    }

    const result = await createNote({
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

    if (result && 'id' in result) {
      router.push(`/notes/${result.id}`)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/notes">
          <Button variant="ghost">← Back to Notes</Button>
        </Link>
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
                    {d.label}
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
            {isSaving ? 'Creating...' : 'Create Note'}
          </Button>
          <Link href="/notes">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
