'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FLASHCARD_RATINGS } from '@/lib/constants'
import { RotateCw } from 'lucide-react'

interface FlashcardProps {
  front: string
  back: string
  onRate: (rating: number) => void
}

export function Flashcard({ front, back, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full max-w-2xl h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden flex items-center justify-center p-8">
            <p className="text-xl text-center">{front}</p>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center p-8">
            <p className="text-xl text-center">{back}</p>
          </div>
        </Card>
      </div>

      {isFlipped && (
        <div className="flex gap-4">
          {Object.values(FLASHCARD_RATINGS).map((rating) => (
            <Button
              key={rating.value}
              variant={rating.value === 0 ? 'destructive' : rating.value === 3 ? 'default' : 'outline'}
              onClick={() => onRate(rating.value)}
            >
              {rating.label}
            </Button>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsFlipped(false)}
        className="self-center"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  )
}
