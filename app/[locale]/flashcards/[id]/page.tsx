import { prisma } from '@/lib/prisma'
import { updateFlashcard, deleteFlashcard } from '@/lib/actions/flashcards'
import { redirect, notFound } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'
import { DomainBadge } from '@/components/domain-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Flashcard } from '@/components/flashcard'
import { Card as UIcard } from '@/components/ui/card'
import { SM2Quality } from '@/lib/spaced-repetition'

async function updateFlashcardAction(id: string, formData: FormData) {
  'use server'

  const result = await updateFlashcard(id, {
    front: formData.get('front') as string,
    back: formData.get('back') as string,
    domain: formData.get('domain') as any
  })

  if (result && 'error' in result) {
    throw new Error(result.error)
  }

  redirect(`/flashcards/${id}`)
}

async function deleteFlashcardAction(id: string) {
  'use server'

  const result = await deleteFlashcard(id)

  if (result && 'error' in result) {
    throw new Error(result.error)
  }

  redirect('/flashcards/manage')
}

export default async function FlashcardDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const flashcard = await prisma.flashcard.findUnique({
    where: { id }
  })

  if (!flashcard) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex gap-4">
        <Link href="/flashcards/manage">
          <Button variant="ghost">← Back to Flashcards</Button>
        </Link>
      </div>

      {/* Preview Card */}
      <UIcard className="mb-8">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Flashcard
            front={flashcard.front}
            back={flashcard.back}
            onRate={() => {}}
          />
        </CardContent>
      </UIcard>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFlashcardAction.bind(null, flashcard.id)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (Question)</Label>
              <Textarea
                id="front"
                name="front"
                defaultValue={flashcard.front}
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
                defaultValue={flashcard.back}
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
                defaultValue={flashcard.domain}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                {CISSP_DOMAINS.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.number}. {domain.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Save Changes</Button>
              <Link href="/flashcards/manage">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <form action={deleteFlashcardAction.bind(null, flashcard.id)} className="ml-auto">
                <Button type="submit" variant="destructive">Delete Flashcard</Button>
              </form>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Flashcard Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <div className="flex items-center gap-1.5">
                <DomainBadge domain={flashcard.domain} />
                <Badge>{flashcard.domain.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Repetitions</p>
              <p className="font-semibold">{flashcard.repetitions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ease Factor</p>
              <p className="font-semibold">{flashcard.easeFactor.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interval</p>
              <p className="font-semibold">{flashcard.interval} days</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Next Review</p>
              <p className="font-semibold">{new Date(flashcard.nextReview).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold">{new Date(flashcard.createdAt).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-semibold">{new Date(flashcard.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
