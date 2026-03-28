# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a CISSP (Certified Information Systems Security Professional) study platform built with Next.js 16, featuring bilingual (Chinese/English) support. The application includes interactive study tools like notes, flashcards, quizzes, and practice exams.

## Architecture

- **Framework**: Next.js 16.2.1 with App Router
- **React**: 19.2.4
- **Internationalization**: next-intl v4.8.3 for Chinese/English support
- **UI Components**: Custom components with shadcn/ui styling
- **Database**: Prisma ORM v5.22.0 with PostgreSQL for storing study materials
- **Styling**: CSS with CSS-in-JS approach using Tailwind CSS classes

## Key Features

1. **Dashboard** (`/`) - Overview of study progress and quick access to all features
2. **Notes** (`/notes`) - Study notes management with bilingual content support
3. **Flashcards** (`/flashcards`) - Interactive flashcards with spaced repetition (SM-2 algorithm) and progress reset capability
4. **Quiz** (`/quiz`) - Practice questions with domain filtering and performance tracking
5. **Exam** (`/exam`) - Full-length CISSP practice exam with timer (150 questions, 3 hours)
6. **Admin** (`/admin`) - Backend management for questions (CRUD, batch import/export, search/filter)
7. **Language Toggle** - Switch between Chinese (中文) and English interfaces
8. **Theme Toggle** - Dark/light theme support

## Implementation Notes

### Internationalization (i18n)
- Uses next-intl for server-side and client-side translations
- Supported locales: `en` (English) and `zh` (Chinese)
- Translation files located in `locales/` directory
- Dynamic routing with `[locale]` segments for language-specific URLs
- All user-facing text uses translation keys (e.g., `tCommon('dashboard')`)

### Database Schema
- All content fields have bilingual variants (e.g., `front`, `frontZh` for flashcards)
- Includes progress tracking, user statistics, and spaced repetition scheduling
- Domain-based organization for CISSP 8 domains

### Component Patterns
- Components use `useTranslations()` for client-side translations
- Server components use `getTranslations()` for server-side translations
- Locale-aware data processing with `useLocale()` hook
- Consistent UI patterns across all features

### Admin Management System
- **Route**: `/admin` with sidebar navigation layout
- **Authentication**: None (internal tool, no auth required)
- **Layout**: `app/[locale]/admin/layout.tsx` with `AdminSidebar` component
- **Question Management** (`/admin/questions`):
  - CRUD operations via server actions in `lib/actions/questions.ts`
  - Batch import from JSON/CSV files with preview-before-confirm
  - Export to JSON/CSV formats
  - Search by question text, filter by domain/difficulty
  - Batch delete with confirmation
- **Import Formats**:
  - JSON: options as `{A, B, C, D}` object, correctAnswer as letter string (e.g., `"B"`)
  - CSV: columns `optionA, optionB, optionC, optionD, correctAnswer` (letter format)
- **UI Components**: All use theme-aware CSS variables (bg-background, text-foreground, bg-card, etc.)
- **Translation keys**: Full bilingual support under `admin` namespace in locale files

### Recent Updates
- Added admin management system for questions (CRUD, import/export, search/filter)
- Added flashcard progress reset feature with confirmation dialog
- Fixed flashcard flip state not resetting between cards
- Upgraded Next.js from 14.2.35 to 16.2.1
- Upgraded React from 18 to 19.2.4
- Upgraded ESLint from 8 to 10.1.0
- Implemented full bilingual support for all pages (flashcards, quiz, exam)
- Fixed translation key structure mismatches
- Simplified language toggle component with better UX
- Created comprehensive translation keys for all UI elements

### Test-Driven Development (TDD)

This project follows TDD practices. When adding or modifying features, adhere to the Red-Green-Refactor cycle:

1. **Red** - Write a failing test first that defines the expected behavior
2. **Green** - Write the minimum code to make the test pass
3. **Refactor** - Clean up the code while keeping tests green

#### Testing Stack
- **Unit Tests**: Vitest with `globals: true` (no need to import `describe`/`it`/`expect` in most files)
- **E2E Tests**: Playwright (`npm run test:e2e`)
- **Mock Setup**: `tests/prisma-mock.ts` provides centralized Prisma mock via `vi.mock('@/prisma/config')`

#### TDD Workflow Rules
- **Write tests before implementation** — no production code without a corresponding failing test
- **Run tests frequently** — use `npm test` after each meaningful change
- **Test file location**: `tests/` directory mirrors the source structure (e.g., `tests/actions/` for `lib/actions/`)
- **Test naming**: Use descriptive `describe` blocks grouped by function/module, with clear `it` descriptions (e.g., `it('should return validation error for empty front')`)
- **Mock pattern**: Import `mockPrisma` from `../prisma-mock` (or `../../prisma-mock`) and use `mockResolvedValue`/`mockRejectedValue` for Prisma operations
- **Reset mocks**: `beforeEach(() => vi.clearAllMocks())` — handled globally in setup file, but can be added locally for clarity
- **Error handling**: Every server action must have tests for validation errors, database errors, and edge cases (not-found, empty input, etc.)
- **Bilingual fields**: When testing actions with bilingual content (e.g., `front`/`frontZh`), test both language variants
- **No `@testing-library`** for server actions — use direct function calls with mocked Prisma
- **Keep tests focused**: Each test should verify one behavior; avoid testing multiple unrelated concerns in a single `it` block

#### Test Coverage Expectations
- All Server Actions (`lib/actions/`) must have corresponding test files in `tests/actions/`
- Pure utility functions (e.g., `lib/spaced-repetition.ts`) must have dedicated unit tests
- UI components are tested via E2E (Playwright), not unit tests
- Minimum test categories per action: happy path, validation error, database error

### Development Commands
- `npm dev` - Start development server (use this, not npx)
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm test` - Run tests with vitest
- `npm run test:e2e` - Run Playwright E2E tests

### Known Issues/Warnings
- Middleware file convention is deprecated in Next.js 16, should use "proxy" instead
- Prisma 7.x has breaking changes with adapter configuration; currently using 5.22.0 for stability
