import { prisma } from '@/lib/prisma'
import { DomainFilter } from '@/components/domain-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { FlashcardDomain } from '@/lib/actions/flashcards'

export default async function FlashcardsManagePage({
  searchParams
}: {
  searchParams: { domain?: string }
}) {
  const domain = searchParams.domain || 'all'
  const domainFilter = domain === 'all' ? undefined : domain as FlashcardDomain
  const flashcards = await prisma.flashcard.findMany({
    where: domainFilter ? { domain: domainFilter } : undefined,
    orderBy: { createdAt: 'desc' }
  })

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
        {flashcards.map((flashcard) => (
          <Link key={flashcard.id} href={`/flashcards/${flashcard.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <p className="text-lg line-clamp-4 mb-4">{flashcard.front}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{flashcard.domain.replace(/_/g, ' ')}</Badge>
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

        {flashcards.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No flashcards found. Create your first flashcard to get started!
          </div>
        )}
      </div>
    </div>
  )
}
