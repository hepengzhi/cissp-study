'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { getDueCards, rateFlashcard } from '@/lib/actions/flashcards'
import { Flashcard } from '@/components/flashcard'
import { DomainFilter } from '@/components/domain-filter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { FlashcardDomain } from '@/lib/actions/flashcards'

interface FlashcardData {
  id: string
  front: string
  back: string
  domain: string
  nextReview: Date
  interval: number
  easeFactor: number
  repetitions: number
  createdAt: Date
  updatedAt: Date
}

function FlashcardsContent() {
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain') || 'all'

  const [cards, setCards] = useState<FlashcardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    const domainFilter = domain === 'all' ? undefined : domain as FlashcardDomain
    const result = await getDueCards(domainFilter)

    if (result && 'error' in result) {
      setError(result.error)
    } else {
      setCards(Array.isArray(result) ? result : [])
      setCurrentIndex(0)
    }
    setLoading(false)
  }, [domain])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const handleRate = async (quality: number) => {
    if (currentIndex >= cards.length) return

    const card = cards[currentIndex]
    const result = await rateFlashcard(card.id, quality as any)

    if (result && 'error' in result) {
      setError(result.error)
      return
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // All cards reviewed
      setCards([])
      setCurrentIndex(0)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Study Flashcards</h1>
          <DomainFilter value={domain} />
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-xl mb-4">All caught up!</p>
            <p className="text-muted-foreground mb-6">You have no flashcards due for review.</p>
            <Link href="/flashcards/manage">
              <Button>Browse Flashcards</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Flashcards</h1>
          <p className="text-muted-foreground">
            Card {currentIndex + 1} of {cards.length} due
          </p>
        </div>
        <DomainFilter value={domain} />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6 pb-12">
          <Flashcard
            front={cards[currentIndex].front}
            back={cards[currentIndex].back}
            onRate={handleRate}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8"><p className="text-center text-muted-foreground">Loading...</p></div>}>
      <FlashcardsContent />
    </Suspense>
  )
}

export default FlashcardsPage
