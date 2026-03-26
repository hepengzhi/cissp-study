'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getDueCards, rateFlashcard } from '@/lib/actions/flashcards'
import { Flashcard } from '@/components/flashcard'
import { DomainFilter } from '@/components/domain-filter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Brain, CheckCircle, XCircle, RotateCcw, ChevronRight } from 'lucide-react'
import type { FlashcardDomain } from '@/lib/actions/flashcards'

interface FlashcardData {
  id: string
  front: string
  frontZh?: string | null
  back: string
  backZh?: string | null
  domain: string
  nextReview: Date
  interval: number
  easeFactor: number
  repetitions: number
  createdAt: Date
  updatedAt: Date
}

function FlashcardsContent() {
  const locale = useLocale()
  const tFlashcards = useTranslations('flashcards')
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain') || 'all'

  const [cards, setCards] = useState<FlashcardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ reviewed: 0, total: 0 })
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    const domainFilter = domain === 'all' ? undefined : domain as FlashcardDomain
    const result = await getDueCards(domainFilter)

    if (result && 'error' in result) {
      setError(result.error)
    } else {
      const cardsArray = Array.isArray(result) ? result : []
      setCards(cardsArray)
      setCurrentIndex(0)
      setStats({ reviewed: 0, total: cardsArray.length })
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

    setStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }))

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCards([])
      setCurrentIndex(0)
    }
  }

  // Get localized content for current card
  const getCurrentCardLocalized = () => {
    if (currentIndex >= cards.length) return null
    const card = cards[currentIndex]
    return {
      front: locale === 'zh' && card.frontZh ? card.frontZh : card.front,
      back: locale === 'zh' && card.backZh ? card.backZh : card.back
    }
  }

  const currentCardLocalized = getCurrentCardLocalized()

  if (loading) {
    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-2 border-[#9fef00] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#718096]">Loading flashcards...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8">
          <div className="htb-card p-6 max-w-md mx-auto text-center">
            <XCircle className="h-12 w-12 text-[#f85149] mx-auto mb-4" />
            <p className="text-[#f85149]">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-[#9fef00]" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{tFlashcards('title')}</h1>
                  <p className="text-[#718096] text-sm">{tFlashcards('description')}</p>
                </div>
              </div>
              <Link href={`/${locale}/flashcards/manage`}>
                <Button className="htb-button-outline text-sm">
                  Manage Cards
                </Button>
              </Link>
            </div>
            <DomainFilter value={domain} />
          </div>

          <div className="htb-card p-12 text-center max-w-lg mx-auto">
            {stats.reviewed > 0 ? (
              <>
                <CheckCircle className="h-16 w-16 text-[#9fef00] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
                <p className="text-[#718096] mb-6">
                  You reviewed {stats.reviewed} card{stats.reviewed !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={loadCards} variant="outline" className="htb-button-outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Review Again
                  </Button>
                  <Link href={`/${locale}/flashcards/manage`}>
                    <Button className="htb-button">
                      Manage Cards
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Brain className="h-16 w-16 text-[#3d4451] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
                <p className="text-[#718096] mb-6">
                  No flashcards due for review right now
                </p>
                <Link href={`/${locale}/flashcards/manage`}>
                  <Button className="htb-button">
                    Browse All Cards
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen hex-bg mesh-gradient">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-[#9fef00]" />
              <h1 className="text-3xl font-bold text-white">{tFlashcards('title')}</h1>
            </div>
            <p className="text-[#a0aec0]">
              {tFlashcards('cardOf', { current: currentIndex + 1, total: cards.length })}
            </p>
          </div>
          <DomainFilter value={domain} />
        </div>

        {/* Progress Bar */}
        <div className="htb-progress max-w-2xl mx-auto">
          <div
            className="htb-progress-bar"
            style={{ width: `${((stats.reviewed + 1) / stats.total) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="max-w-2xl mx-auto">
          {currentCardLocalized && (
            <div className="htb-card p-8">
              <Flashcard
                front={currentCardLocalized.front}
                back={currentCardLocalized.back}
                onRate={handleRate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FlashcardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen hex-bg mesh-gradient">
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-2 border-[#9fef00] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#718096]">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <FlashcardsContent />
    </Suspense>
  )
}

export default FlashcardsPage
