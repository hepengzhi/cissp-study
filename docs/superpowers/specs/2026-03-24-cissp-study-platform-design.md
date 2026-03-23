# CISSP Study Platform - Design Spec

**Date:** 2026-03-24
**Author:** Claude Code
**Status:** Draft

## Overview

A personal, full-stack CISSP study platform combining notes, flashcards with spaced repetition, practice quizzes, and realistic exam simulation. Built as a monolithic Next.js application with Vercel Postgres, deployed on Vercel.

## Goals

- Provide a unified platform for CISSP exam preparation
- Support all study modes: notes, flashcards, quizzes, and full exam simulation
- Track progress across all 8 CISSP domains
- Implement spaced repetition for effective learning
- Enable realistic exam practice with 4-hour timed simulations

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR/RSC |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible, customizable components |
| Backend | Next.js API Routes + Server Actions | API layer |
| ORM | Prisma | Type-safe database access |
| Database | Vercel Postgres (PostgreSQL) | Managed PostgreSQL |
| Deployment | Vercel | Hosting + CI/CD |
| Language | TypeScript | Type safety across the stack |

### Project Structure

```
app/
├── (dashboard)/
│   ├── page.tsx              # Dashboard overview
│   ├── notes/
│   │   ├── page.tsx          # Notes list
│   │   └── [id]/page.tsx     # Note detail
│   ├── flashcards/
│   │   └── page.tsx          # Flashcard study
│   ├── quiz/
│   │   └── page.tsx          # Quiz mode
│   └── exam/
│       └── page.tsx          # Exam simulation
├── api/                      # API routes (if needed)
└── layout.tsx                # Root layout
components/
├── ui/                       # shadcn/ui components
├── DomainFilter.tsx          # Domain selector
├── QuestionCard.tsx          # Question display
├── ProgressChart.tsx         # Progress visualization
├── Timer.tsx                 # Exam timer
└── StatCard.tsx              # Dashboard stat cards
lib/
├── prisma.ts                 # Prisma client
├── spaced-repetition.ts      # SM-2 algorithm
└── utils.ts                  # Utilities
prisma/
└── schema.prisma             # Database schema
```

## Data Model

### Database Schema

```prisma
model Question {
  id            String   @id @default(cuid())
  questionText  String
  options       String[] // 4 options
  correctAnswer Int      // Index of correct option
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
  content   String   // Markdown or rich text
  domain    Domain
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Flashcard {
  id           String   @id @default(cuid())
  front        String
  back         String
  domain       Domain
  nextReview   DateTime @default(now())
  interval     Int      @default(0)     // Days until next review
  easeFactor   Float    @default(2.5)   // SM-2 ease factor
  repetitions  Int      @default(0)     // Successful reviews
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Progress {
  id               String   @id @default(cuid())
  domain           Domain   @unique
  questionsAnswered Int     @default(0)
  correctCount     Int      @default(0)
  lastStudied      DateTime @default(now())

  questions        Question[]
}

model ExamAttempt {
  id          String    @id @default(cuid())
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  score       Int?      // 0-100 (percentage; CISSP pass = 70%)
  timeSpent   Int?      // Seconds
  answers     ExamAnswer[]
}

model ExamAnswer {
  id           String      @id @default(cuid())
  attemptId    String
  questionId   String
  selectedAnswer Int
  isCorrect    Boolean
  attempt      ExamAttempt @relation(fields: [attemptId], references: [id])
  question     Question    @relation(fields: [questionId], references: [id])
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

### CISSP Domains

1. Security and Risk Management (16%)
2. Asset Security (10%)
3. Security Architecture and Engineering (13%)
4. Communication and Network Security (13%)
5. Identity and Access Management (13%)
6. Security Assessment and Testing (12%)
7. Security Operations (13%)
8. Software Development Security (10%)

## Features

### 1. Dashboard

- Overview cards showing total progress
- Progress chart by domain (bar or radar chart)
- Recent activity (last studied, last quiz score)
- Quick action buttons to each feature
- Streak counter (consecutive days studied)

### 2. Notes

- List view filtered by domain
- Create/edit notes with rich text or markdown
- Tag system for cross-referencing
- Search functionality
- Domain-based organization

### 3. Flashcards

- Spaced repetition using SM-2 algorithm
- Front/back card flip animation
- Rating buttons: Again, Hard, Good, Easy
- Filter by domain
- Session progress indicator
- Due cards prioritized

**SM-2 Algorithm:**
```
easeFactor = max(1.3, easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)))
interval = 1 if repetitions == 0
         = 6 if repetitions == 1
         = round(interval * easeFactor) otherwise
nextReview = now() + interval days
```

### 4. Quiz

- Select domain(s) to quiz
- Number of questions (10, 25, 50)
- Instant feedback after each answer
- Show explanation for correct/incorrect
- Review wrong answers at end
- Update progress stats

### 5. Exam Simulation

- 150 random questions (mirrors real exam)
- 4-hour timer (can be paused)
- Question palette (navigate, mark for review)
- Submit only when all questions reviewed
- Detailed results: score, domain breakdown, time spent
- Save attempt history

## User Flows

### Quiz Flow

1. User navigates to `/quiz`
2. Selects domain(s) and question count
3. Starts quiz → fetch random questions from selection
4. Display question with 4 options
5. User selects option → submit
6. Show correct/incorrect + explanation
7. Next question → repeat until done
8. Show results: score, breakdown, review wrong answers
9. Update Progress records

### Flashcard Flow

1. User navigates to `/flashcards`
2. Select domain (optional) or "Due cards only"
3. Start session → fetch cards where nextReview <= now
4. Show front of card
5. User clicks flip → show back
6. User rates: Again (0min), Hard (2 days), Good (4 days), Easy (7 days)
7. Calculate next review using SM-2
8. Update card in database
9. Next card → repeat until no due cards
10. Show session summary

### Exam Flow

1. User navigates to `/exam`
2. Confirm "4-hour commitment" warning
3. Start exam → fetch 150 random questions, start timer
4. Full-screen mode with question palette sidebar
5. User can navigate, mark for review, change answers
6. Submit (shows warning if unanswered questions)
7. Calculate score (need 70% to pass, matching CISSP's 700/1000 scale)
8. Show detailed results: overall, by domain, time
9. Save ExamAttempt with all answers

## Component Specifications

### DomainFilter

- Horizontal scrollable tab list
- Shows 8 domains with icons
- Active state highlighting
- "All" option to clear filter

### QuestionCard

- Display question text
- 4 clickable option buttons
- Visual feedback for selection
- Show correct/incorrect state
- Explanation section (hidden until answered)

### Timer

- Display: `HH:MM:SS`
- Auto-submit when reaches 0
- Pause/resume button
- Visual warning when < 30 minutes

### ProgressChart

- Bar chart showing % correct by domain
- Overall average line
- Click to filter by domain

## Error Handling

### Client-Side

- React Error Boundary wrapping app
- Per-page error boundaries for graceful degradation
- Toast notifications for transient errors
- Inline validation for forms

### Server-Side

- Server Actions validate inputs with Zod
- Prisma handles database constraints
- Generic error messages to user (no sensitive data leakage)
- Error logging for debugging

### Network Errors

- Auto-retry for failed fetches (3 attempts)
- "Unable to connect. Retrying..." message

## Testing Strategy

### Unit Tests

- Spaced repetition algorithm
- Score calculation
- Data validation schemas
- Utility functions

### Integration Tests

- API routes / Server Actions
- Database CRUD operations
- Authentication (if added)

### E2E Tests (Playwright)

- Complete quiz flow
- Create and edit note
- Finish exam simulation
- Flashcard session

### Manual Testing

- Responsive design (mobile, tablet, desktop)
- Timer accuracy and persistence
- Card flip animation smoothness
- Cross-browser compatibility

## Deployment

### Vercel Configuration

- Automatic deployments from main branch
- Preview deployments for PRs
- Vercel Postgres for database (Hobby tier sufficient for personal use)
- Environment variables: `DATABASE_URL`, `AUTH_SECRET` (if auth added)

### Environment Variables

```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### Seed Data

- Initial set of questions (can be imported from existing sources)
- Sample notes for each domain
- Initial flashcard deck

## Success Criteria

- [ ] User can create, view, and edit notes by domain
- [ ] Flashcard sessions use spaced repetition correctly
- [ ] Quiz mode provides instant feedback and updates progress
- [ ] Exam simulation accurately mirrors real CISSP exam (150 questions, 4 hours)
- [ ] Progress is tracked across all domains
- [ ] Application is responsive on mobile devices

## Future Enhancements (Out of Scope for MVP)

- Offline mode with local storage and sync on reconnect
- User authentication for multi-user support
- Import/export study data
- Community question sharing
- AI-generated questions from notes
- Mobile app (React Native)
- Advanced analytics and study recommendations
