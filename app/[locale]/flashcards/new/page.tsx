import { createFlashcard } from '@/lib/actions/flashcards'
import { redirect } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

async function createFlashcardAction(formData: FormData) {
  'use server'

  const flashcard = await createFlashcard({
    front: formData.get('front') as string,
    back: formData.get('back') as string,
    domain: formData.get('domain') as any
  })

  if (flashcard && 'error' in flashcard) {
    throw new Error(flashcard.error)
  }

  redirect('/flashcards/manage')
}

export default function NewFlashcardPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/flashcards/manage">
          <Button variant="ghost">← Back to Flashcards</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFlashcardAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (Question)</Label>
              <Textarea
                id="front"
                name="front"
                placeholder="Enter the question or term..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="back">Back (Answer)</Label>
              <Textarea
                id="back"
                name="back"
                placeholder="Enter the answer or definition..."
                rows={6}
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

            <div className="flex gap-4 pt-4">
              <Button type="submit">Create Flashcard</Button>
              <Link href="/flashcards/manage">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
