# CISSP Study Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack CISSP study platform with notes, flashcards (spaced repetition), quizzes, and exam simulation using Next.js 14, Prisma, and Vercel Postgres.

**Architecture:** Monolithic Next.js App Router with Server Actions for mutations, Prisma ORM for type-safe database access, shadcn/ui for accessible UI components, deployed to Vercel with Vercel Postgres database.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL (Vercel Postgres), Zod for validation

---

## File Structure

```
cissp-study/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Dashboard
│   ├── notes/
│   │   ├── page.tsx                  # Notes list
│   │   ├── new/page.tsx              # Create note
│   │   └── [id]/page.tsx             # Edit/view note
│   ├── flashcards/
│   │   └── page.tsx                  # Flashcard study
│   ├── quiz/
│   │   └── page.tsx                  # Quiz mode
│   └── exam/
│       └── page.tsx                  # Exam simulation
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── domain-filter.tsx             # Domain selector component
│   ├── question-card.tsx             # Question display component
│   ├── progress-chart.tsx            # Progress visualization
│   ├── timer.tsx                     # Countdown timer
│   ├── stat-card.tsx                 # Dashboard stat card
│   └── flashcard.tsx                 # Individual flashcard with flip
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── spaced-repetition.ts          # SM-2 algorithm
│   ├── utils.ts                      # Utilities (cn, etc.)
│   └── actions/                      # Server actions
│       ├── notes.ts                  # Note CRUD
│       ├── flashcards.ts             # Flashcard operations
│       ├── quiz.ts                   # Quiz operations
│       └── exam.ts                   # Exam operations
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Seed data
├── tests/
│   ├── lib/
│   │   └── spaced-repetition.test.ts # SM-2 algorithm tests
│   └── e2e/                          # Playwright E2E tests
└── public/                           # Static assets
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.env.example`

### Step 1: Initialize Next.js project

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Expected: Project scaffolded with Next.js 14

### Step 2: Install dependencies

```bash
npm install prisma @prisma/client zod react-hook-form @hookform/resolvers date-fns recharts
npm install -D @playwright/test
npm install -D prisma
```

Expected: Dependencies installed

### Step 3: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init -y
```

Expected: shadcn/ui configured with components.json

### Step 4: Add essential shadcn components

```bash
npx shadcn-ui@latest add button card input textarea select tabs badge progress alert dialog form
```

Expected: UI components added to components/ui/

### Step 5: Create environment file template

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cissp_study?schema=public"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 6: Commit

```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: Database Schema and Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/constants.ts` (CISSP domains)
- Create: `prisma/seed.ts`

### Step 1: Write database schema test

Create `tests/lib/prisma.test.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

describe('Database Schema', () => {
  let prisma: PrismaClient

  beforeAll(() => {
    prisma = new PrismaClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should create a question with all fields', async () => {
    const question = await prisma.question.create({
      data: {
        questionText: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Test explanation',
        domain: 'SECURITY_RISK_MANAGEMENT',
        difficulty: 'EASY',
        tags: ['test']
      }
    })

    expect(question.questionText).toBe('Test question')
    expect(question.options).toHaveLength(4)
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/lib/prisma.test.ts
```

Expected: FAIL - schema doesn't exist

### Step 3: Create Prisma schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Question {
  id            String   @id @default(cuid())
  questionText  String
  options       String[]
  correctAnswer Int
  explanation   String
  domain        Domain
  difficulty    Difficulty
  tags          String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  progress      Progress[]
  examAnswers   ExamAnswer[]
}

model Note {
  id        String   @id @default(cuid())
  title     String
  content   String
  domain    Domain
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Flashcard {
  id          String   @id @default(cuid())
  front       String
  back        String
  domain      Domain
  nextReview  DateTime @default(now())
  interval    Int      @default(0)
  easeFactor  Float    @default(2.5)
  repetitions Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Progress {
  id                String   @id @default(cuid())
  domain            Domain   @unique
  questionsAnswered Int      @default(0)
  correctCount      Int      @default(0)
  lastStudied       DateTime @default(now())
}

model ExamAttempt {
  id          String      @id @default(cuid())
  startedAt   DateTime    @default(now())
  completedAt DateTime?
  score       Int?
  timeSpent   Int?
  answers     ExamAnswer[]
}

model ExamAnswer {
  id            String      @id @default(cuid())
  attemptId     String
  questionId    String
  selectedAnswer Int
  isCorrect     Boolean
  attempt       ExamAttempt @relation(fields: [attemptId], references: [id])
  question      Question    @relation(fields: [questionId], references: [id])
}

enum Domain {
  SECURITY_RISK_MANAGEMENT
  ASSET_SECURITY
  SECURITY_ARCHITECTURE
  COMMUNICATION_NETWORK_SECURITY
  IDENTITY_ACCESS_MANAGEMENT
  SECURITY_ASSESSMENT
  SECURITY_OPERATIONS
  SOFTWARE_DEVELOPMENT_SECURITY
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

### Step 4: Create Prisma client singleton

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 5: Create domain constants

Create `lib/constants.ts`:

```typescript
export const CISSP_DOMAINS = [
  { value: 'SECURITY_RISK_MANAGEMENT', label: 'Security & Risk Management', weight: 16 },
  { value: 'ASSET_SECURITY', label: 'Asset Security', weight: 10 },
  { value: 'SECURITY_ARCHITECTURE', label: 'Security Architecture', weight: 13 },
  { value: 'COMMUNICATION_NETWORK_SECURITY', label: 'Communication & Network Security', weight: 13 },
  { value: 'IDENTITY_ACCESS_MANAGEMENT', label: 'Identity & Access Management', weight: 13 },
  { value: 'SECURITY_ASSESSMENT', label: 'Security Assessment', weight: 12 },
  { value: 'SECURITY_OPERATIONS', label: 'Security Operations', weight: 13 },
  { value: 'SOFTWARE_DEVELOPMENT_SECURITY', label: 'Software Development Security', weight: 10 },
] as const

export type DomainValue = typeof CISSP_DOMAINS[number]['value']

export const FLASHCARD_RATINGS = {
  AGAIN: { value: 0, label: 'Again', intervalMinutes: 0 },
  HARD: { value: 1, label: 'Hard', intervalDays: 2 },
  GOOD: { value: 2, label: 'Good', intervalDays: 4 },
  EASY: { value: 3, label: 'Easy', intervalDays: 7 },
} as const
```

### Step 6: Run migrations

```bash
npx prisma generate
npx prisma db push
```

Expected: Database schema created

### Step 7: Run test to verify it passes

```bash
npm test -- tests/lib/prisma.test.ts
```

Expected: PASS

### Step 8: Commit

```bash
git add .
git commit -m "feat: set up Prisma schema and database models"
```

---

## Task 3: Spaced Repetition Algorithm

**Files:**
- Create: `lib/spaced-repetition.ts`
- Create: `tests/lib/spaced-repetition.test.ts`

### Step 1: Write failing tests for SM-2 algorithm

Create `tests/lib/spaced-repetition.test.ts`:

```typescript
import { calculateNextReview, SM2Quality } from '@/lib/spaced-repetition'

describe('SM-2 Spaced Repetition Algorithm', () => {
  describe('calculateNextReview', () => {
    it('should set interval to 1 day for first correct review', () => {
      const result = calculateNextReview({
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        quality: SM2Quality.GOOD
      })

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.easeFactor).toBeCloseTo(2.5, 1)
    })

    it('should set interval to 6 days for second correct review', () => {
      const result = calculateNextReview({
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        quality: SM2Quality.GOOD
      })

      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('should decrease ease factor for poor response', () => {
      const result = calculateNextReview({
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        quality: SM2Quality.HARD
      })

      expect(result.easeFactor).toBeLessThan(2.5)
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('should reset repetitions for "Again" rating', () => {
      const result = calculateNextReview({
        easeFactor: 2.5,
        interval: 6,
        repetitions: 5,
        quality: SM2Quality.AGAIN
      })

      expect(result.repetitions).toBe(0)
      expect(result.interval).toBe(0)
    })

    it('should calculate next review date correctly', () => {
      const baseDate = new Date('2026-03-24T00:00:00Z')
      const result = calculateNextReview({
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        quality: SM2Quality.GOOD
      }, baseDate)

      expect(result.nextReview).toEqual(new Date('2026-03-25T00:00:00Z'))
    })
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/lib/spaced-repetition.test.ts
```

Expected: FAIL - function doesn't exist

### Step 3: Implement SM-2 algorithm

Create `lib/spaced-repetition.ts`:

```typescript
export enum SM2Quality {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

interface SM2State {
  easeFactor: number
  interval: number
  repetitions: number
}

interface SM2Result extends SM2State {
  nextReview: Date
}

export function calculateNextReview(
  state: SM2State,
  quality: SM2Quality,
  baseDate: Date = new Date()
): SM2Result {
  let { easeFactor, interval, repetitions } = state

  // If user rated "Again", reset the card
  if (quality === SM2Quality.AGAIN) {
    repetitions = 0
    interval = 0
  } else {
    // Calculate new ease factor
    // EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
    const qualityDiff = 3 - quality
    easeFactor = easeFactor + (0.1 - qualityDiff * (0.08 + qualityDiff * 0.02))
    easeFactor = Math.max(1.3, easeFactor)

    // Calculate new interval
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }

    repetitions += 1
  }

  // Calculate next review date
  const nextReview = new Date(baseDate)
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview
  }
}

export function getDueCards(cards: Array<{ nextReview: Date }>, now: Date = new Date()) {
  return cards.filter(card => card.nextReview <= now)
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/lib/spaced-repetition.test.ts
```

Expected: PASS

### Step 5: Commit

```bash
git add .
git commit -m "feat: implement SM-2 spaced repetition algorithm"
```

---

## Task 4: Shared UI Components

**Files:**
- Create: `components/domain-filter.tsx`
- Create: `components/stat-card.tsx`
- Create: `components/timer.tsx`
- Create: `components/flashcard.tsx`
- Create: `components/question-card.tsx`

### Step 1: Create domain filter component

Create `components/domain-filter.tsx`:

```typescript
'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CISSP_DOMAINS } from '@/lib/constants'
import { useRouter, useSearchParams } from 'next/navigation'

interface DomainFilterProps {
  value?: string
  onChange?: (value: string) => void
}

export function DomainFilter({ value, onChange }: DomainFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDomain = value || searchParams.get('domain') || 'all'

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue === 'all') {
        params.delete('domain')
      } else {
        params.set('domain', newValue)
      }
      router.push(`?${params.toString()}`)
    }
  }

  return (
    <Tabs value={currentDomain} onValueChange={handleChange}>
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        {CISSP_DOMAINS.map((domain) => (
          <TabsTrigger key={domain.value} value={domain.value}>
            {domain.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
```

### Step 2: Create stat card component

Create `components/stat-card.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

### Step 3: Create timer component

Create `components/timer.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'

interface TimerProps {
  initialSeconds: number
  onExpire?: () => void
  onPause?: () => void
}

export function Timer({ initialSeconds, onExpire, onPause }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onExpire])

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const togglePause = () => {
    setIsRunning(!isRunning)
    if (isRunning) {
      onPause?.()
    }
  }

  const isWarning = seconds < 1800 // Less than 30 minutes

  return (
    <div className={`flex items-center gap-4 ${isWarning ? 'text-destructive' : ''}`}>
      <span className={`text-2xl font-mono font-bold ${isWarning ? 'animate-pulse' : ''}`}>
        {formatTime(seconds)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={togglePause}
        aria-label={isRunning ? 'Pause' : 'Resume'}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  )
}
```

### Step 4: Create flashcard component

Create `components/flashcard.tsx`:

```typescript
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
      <Card
        className={`relative w-full max-w-2xl h-64 cursor-pointer transition-transform duration-500 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p className="text-xl text-center">
            {isFlipped ? back : front}
          </p>
        </div>
      </Card>

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
```

### Step 5: Create question card component

Create `components/question-card.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuestionCardProps {
  question: Question
  onAnswer: (selected: number) => void
  showResult?: boolean
  selectedAnswer?: number
}

export function QuestionCard({ question, onAnswer, showResult = false, selectedAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | undefined>(selectedAnswer)

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected !== undefined) {
      onAnswer(selected)
    }
  }

  const isCorrect = selected === question.correctAnswer

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">{question.questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selected === index
            const showCorrect = showResult && index === question.correctAnswer
            const showIncorrect = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  showCorrect
                    ? 'bg-green-50 border-green-500 text-green-900'
                    : showIncorrect
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                  {showCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-green-600" />}
                  {showIncorrect && <XCircle className="ml-auto h-5 w-5 text-red-600" />}
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Explanation:</p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {!showResult && selected !== undefined && (
          <Button onClick={handleSubmit} className="w-full">
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### Step 6: Commit

```bash
git add .
git commit -m "feat: add shared UI components"
```

---

## Task 5: Server Actions - Notes

**Files:**
- Create: `lib/actions/notes.ts`
- Create: `tests/actions/notes.test.ts`

### Step 1: Write tests for notes actions

Create `tests/actions/notes.test.ts`:

```typescript
import { createNote, getNotes, updateNote, deleteNote } from '@/lib/actions/notes'
import { prisma } from '@/lib/prisma'

describe('Notes Actions', () => {
  beforeEach(async () => {
    await prisma.note.deleteMany({})
  })

  it('should create a note', async () => {
    const note = await createNote({
      title: 'Test Note',
      content: 'Test content',
      domain: 'SECURITY_RISK_MANAGEMENT',
      tags: ['test']
    })

    expect(note.title).toBe('Test Note')
    expect(note.domain).toBe('SECURITY_RISK_MANAGEMENT')
  })

  it('should get notes filtered by domain', async () => {
    await prisma.note.create({
      data: {
        title: 'Note 1',
        content: 'Content 1',
        domain: 'SECURITY_RISK_MANAGEMENT'
      }
    })

    await prisma.note.create({
      data: {
        title: 'Note 2',
        content: 'Content 2',
        domain: 'ASSET_SECURITY'
      }
    })

    const notes = await getNotes({ domain: 'SECURITY_RISK_MANAGEMENT' })
    expect(notes).toHaveLength(1)
    expect(notes[0].domain).toBe('SECURITY_RISK_MANAGEMENT')
  })
})
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/actions/notes.test.ts
```

Expected: FAIL

### Step 3: Implement notes server actions

Create `lib/actions/notes.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const NoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  domain: z.enum([
    'SECURITY_RISK_MANAGEMENT',
    'ASSET_SECURITY',
    'SECURITY_ARCHITECTURE',
    'COMMUNICATION_NETWORK_SECURITY',
    'IDENTITY_ACCESS_MANAGEMENT',
    'SECURITY_ASSESSMENT',
    'SECURITY_OPERATIONS',
    'SOFTWARE_DEVELOPMENT_SECURITY'
  ]),
  tags: z.array(z.string()).default([])
})

export async function createNote(data: z.infer<typeof NoteSchema>) {
  const validated = NoteSchema.parse(data)

  return await prisma.note.create({
    data: validated
  })
}

export async function getNotes(filters?: { domain?: string }) {
  return await prisma.note.findMany({
    where: filters?.domain ? { domain: filters.domain } : undefined,
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getNote(id: string) {
  return await prisma.note.findUnique({
    where: { id }
  })
}

export async function updateNote(id: string, data: z.infer<typeof NoteSchema>) {
  const validated = NoteSchema.parse(data)

  return await prisma.note.update({
    where: { id },
    data: validated
  })
}

export async function deleteNote(id: string) {
  return await prisma.note.delete({
    where: { id }
  })
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/actions/notes.test.ts
```

Expected: PASS

### Step 5: Commit

```bash
git add .
git commit -m "feat: implement notes server actions"
```

---

## Task 6: Server Actions - Flashcards

**Files:**
- Create: `lib/actions/flashcards.ts`

### Step 1: Implement flashcard server actions

Create `lib/actions/flashcards.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { calculateNextReview, SM2Quality } from '@/lib/spaced-repetition'
import { z } from 'zod'

const FlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  domain: z.enum([
    'SECURITY_RISK_MANAGEMENT',
    'ASSET_SECURITY',
    'SECURITY_ARCHITECTURE',
    'COMMUNICATION_NETWORK_SECURITY',
    'IDENTITY_ACCESS_MANAGEMENT',
    'SECURITY_ASSESSMENT',
    'SECURITY_OPERATIONS',
    'SOFTWARE_DEVELOPMENT_SECURITY'
  ])
})

export async function createFlashcard(data: z.infer<typeof FlashcardSchema>) {
  const validated = FlashcardSchema.parse(data)

  return await prisma.flashcard.create({
    data: {
      ...validated,
      nextReview: new Date()
    }
  })
}

export async function getDueCards(domain?: string) {
  const now = new Date()

  return await prisma.flashcard.findMany({
    where: {
      nextReview: { lte: now },
      ...(domain && { domain })
    },
    orderBy: { nextReview: 'asc' }
  })
}

export async function rateFlashcard(id: string, quality: SM2Quality) {
  const card = await prisma.flashcard.findUnique({
    where: { id }
  })

  if (!card) {
    throw new Error('Flashcard not found')
  }

  const result = calculateNextReview(
    {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions
    },
    quality
  )

  return await prisma.flashcard.update({
    where: { id },
    data: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview
    }
  })
}

export async function getAllFlashcards(domain?: string) {
  return await prisma.flashcard.findMany({
    where: domain ? { domain } : undefined,
    orderBy: { createdAt: 'desc' }
  })
}
```

### Step 2: Commit

```bash
git add .
git commit -m "feat: implement flashcards server actions"
```

---

## Task 7: Server Actions - Quiz and Exam

**Files:**
- Create: `lib/actions/quiz.ts`
- Create: `lib/actions/exam.ts`

### Step 1: Implement quiz server actions

Create `lib/actions/quiz.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const QuizParamsSchema = z.object({
  domains: z.array(z.string()).optional(),
  count: z.number().min(1).max(50)
})

export async function getQuizQuestions(params: z.infer<typeof QuizParamsSchema>) {
  const validated = QuizParamsSchema.parse(params)

  const where = validated.domains && validated.domains.length > 0
    ? { domain: { in: validated.domains } }
    : {}

  const questions = await prisma.question.findMany({
    where,
    take: validated.count,
    orderBy: { createdAt: 'desc' }
  })

  // Shuffle questions
  return questions.sort(() => Math.random() - 0.5)
}

export async function updateProgress(domain: string, correct: boolean) {
  const progress = await prisma.progress.upsert({
    where: { domain },
    update: {
      questionsAnswered: { increment: 1 },
      correctCount: correct ? { increment: 1 } : undefined,
      lastStudied: new Date()
    },
    create: {
      domain,
      questionsAnswered: 1,
      correctCount: correct ? 1 : 0
    }
  })

  return {
    accuracy: progress.correctCount / progress.questionsAnswered,
    total: progress.questionsAnswered
  }
}
```

### Step 2: Implement exam server actions

Create `lib/actions/exam.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'

export async function startExam() {
  // Get 150 random questions
  const questions = await prisma.question.findMany({
    take: 150
  })

  const shuffled = questions.sort(() => Math.random() - 0.5)

  const attempt = await prisma.examAttempt.create({
    data: {
      startedAt: new Date()
    }
  })

  return {
    attemptId: attempt.id,
    questions: shuffled.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      domain: q.domain
    }))
  }
}

export async function submitExam(attemptId: string, answers: Map<string, number>) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true }
  })

  if (!attempt) {
    throw new Error('Exam attempt not found')
  }

  // Get all questions to check answers
  const questionIds = Array.from(answers.keys())
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } }
  })

  const questionMap = new Map(questions.map(q => [q.id, q]))

  let correctCount = 0
  const examAnswers = []

  for (const [questionId, selectedAnswer] of answers.entries()) {
    const question = questionMap.get(questionId)!
    const isCorrect = question.correctAnswer === selectedAnswer

    if (isCorrect) correctCount++

    examAnswers.push({
      attemptId,
      questionId,
      selectedAnswer,
      isCorrect
    })

    // Update progress
    await prisma.progress.upsert({
      where: { domain: question.domain },
      update: {
        questionsAnswered: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        lastStudied: new Date()
      },
      create: {
        domain: question.domain,
        questionsAnswered: 1,
        correctCount: isCorrect ? 1 : 0
      }
    })
  }

  // Save exam answers
  await prisma.examAnswer.createMany({
    data: examAnswers
  })

  // Calculate score
  const score = Math.round((correctCount / questions.length) * 100)

  // Update attempt
  const completedAt = new Date()
  const timeSpent = Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000)

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt,
      score,
      timeSpent
    }
  })

  return {
    score,
    passed: score >= 70,
    correctCount,
    totalQuestions: questions.length,
    timeSpent
  }
}
```

### Step 3: Commit

```bash
git add .
git commit -m "feat: implement quiz and exam server actions"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `app/page.tsx`
- Create: `app/layout.tsx`

### Step 1: Create root layout

Create `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CISSP Study Platform',
  description: 'Your personal CISSP study companion'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Step 2: Create dashboard page

Create `app/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/stat-card'
import { BookOpen, Brain, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const [totalNotes, totalFlashcards, progress, recentAttempts] = await Promise.all([
    prisma.note.count(),
    prisma.flashcard.count(),
    prisma.progress.findMany(),
    prisma.examAttempt.findMany({
      where: { completedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 5
    })
  ])

  const totalQuestions = progress.reduce((sum, p) => sum + p.questionsAnswered, 0)
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctCount, 0)
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

  return {
    totalNotes,
    totalFlashcards,
    totalQuestions,
    overallAccuracy: Math.round(overallAccuracy),
    recentAttempts
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">CISSP Study Dashboard</h1>
        <p className="text-muted-foreground">Track your progress and continue studying</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Notes"
          value={stats.totalNotes}
          icon={BookOpen}
          description="Across all domains"
        />
        <StatCard
          title="Flashcards"
          value={stats.totalFlashcards}
          icon={Brain}
          description="In your deck"
        />
        <StatCard
          title="Questions Answered"
          value={stats.totalQuestions}
          icon={Target}
          description="Lifetime total"
        />
        <StatCard
          title="Accuracy"
          value={`${stats.overallAccuracy}%`}
          icon={TrendingUp}
          description="Overall average"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/notes" className="block">
          <div className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            <p className="text-sm text-muted-foreground">View and edit study notes</p>
          </div>
        </Link>
        <Link href="/flashcards" className="block">
          <div className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Flashcards</h2>
            <p className="text-sm text-muted-foreground">Practice with spaced repetition</p>
          </div>
        </Link>
        <Link href="/quiz" className="block">
          <div className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Quiz</h2>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>
        </Link>
        <Link href="/exam" className="block">
          <div className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Exam</h2>
            <p className="text-sm text-muted-foreground">Full 4-hour simulation</p>
          </div>
        </Link>
      </div>

      {stats.recentAttempts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Exam Attempts</h2>
          <div className="space-y-2">
            {stats.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="p-4 border rounded-lg flex justify-between items-center">
                <span>{attempt.completedAt?.toLocaleDateString()}</span>
                <span className={`font-bold ${attempt.score && attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {attempt.score}% {attempt.score && attempt.score >= 70 ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Step 3: Commit

```bash
git add .
git commit -m "feat: implement dashboard page"
```

---

## Task 9: Notes Pages

**Files:**
- Create: `app/notes/page.tsx`
- Create: `app/notes/new/page.tsx`
- Create: `app/notes/[id]/page.tsx`

### Step 1: Create notes list page

Create `app/notes/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { DomainFilter } from '@/components/domain-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NotesPage({
  searchParams
}: {
  searchParams: { domain?: string }
}) {
  const domain = searchParams.domain
  const notes = await prisma.note.findMany({
    where: domain ? { domain } : undefined,
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Notes</h1>
          <p className="text-muted-foreground">Organized by CISSP domain</p>
        </div>
        <Link href="/notes/new">
          <Button>Create Note</Button>
        </Link>
      </div>

      <DomainFilter />

      <div className="grid gap-4 mt-6">
        {notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="hover:bg-muted transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content.substring(0, 200)}...
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">{note.domain}</span>
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">#{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### Step 2: Create new note page

Create `app/notes/new/page.tsx`:

```typescript
import { createNote } from '@/lib/actions/notes'
import { redirect } from 'next/navigation'
import { CISSP_DOMAINS } from '@/lib/constants'

export default function NewNotePage() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const note = await createNote({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      domain: formData.get('domain') as any,
      tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean)
    })

    redirect(`/notes/${note.id}`)
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Note</h1>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            name="title"
            type="text"
            required
            className="w-full p-2 border rounded"
            placeholder="Enter note title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Domain</label>
          <select name="domain" required className="w-full p-2 border rounded">
            {CISSP_DOMAINS.map((domain) => (
              <option key={domain.value} value={domain.value}>
                {domain.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content (Markdown supported)</label>
          <textarea
            name="content"
            required
            rows={15}
            className="w-full p-2 border rounded font-mono"
            placeholder="Write your notes here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
          <input
            name="tags"
            type="text"
            className="w-full p-2 border rounded"
            placeholder="risk, cia, triad"
          />
        </div>

        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">
          Create Note
        </button>
      </form>
    </div>
  )
}
```

### Step 3: Create note detail page

Create `app/notes/[id]/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { updateNote, deleteNote } from '@/lib/actions/notes'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function NotePage({
  params
}: {
  params: { id: string }
}) {
  const note = await prisma.note.findUnique({
    where: { id: params.id }
  })

  if (!note) {
    return <div>Note not found</div>
  }

  async function handleUpdate(formData: FormData) {
    'use server'

    await updateNote(params.id, {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      domain: formData.get('domain') as any,
      tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean)
    })

    redirect(`/notes/${params.id}`)
  }

  async function handleDelete() {
    'use server'
    await deleteNote(params.id)
    redirect('/notes')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <form action={handleUpdate}>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <input
              name="title"
              defaultValue={note.title}
              className="text-3xl font-bold bg-transparent border-none focus:outline-none flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="default">Save</Button>
              <Button formAction={handleDelete} variant="destructive">Delete</Button>
            </div>
          </div>

          <div>
            <select name="domain" defaultValue={note.domain} className="p-2 border rounded">
              {['SECURITY_RISK_MANAGEMENT', 'ASSET_SECURITY', 'SECURITY_ARCHITECTURE',
                'COMMUNICATION_NETWORK_SECURITY', 'IDENTITY_ACCESS_MANAGEMENT',
                'SECURITY_ASSESSMENT', 'SECURITY_OPERATIONS', 'SOFTWARE_DEVELOPMENT_SECURITY'
              ].map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <textarea
            name="content"
            defaultValue={note.content}
            rows={20}
            className="w-full p-4 border rounded font-mono text-sm"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              name="tags"
              defaultValue={note.tags.join(', ')}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </form>
    </div>
  )
}
```

### Step 4: Commit

```bash
git add .
git commit -m "feat: implement notes pages"
```

---

## Task 10: Flashcards Page

**Files:**
- Create: `app/flashcards/page.tsx`

### Step 1: Create flashcards study page

Create `app/flashcards/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { rateFlashcard, getDueCards } from '@/lib/actions/flashcards'
import { Flashcard } from '@/components/flashcard'
import { DomainFilter } from '@/components/domain-filter'
import { redirect } from 'next/navigation'

export default async function FlashcardsPage({
  searchParams
}: {
  searchParams: { domain?: string }
}) {
  const domain = searchParams.domain
  const dueCards = await getDueCards(domain)

  if (dueCards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Flashcards</h1>
        <DomainFilter />
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cards due for review!</p>
        </div>
      </div>
    )
  }

  async function handleRate(formData: FormData) {
    'use server'

    const cardId = formData.get('cardId') as string
    const rating = parseInt(formData.get('rating') as string)

    await rateFlashcard(cardId, rating as any)
    redirect(`/flashcards?${domain ? `domain=${domain}` : ''}`)
  }

  const currentCard = dueCards[0]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flashcards</h1>
        <p className="text-muted-foreground">
          {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review
        </p>
      </div>

      <DomainFilter />

      <form action={handleRate} className="mt-8">
        <input type="hidden" name="cardId" value={currentCard.id} />

        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          onRate={(rating) => {
            // Handled by form
          }}
        />

        <div className="flex justify-center gap-4 mt-6">
          <button type="submit" name="rating" value="0" className="px-4 py-2 bg-destructive text-white rounded">
            Again
          </button>
          <button type="submit" name="rating" value="1" className="px-4 py-2 bg-secondary rounded">
            Hard
          </button>
          <button type="submit" name="rating" value="2" className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Good
          </button>
          <button type="submit" name="rating" value="3" className="px-4 py-2 bg-green-600 text-white rounded">
            Easy
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Step 2: Commit

```bash
git add .
git commit -m "feat: implement flashcards page"
```

---

## Task 11: Quiz Page

**Files:**
- Create: `app/quiz/page.tsx`

### Step 1: Create quiz page

Create `app/quiz/page.tsx`:

```typescript
'use client'

import { useState, useActionState } from 'react'
import { QuestionCard } from '@/components/question-card'
import { DomainFilter } from '@/components/domain-filter'
import { Button } from '@/components/ui/button'
import { getQuizQuestions, updateProgress } from '@/lib/actions/quiz'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type QuizState = 'setup' | 'active' | 'results'

interface QuizResults {
  score: number
  correct: number
  total: number
  domainBreakdown: Record<string, { correct: number; total: number }>
}

export default function QuizPage() {
  const [state, setState] = useState<QuizState>('setup')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map())
  const [results, setResults] = useState<QuizResults | null>(null)

  const startQuiz = async () => {
    const data = await getQuizQuestions({
      domains: selectedDomains.length > 0 ? selectedDomains : undefined,
      count: questionCount
    })
    setQuestions(data)
    setState('active')
  }

  const handleAnswer = async (answer: number) => {
    const newAnswers = new Map(userAnswers)
    newAnswers.set(currentIndex, answer)
    setUserAnswers(newAnswers)

    const currentQuestion = questions[currentIndex]
    await updateProgress(currentQuestion.domain, answer === currentQuestion.correctAnswer)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Calculate results
      let correct = 0
      const domainBreakdown: Record<string, { correct: number; total: number }> = {}

      questions.forEach((q, idx) => {
        const answer = newAnswers.get(idx)
        const isCorrect = answer === q.correctAnswer

        if (isCorrect) correct++

        if (!domainBreakdown[q.domain]) {
          domainBreakdown[q.domain] = { correct: 0, total: 0 }
        }
        domainBreakdown[q.domain].total++
        if (isCorrect) domainBreakdown[q.domain].correct++
      })

      setResults({
        score: Math.round((correct / questions.length) * 100),
        correct,
        total: questions.length,
        domainBreakdown
      })
      setState('results')
    }
  }

  if (state === 'setup') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Quiz Mode</h1>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value={10}>10 questions</option>
                <option value={25}>25 questions</option>
                <option value={50}>50 questions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Domains</label>
              <div className="space-y-2">
                {['SECURITY_RISK_MANAGEMENT', 'ASSET_SECURITY', 'SECURITY_ARCHITECTURE',
                  'COMMUNICATION_NETWORK_SECURITY', 'IDENTITY_ACCESS_MANAGEMENT',
                  'SECURITY_ASSESSMENT', 'SECURITY_OPERATIONS', 'SOFTWARE_DEVELOPMENT_SECURITY'
                ].map((domain) => (
                  <label key={domain} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDomains([...selectedDomains, domain])
                        } else {
                          setSelectedDomains(selectedDomains.filter(d => d !== domain))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{domain.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to include all domains
              </p>
            </div>

            <Button onClick={startQuiz} className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'active') {
    const currentQuestion = questions[currentIndex]
    const previousAnswer = userAnswers.get(currentIndex)

    return (
      <div className="container mx-auto py-8">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="w-48 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          showResult={previousAnswer !== undefined}
          selectedAnswer={previousAnswer}
        />
      </div>
    )
  }

  if (state === 'results' && results) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Quiz Results</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${results.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {results.score}%
              </div>
              <p className="text-muted-foreground">
                {results.correct} out of {results.total} correct
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results.domainBreakdown).map(([domain, stats]) => (
                <div key={domain} className="flex justify-between items-center">
                  <span className="text-sm">{domain.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium">
                    {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => setState('setup')} className="w-full mt-6">
          Start New Quiz
        </Button>
      </div>
    )
  }

  return null
}
```

### Step 2: Commit

```bash
git add .
git commit -m "feat: implement quiz page"
```

---

## Task 12: Exam Page

**Files:**
- Create: `app/exam/page.tsx`

### Step 1: Create exam page

Create `app/exam/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { QuestionCard } from '@/components/question-card'
import { Timer } from '@/components/timer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { startExam, submitExam } from '@/lib/actions/exam'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ExamState = 'confirmation' | 'active' | 'results'

interface ExamQuestion {
  id: string
  questionText: string
  options: string[]
  domain: string
}

export default function ExamPage() {
  const [state, setState] = useState<ExamState>('confirmation')
  const [attemptId, setAttemptId] = useState<string>('')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, number>>(new Map())
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set())
  const [timeExpired, setTimeExpired] = useState(false)

  const startExamSession = async () => {
    const data = await startExam()
    setAttemptId(data.attemptId)
    setQuestions(data.questions)
    setState('active')
  }

  const handleSelectAnswer = (answer: number) => {
    const newAnswers = new Map(answers)
    newAnswers.set(questions[currentIndex].id, answer)
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    const results = await submitExam(attemptId, answers)
    setResults(results)
    setState('results')
  }

  const [results, setResults] = useState<any>(null)

  if (state === 'confirmation') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold mb-4">CISSP Exam Simulation</h1>
            <div className="space-y-4 mb-6">
              <p className="text-muted-foreground">
                This exam simulates the actual CISSP exam experience:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>150 randomly selected questions</li>
                <li>4-hour time limit</li>
                <li>Covers all 8 CISSP domains</li>
                <li>Passing score: 70%</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-900 font-medium">
                  ⚠️ Once you start, the timer will begin. Make sure you have 4 hours of uninterrupted time.
                </p>
              </div>
            </div>
            <Button onClick={startExamSession} size="lg" className="w-full">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'active') {
    const currentQuestion = questions[currentIndex]
    const answeredCount = answers.size
    const unansweredCount = questions.length - answeredCount

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background z-10">
          <div className="container mx-auto py-4 flex justify-between items-center">
            <Timer
              initialSeconds={14400} // 4 hours
              onExpire={() => setTimeExpired(true)}
            />
            <div className="text-sm text-muted-foreground">
              {answeredCount} answered, {unansweredCount} unanswered
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8 flex gap-8">
          <main className="flex-1">
            <QuestionCard
              question={{
                ...currentQuestion,
                correctAnswer: -1, // Hidden during exam
                explanation: ''
              }}
              onAnswer={handleSelectAnswer}
              showResult={false}
            />
          </main>

          <aside className="w-64 space-y-4">
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-4">Question Palette</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, idx) => {
                    const questionId = questions[idx].id
                    const isAnswered = answers.has(questionId)
                    const isMarked = markedForReview.has(idx)
                    const isCurrent = idx === currentIndex

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-10 h-10 rounded text-sm font-medium ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : isMarked
                            ? 'bg-yellow-500 text-white'
                            : isAnswered
                            ? 'bg-green-500 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const newMarked = new Set(markedForReview)
                if (newMarked.has(currentIndex)) {
                  newMarked.delete(currentIndex)
                } else {
                  newMarked.add(currentIndex)
                }
                setMarkedForReview(newMarked)
              }}
            >
              {markedForReview.has(currentIndex) ? 'Unmark' : 'Mark'} for Review
            </Button>

            <Button
              onClick={() => {
                if (unansweredCount > 0) {
                  setTimeExpired(true)
                } else {
                  handleSubmit()
                }
              }}
              className="w-full"
            >
              Submit Exam
            </Button>
          </aside>
        </div>

        <Dialog open={timeExpired} onOpenChange={setTimeExpired}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Exam?</DialogTitle>
              <DialogDescription>
                You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.
                {unansweredCount === 0
                  ? ' Are you sure you want to submit?'
                  : ' Answer all questions before submitting for the best results.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTimeExpired(false)}>
                Continue Exam
              </Button>
              {unansweredCount === 0 && (
                <Button onClick={handleSubmit}>
                  Submit
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (state === 'results' && results) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <h1 className="text-3xl font-bold mb-6">Exam Results</h1>

            <div className={`text-7xl font-bold mb-4 ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
              {results.score}%
            </div>

            <p className="text-xl mb-2">
              {results.passed ? '✓ Passed' : '✗ Did Not Pass'}
            </p>

            <p className="text-muted-foreground mb-6">
              {results.correctCount} out of {results.totalQuestions} correct
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm">
                Time: {Math.floor(results.timeSpent / 3600)}h {Math.floor((results.timeSpent % 3600) / 60)}m
              </p>
            </div>

            <Button onClick={() => window.location.href = '/'} size="lg">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
```

### Step 2: Commit

```bash
git add .
git commit -m "feat: implement exam simulation page"
```

---

## Task 13: Seed Data

**Files:**
- Modify: `prisma/seed.ts`

### Step 1: Create seed script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleQuestions = [
  {
    questionText: 'Which of the CIA triad principles ensures that data is not altered or tampered with?',
    options: ['Confidentiality', 'Integrity', 'Availability', 'Authorization'],
    correctAnswer: 1,
    explanation: 'Integrity ensures that data is not altered or tampered with without authorization.',
    domain: 'SECURITY_RISK_MANAGEMENT',
    difficulty: 'EASY',
    tags: ['cia', 'triad', 'basics']
  },
  {
    questionText: 'What is the primary purpose of a risk assessment?',
    options: [
      'To eliminate all risks',
      'To identify and quantify risks',
      'To implement security controls',
      'To create security policies'
    ],
    correctAnswer: 1,
    explanation: 'The primary purpose of a risk assessment is to identify and quantify risks to make informed decisions about security controls.',
    domain: 'SECURITY_RISK_MANAGEMENT',
    difficulty: 'EASY',
    tags: ['risk', 'assessment']
  },
  // Add more sample questions here...
]

const sampleFlashcards = [
  {
    front: 'What does CIA stand for in information security?',
    back: 'Confidentiality, Integrity, and Availability',
    domain: 'SECURITY_RISK_MANAGEMENT'
  },
  {
    front: 'What is the formula for Annualized Loss Expectancy (ALE)?',
    back: 'ALE = Single Loss Expectancy (SLE) × Annualized Rate of Occurrence (ARO)',
    domain: 'SECURITY_RISK_MANAGEMENT'
  },
  // Add more sample flashcards here...
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.examAnswer.deleteMany()
  await prisma.examAttempt.deleteMany()
  await prisma.progress.deleteMany()
  await prisma.flashcard.deleteMany()
  await prisma.note.deleteMany()
  await prisma.question.deleteMany()

  // Seed questions
  for (const question of sampleQuestions) {
    await prisma.question.create({ data: question })
  }
  console.log(`Created ${sampleQuestions.length} questions`)

  // Seed flashcards
  for (const card of sampleFlashcards) {
    await prisma.flashcard.create({ data: card })
  }
  console.log(`Created ${sampleFlashcards.length} flashcards`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Step 2: Update package.json with seed script

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Step 3: Run seed

```bash
npx prisma db seed
```

Expected: Sample data created

### Step 4: Commit

```bash
git add .
git commit -m "feat: add database seed script"
```

---

## Task 14: E2E Tests

**Files:**
- Create: `tests/e2e/quiz.spec.ts`
- Create: `tests/e2e/notes.spec.ts`
- Create: `playwright.config.ts`

### Step 1: Set up Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Step 2: Create notes E2E test

Create `tests/e2e/notes.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Notes', () => {
  test('should create and view a note', async ({ page }) => {
    await page.goto('/notes')

    await page.click('text=Create Note')
    await page.fill('input[name="title"]', 'Test Note')
    await page.fill('textarea[name="content"]', 'This is test content for the note.')
    await page.selectOption('select[name="domain"]', 'SECURITY_RISK_MANAGEMENT')
    await page.click('button[type="submit"]')

    await expect(page.locator('h1')).toContainText('Test Note')
  })

  test('should filter notes by domain', async ({ page }) => {
    await page.goto('/notes')

    await page.click('button:has-text("SECURITY_RISK_MANAGEMENT")')

    // Wait for navigation
    await page.waitForURL(/domain=SECURITY_RISK_MANAGEMENT/)

    await expect(page.locator('text=SECURITY_RISK_MANAGEMENT')).toBeVisible()
  })
})
```

### Step 3: Create quiz E2E test

Create `tests/e2e/quiz.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Quiz', () => {
  test('should complete a quiz', async ({ page }) => {
    await page.goto('/quiz')

    await page.selectOption('select', '10')
    await page.click('text=Start Quiz')

    // Answer first question
    await page.click('button:has-text("A.")')
    await page.click('text=Submit Answer')

    // Verify we moved to next question or results
    await expect(page.locator('text=Question 2 of 10, text=Quiz Results')).toBeTruthy()
  })
})
```

### Step 4: Run E2E tests

```bash
npx playwright test
```

Expected: Tests pass

### Step 5: Commit

```bash
git add .
git commit -m "test: add E2E tests with Playwright"
```

---

## Task 15: Deployment Configuration

**Files:**
- Create: `vercel.json`
- Create: `.env.local.example`

### Step 1: Create Vercel configuration

Create `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Step 2: Create environment example

Create `.env.local.example`:

```env
# Database - Vercel Postgres
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Direct URL for Prisma migrations
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Step 3: Commit

```bash
git add .
git commit -m "chore: add Vercel deployment configuration"
```

---

## Final Steps

### 1. Run all tests

```bash
npm test
npx playwright test
```

Expected: All tests pass

### 2. Build for production

```bash
npm run build
```

Expected: Build succeeds

### 3. Final commit

```bash
git add .
git commit -m "chore: final polish - ready for deployment"
```

---

## Success Criteria Verification

- [ ] User can create, view, and edit notes by domain
- [ ] Flashcard sessions use spaced repetition correctly
- [ ] Quiz mode provides instant feedback and updates progress
- [ ] Exam simulation accurately mirrors real CISSP exam (150 questions, 4 hours)
- [ ] Progress is tracked across all domains
- [ ] Application is responsive on mobile devices

---

## Notes for Implementation

1. **Database Setup**: You'll need to set up Vercel Postgres or use a local PostgreSQL instance for development
2. **Seed Data**: The seed file contains minimal samples - expand with real CISSP questions
3. **Styling**: The plan uses shadcn/ui defaults - customize as needed
4. **Testing**: Run tests after each task to catch issues early
5. **Commits**: Commit frequently after each task for easy rollback

---

## Deployment Checklist

- [ ] Set up Vercel Postgres database
- [ ] Add environment variables in Vercel dashboard
- [ ] Run `npx prisma db push` on production database
- [ ] Run `npx prisma db seed` on production database (optional)
- [ ] Deploy to Vercel via GitHub integration
- [ ] Verify all features work in production
- [ ] Set up custom domain (optional)
