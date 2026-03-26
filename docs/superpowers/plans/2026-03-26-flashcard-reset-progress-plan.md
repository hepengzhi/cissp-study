# Flashcard Reset Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Reset Progress" button to the flashcards page that resets all flashcard review progress to initial SM-2 values.

**Architecture:** Server-side action using Prisma's `updateMany()` for batch database update, client-side button with confirmation dialog, bilingual translations via next-intl.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, Prisma ORM 5.22.0, next-intl 4.8.3, TypeScript, Vitest

---

## File Structure

**Files to create:**
- None

**Files to modify:**
- `lib/actions/flashcards.ts` - Add `resetAllFlashcardProgress()` server action
- `tests/actions/flashcards.test.ts` - Add tests for the new action
- `locales/en.json` - Add English translation keys
- `locales/zh.json` - Add Chinese translation keys
- `app/[locale]/flashcards/page.tsx` - Add reset button and handler

---

### Task 1: Add resetAllFlashcardProgress server action

**Files:**
- Modify: `lib/actions/flashcards.ts:175` (add at end of file, before closing brace)

- [ ] **Step 1: Write the failing test**

Add this test to `tests/actions/flashcards.test.ts` at the end of the file (before the closing `})`):

```typescript
  describe('resetAllFlashcardProgress', () => {
    it('should reset all flashcard progress to initial values', async () => {
      const now = new Date()
      const mockResult = { count: 5 }

      mockPrisma.flashcard.updateMany.mockResolvedValue(mockResult)

      const result = await resetAllFlashcardProgress()

      expect(mockPrisma.flashcard.updateMany).toHaveBeenCalledWith({
        data: {
          nextReview: expect.any(Date),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0
        }
      })
      expect(result).toEqual({ success: true, count: 5 })
    })

    it('should return success with zero count when no cards exist', async () => {
      const mockResult = { count: 0 }

      mockPrisma.flashcard.updateMany.mockResolvedValue(mockResult)

      const result = await resetAllFlashcardProgress()

      expect(result).toEqual({ success: true, count: 0 })
    })

    it('should return error on database failure', async () => {
      mockPrisma.flashcard.updateMany.mockRejectedValue(new Error('Connection lost'))

      const result = await resetAllFlashcardProgress()

      expect(result).toEqual({ error: 'Connection lost' })
    })
  })
```

Also add the import at the top of the test file:

```typescript
import { createFlashcard, getDueCards, rateFlashcard, getAllFlashcards, resetAllFlashcardProgress } from '@/lib/actions/flashcards'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- flashcards.test.ts`

Expected: FAIL with "resetAllFlashcardProgress is not defined"

- [ ] **Step 3: Write minimal implementation**

Add this function to `lib/actions/flashcards.ts` at the end of the file (before the closing brace of the file, after the `deleteFlashcard` function):

```typescript
export async function resetAllFlashcardProgress() {
  try {
    const result = await prisma.flashcard.updateMany({
      data: {
        nextReview: new Date(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0
      }
    })

    return { success: true, count: result.count }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- flashcards.test.ts`

Expected: PASS for all tests in resetAllFlashcardProgress describe block

- [ ] **Step 5: Commit**

```bash
git add lib/actions/flashcards.ts tests/actions/flashcards.test.ts
git commit -m "feat: add resetAllFlashcardProgress server action with tests"
```

---

### Task 2: Add English translations

**Files:**
- Modify: `locales/en.json:87-117` (flashcards section)

- [ ] **Step 1: Add reset-related translation keys to en.json**

Add these keys to the `flashcards` object in `locales/en.json` (add after the `flip` key, at line 116):

```json
    "resetProgress": "Reset Progress",
    "resetConfirm": "Reset All Progress?",
    "resetConfirmMessage": "This will reset the review progress of ALL flashcards to their initial values. This action cannot be undone.",
    "resetSuccess": "Successfully reset {count} flashcards",
    "resetError": "Failed to reset progress: {error}"
```

Also add to the `common` object (after the `confirm` key at line 18):

```json
    "reset": "Reset"
```

- [ ] **Step 2: Verify JSON is valid**

Run: `cat locales/en.json | jq .`

Expected: Valid JSON output without errors

- [ ] **Step 3: Commit**

```bash
git add locales/en.json
git commit -m "feat: add English translations for reset progress feature"
```

---

### Task 3: Add Chinese translations

**Files:**
- Modify: `locales/zh.json:87-117` (flashcards section)

- [ ] **Step 1: Add reset-related translation keys to zh.json**

Add these keys to the `flashcards` object in `locales/zh.json` (add after the `flip` key at line 116):

```json
    "resetProgress": "重置进度",
    "resetConfirm": "重置所有进度？",
    "resetConfirmMessage": "这将把所有闪卡的复习进度重置为初始值。此操作无法撤销。",
    "resetSuccess": "成功重置 {count} 张闪卡",
    "resetError": "重置进度失败: {error}"
```

Also add to the `common` object (after the `confirm` key at line 18):

```json
    "reset": "重置"
```

- [ ] **Step 2: Verify JSON is valid**

Run: `cat locales/zh.json | jq .`

Expected: Valid JSON output without errors

- [ ] **Step 3: Commit**

```bash
git add locales/zh.json
git commit -m "feat: add Chinese translations for reset progress feature"
```

---

### Task 4: Add state management for reset functionality

**Files:**
- Modify: `app/[locale]/flashcards/page.tsx:40` (state declarations)

- [ ] **Step 1: Add reset-related state variables**

Add these state declarations after the existing `stats` state (after line 40):

```typescript
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
```

- [ ] **Step 2: Commit**

```bash
git add app/\[locale\]/flashcards/page.tsx
git commit -m "feat: add state for reset progress functionality"
```

---

### Task 5: Add reset handler function

**Files:**
- Modify: `app/[locale]/flashcards/page.tsx:83` (after handleRate function)

- [ ] **Step 1: Add handleReset function**

Add this function after the `handleRate` function (after line 82):

```typescript
  const handleReset = async () => {
    const tCommon = useTranslations('common')

    if (!window.confirm(tFlashcards('resetConfirm') + '\n\n' + tFlashcards('resetConfirmMessage'))) {
      return
    }

    setIsResetting(true)
    setResetMessage(null)

    const { resetAllFlashcardProgress } = await import('@/lib/actions/flashcards')
    const result = await resetAllFlashcardProgress()

    if (result && 'error' in result) {
      setResetMessage({
        type: 'error',
        text: tFlashcards('resetError', { error: result.error })
      })
    } else {
      setResetMessage({
        type: 'success',
        text: tFlashcards('resetSuccess', { count: result.count })
      })
      await loadCards()
    }

    setIsResetting(false)

    setTimeout(() => {
      setResetMessage(null)
    }, 5000)
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/\[locale\]/flashcards/page.tsx
git commit -m "feat: add handleReset function with confirmation"
```

---

### Task 6: Add reset button to header

**Files:**
- Modify: `app/[locale]/flashcards/page.tsx:126-141` (empty state header section)

- [ ] **Step 1: Add reset button to empty state header**

Find the header section in the empty state (around line 127-140) and add the reset button. Replace the header div:

```typescript
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-[#9fef00]" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{tFlashcards('title')}</h1>
                  <p className="text-[#718096] text-sm">{tFlashcards('description')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  disabled={isResetting}
                  variant="outline"
                  className="htb-button-destructive text-sm border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isResetting ? '...' : tFlashcards('resetProgress')}
                </Button>
                <Link href={`/${locale}/flashcards/manage`}>
                  <Button className="htb-button-outline text-sm">
                    Manage Cards
                  </Button>
                </Link>
              </div>
            </div>
```

- [ ] **Step 2: Add reset button to active review header**

Find the header section when cards are being reviewed (around line 189-201) and add the reset button. Replace the header div:

```typescript
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
          <div className="flex items-center gap-3">
            <Button
              onClick={handleReset}
              disabled={isResetting}
              variant="outline"
              className="htb-button-destructive text-sm border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {isResetting ? '...' : tFlashcards('resetProgress')}
            </Button>
            <DomainFilter value={domain} />
          </div>
        </div>
```

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/flashcards/page.tsx
git commit -m "feat: add reset progress button to flashcards page"
```

---

### Task 7: Add status message display

**Files:**
- Modify: `app/[locale]/flashcards/page.tsx:202` (after progress bar)

- [ ] **Step 1: Add status message after progress bar**

Add this code after the progress bar div (after line 209, before the Flashcard div):

```typescript
        {/* Status Message */}
        {resetMessage && (
          <div className={`max-w-2xl mx-auto p-4 rounded-lg ${
            resetMessage.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {resetMessage.text}
          </div>
        )}
```

- [ ] **Step 2: Commit**

```bash
git add app/\[locale\]/flashcards/page.tsx
git commit -m "feat: add status message display for reset progress"
```

---

### Task 8: Add RefreshCcw icon import

**Files:**
- Modify: `app/[locale]/flashcards/page.tsx:12` (imports)

- [ ] **Step 1: Verify RefreshCcw is imported**

Check that `RefreshCcw` is already imported from lucide-react at line 12. The import should be:

```typescript
import { Brain, CheckCircle, XCircle, RotateCcw, ChevronRight, RefreshCcw } from 'lucide-react'
```

If `RefreshCcw` is not already imported, add it to the import statement.

Note: The existing code uses `RotateCcw`, which is the correct icon. No changes needed for this step.

- [ ] **Step 2: Skip commit if no changes needed**

If no import changes were needed, skip this commit.

---

### Task 9: Run manual testing

**Files:**
- None (manual verification)

- [ ] **Step 1: Start dev server**

Run: `npm dev`

Expected: Server starts successfully on localhost:3000

- [ ] **Step 2: Test reset with existing cards**

1. Navigate to `/flashcards` in your browser
2. Verify the "Reset Progress" button is visible in the header
3. Click the button
4. Verify confirmation dialog appears with correct text
5. Click "Cancel" and verify no changes occur
6. Click the button again and confirm
7. Verify success message appears
8. Verify all cards become available for review immediately

- [ ] **Step 3: Test bilingual functionality**

1. Switch language to Chinese
2. Verify all reset-related text is in Chinese
3. Click reset button and verify confirmation dialog is in Chinese
4. Confirm reset and verify success message is in Chinese

- [ ] **Step 4: Test error handling**

Simulate an error by:
1. Temporarily modify `resetAllFlashcardProgress` to throw an error
2. Reset and verify error message displays correctly
3. Revert the change

- [ ] **Step 5: Test with no cards**

1. Delete all flashcards from database
2. Navigate to flashcards page
3. Click reset button
4. Verify success message shows "0 flashcards" or handles gracefully

- [ ] **Step 6: Stop dev server**

Run: `Ctrl+C` in the terminal where dev server is running

---

### Task 10: Final verification and cleanup

**Files:**
- None

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: All tests pass, including new resetAllFlashcardProgress tests

- [ ] **Step 2: Build the project**

Run: `npm run build`

Expected: Build completes without errors

- [ ] **Step 3: Review changes**

Run: `git diff main`

Expected: Only expected files modified (flashcards.ts, test file, locale files, page.tsx)

- [ ] **Step 4: Merge to main if approved**

If all tests pass and manual testing is successful, create a pull request or merge as per project workflow.

---

## Self-Review Checklist

**Spec Coverage:**
- [x] FR-1: Users can reset all flashcard review progress from the flashcards page - Task 6
- [x] FR-2: Reset action requires user confirmation - Task 5
- [x] FR-3: After successful reset, all cards should be immediately available for review - Task 5 (calls loadCards())
- [x] FR-4: The reset affects ALL flashcards regardless of domain - Task 1 (updateMany with no filter)
- [x] FR-5: Success and error messages must be displayed to the user - Task 7
- [x] NFR-1: Action should complete within 2 seconds for up to 1000 cards - Uses single updateMany query
- [x] NFR-2: UI must be consistent with existing design patterns - Uses existing Button component and htb-button classes
- [x] NFR-3: All user-facing text must support bilingual translations - Tasks 2 and 3

**Placeholder Scan:**
- [x] No TBD, TODO, or "implement later" placeholders
- [x] All code steps include complete implementations
- [x] All test code is complete and executable

**Type Consistency:**
- [x] `FlashcardActionResponse` type consistent across all references
- [x] Function name `resetAllFlashcardProgress` consistent across all tasks
- [x] Translation key names match between en.json and zh.json
- [x] State variable names consistent (`isResetting`, `resetMessage`)

**Edge Cases Covered:**
- [x] No flashcards exist (Task 1 test, Task 9 step 5)
- [x] Database connection error (Task 1 test, Task 9 step 4)
- [x] User cancels confirmation (Task 5 implementation)
- [x] Bilingual support (Tasks 2, 3, and 9 step 3)
