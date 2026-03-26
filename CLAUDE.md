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
6. **Language Toggle** - Switch between Chinese (中文) and English interfaces
7. **Theme Toggle** - Dark/light theme support

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

### Recent Updates
- Added flashcard progress reset feature with confirmation dialog
- Fixed flashcard flip state not resetting between cards
- Upgraded Next.js from 14.2.35 to 16.2.1
- Upgraded React from 18 to 19.2.4
- Upgraded ESLint from 8 to 10.1.0
- Implemented full bilingual support for all pages (flashcards, quiz, exam)
- Fixed translation key structure mismatches
- Simplified language toggle component with better UX
- Created comprehensive translation keys for all UI elements

### Development Commands
- `npm dev` - Start development server (use this, not npx)
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm test` - Run tests with vitest
- `npm run test:e2e` - Run Playwright E2E tests

### Known Issues/Warnings
- Middleware file convention is deprecated in Next.js 16, should use "proxy" instead
- Prisma 7.x has breaking changes with adapter configuration; currently using 5.22.0 for stability
