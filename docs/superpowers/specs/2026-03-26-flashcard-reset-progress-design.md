# Flashcard Reset Progress Feature Design

**Date:** 2026-03-26
**Author:** Claude
**Status:** Draft

## Overview

Add a "Reset Progress" button to the flashcards review page that allows users to reset all flashcard review progress to initial values. This is useful when a user wants to restart their spaced repetition learning from scratch.

## Goals

1. Allow users to reset all flashcard review progress with a single action
2. Prevent accidental resets through confirmation dialog
3. Provide clear feedback on success or failure
4. Support bilingual UI (English and Chinese)

## Requirements

### Functional Requirements

- **FR-1:** Users can reset all flashcard review progress from the flashcards page
- **FR-2:** Reset action requires user confirmation
- **FR-3:** After successful reset, all cards should be immediately available for review
- **FR-4:** The reset affects ALL flashcards regardless of domain
- **FR-5:** Success and error messages must be displayed to the user

### Non-Functional Requirements

- **NFR-1:** Action should complete within 2 seconds for up to 1000 cards
- **NFR-2:** UI must be consistent with existing design patterns
- **NFR-3:** All user-facing text must support bilingual translations

## Architecture

### Database Schema

No schema changes required. The `Flashcard` model already has all necessary fields:

```prisma
model Flashcard {
  id          String   @id @default(cuid())
  front       String
  frontZh     String?
  back        String
  backZh      String?
  domain      Domain
  nextReview  DateTime
  interval    Int
  easeFactor  Float
  repetitions Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Data Flow

```
User clicks button
    ↓
Confirmation dialog
    ↓ (user confirms)
Server Action: resetAllFlashcardProgress()
    ↓
Prisma: updateMany() all Flashcard records
    ↓
Update fields: nextReview=now(), interval=0, easeFactor=2.5, repetitions=0
    ↓
Return success/error
    ↓
UI shows message and reloads cards
```

### API

**New Server Action:**

```typescript
// lib/actions/flashcards.ts
export async function resetAllFlashcardProgress(): Promise<FlashcardActionResponse>
```

**Response Type:**

```typescript
type FlashcardActionResponse =
  | { success: true; count: number }  // Number of cards reset
  | { error: string }
```

## Components

### 1. Server Action (`lib/actions/flashcards.ts`)

**Function:** `resetAllFlashcardProgress()`

**Behavior:**
- Updates ALL flashcard records in the database
- Sets each card to initial SM2 state:
  - `nextReview`: `new Date()` (immediate review)
  - `interval`: `0`
  - `easeFactor`: `2.5`
  - `repetitions`: `0`
- Returns count of affected cards on success
- Returns error message on failure

### 2. UI Button (`app/[locale]/flashcards/page.tsx`)

**Location:** Header section, next to "Manage Cards" link

**Properties:**
- Text: "Reset Progress" / "重置进度"
- Style: Warning/destructive variant (red/orange)
- Action: Opens confirmation dialog

### 3. Confirmation Dialog

**Implementation:** Use `window.confirm()` for simplicity (no Alert Dialog component available)

**Dialog Content:**
- Title: "Reset All Progress?" / "重置所有进度？"
- Message: "This will reset the review progress of ALL flashcards to their initial values. This action cannot be undone." / "这将把所有闪卡的复习进度重置为初始值。此操作无法撤销。"
- Buttons: "Cancel" / "取消", "Reset" / "重置"

### 4. Status Messages

**Success Message:**
- English: "Successfully reset {count} flashcards"
- Chinese: "成功重置 {count} 张闪卡"

**Error Message:**
- English: "Failed to reset progress: {error}"
- Chinese: "重置进度失败: {error}"

## Implementation Plan

### Phase 1: Server Action

1. Add `resetAllFlashcardProgress()` function to `lib/actions/flashcards.ts`
2. Use `prisma.flashcard.updateMany()` for batch update
3. Implement error handling
4. Add unit test for the action

### Phase 2: Translations

1. Add translation keys to `locales/en.json`:
   - `flashcards.resetProgress`
   - `flashcards.resetConfirm`
   - `flashcards.resetConfirmMessage`
   - `flashcards.resetSuccess`
   - `flashcards.resetError`
   - `common.cancel`
   - `common.reset`

2. Add corresponding Chinese translations to `locales/zh.json`

### Phase 3: UI Integration

1. Add reset button to page header in `app/[locale]/flashcards/page.tsx`
2. Add `isResetting` state for loading indication
3. Implement click handler with confirmation dialog
4. Add success/error state and message display
5. Trigger `loadCards()` after successful reset

### Phase 4: Testing

1. Manual testing with various scenarios:
   - Reset with 0 cards
   - Reset with 1 card
   - Reset with 100+ cards
   - Cancel the confirmation dialog
   - Simulated database error

2. Verify bilingual UI works correctly

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No flashcards exist | Show "No cards to reset" message or button remains clickable but affects 0 cards |
| Database connection error | Show error message to user |
| User cancels confirmation | No action taken, no database changes |
| Concurrent review session | Reset takes effect on next card load, current session unaffected |

## Security Considerations

- Action is server-side, cannot be tampered with from client
- No additional authentication needed (same as existing actions)
- Consider adding rate limiting if abused in production

## Performance

- Uses Prisma's `updateMany()` for single database query
- Should handle 10,000+ cards efficiently
- No need for pagination or batching

## Future Enhancements (Out of Scope)

- Reset by domain only
- Reset individual cards
- Reset progress history tracking
- Export/import of progress state
