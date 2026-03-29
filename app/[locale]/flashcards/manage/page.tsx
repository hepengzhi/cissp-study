import { getAllFlashcards } from '@/lib/actions/flashcards'
import { DomainFilter } from '@/components/domain-filter'
import { DomainBadge } from '@/components/domain-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { FlashcardDomain } from '@/lib/actions/flashcards'

export default async function FlashcardsManagePage({
  searchParams
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const { domain: domainParam } = await searchParams
  const domain = domainParam || 'all'
  const domainFilter = domain === 'all' ? undefined : domain as FlashcardDomain
  const flashcardsResult = await getAllFlashcards(domainFilter)

  if ('error' in flashcardsResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading flashcards: {flashcardsResult.error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Flashcards</h1>
        <div className="flex gap-4 items-center">
          <DomainFilter value={domain} />
          <Link href="/flashcards/new">
            <Button>Create Flashcard</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flashcardsResult.map((flashcard) => (
          <Link key={flashcard.id} href={`/flashcards/${flashcard.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <p className="text-lg line-clamp-4 mb-4">{flashcard.front}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <DomainBadge domain={flashcard.domain} />
                    <Badge>{flashcard.domain.replace(/_/g, ' ')}</Badge>
                  </div>
                  {flashcard.repetitions > 0 && (
                    <Badge variant="secondary">
                      {flashcard.repetitions} reviews
                    </Badge>
                  )}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Due: {new Date(flashcard.nextReview).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {flashcardsResult.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No flashcards found. Create your first flashcard to get started!
          </div>
        )}
      </div>
    </div>
  )
}
