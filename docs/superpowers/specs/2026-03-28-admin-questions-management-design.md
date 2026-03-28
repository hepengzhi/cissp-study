# Admin Questions Management Design

Date: 2026-03-28

## Overview

Add an independent admin backend at `/admin` for managing CISSP study content. Phase 1 focuses on **question (题目) management** with CRUD, search/filter, and CSV/JSON import with preview. Follows existing project patterns: Server Actions with Zod validation, Prisma ORM, Vitest TDD.

## Scope

- Independent `/admin` route with sidebar navigation layout
- Question CRUD: create, read, update, delete, batch delete
- Import: CSV and JSON file upload with preview-before-confirm flow
- Export: download questions as JSON/CSV
- Single question add form with bilingual fields
- No authentication required (open access, consistent with current project)
- Flashcard and exam management reserved for future phases

## Route Structure

```
app/[locale]/admin/
├── layout.tsx              # Admin layout: fixed sidebar + content area
├── page.tsx                # Admin dashboard (stats overview)
├── questions/
│   ├── page.tsx            # Question list (search, filter, batch ops)
│   ├── new/page.tsx        # Single question add form
│   ├── [id]/page.tsx       # Question detail/edit
│   └── import/page.tsx     # CSV/JSON import (upload → preview → confirm)
```

Sidebar navigation items:
- Dashboard (仪表盘)
- Questions (题目管理) — Phase 1
- Flashcards (闪卡管理) — Phase 2 placeholder, greyed out
- Exams (试卷管理) — Phase 2 placeholder, greyed out
- "Return to site" link back to main app

## Admin Layout

- Fixed left sidebar (180px) with dark background, navigation links
- Right content area fills remaining width
- Sidebar shows current section highlighted
- Independent from main app's navbar — admin has its own layout
- Responsive: sidebar collapses to hamburger on mobile

## Server Actions

File: `lib/actions/questions.ts`

### Functions

| Function | Purpose | Input | Output |
|---|---|---|---|
| `getQuestions(filters)` | Paginated list with search/filter | `{ search?, domain?, difficulty?, page, pageSize }` | `{ data: Question[], total: number, page: number }` |
| `getQuestionById(id)` | Single question detail | `string` | `Question \| null` |
| `createQuestion(data)` | Create single question | Validated question data | `Question \| { error: string }` |
| `updateQuestion(id, data)` | Update question | `id + validated data` | `Question \| { error: string }` |
| `deleteQuestion(id)` | Delete single question | `string` | `{ success: boolean } \| { error: string }` |
| `deleteQuestions(ids)` | Batch delete | `string[]` | `{ deleted: number } \| { error: string }` |
| `parseImportFile(content, format)` | Parse CSV/JSON to question array; converts JSON options object → array, letter answer → index | `string + 'csv'\|'json'` | `{ data: ParsedRow[], total: number, errors: ParseError[] } \| { error: string }` |
| `importQuestions(data[])` | Write parsed questions to DB | `ParsedQuestion[]` | `{ imported: number, errors: number } \| { error: string }` |
| `exportQuestions(filters, format)` | Export as JSON/CSV | `filters + 'csv'\|'json'` | `string (file content)` |

### Zod Validation Schema

```typescript
const QuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionTextZh: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(6),
  optionsZh: z.array(z.string()).optional(),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().min(1, 'Explanation is required'),
  explanationZh: z.string().optional(),
  domain: z.nativeEnum(Domain),
  difficulty: z.nativeEnum(Difficulty),
  tags: z.array(z.string()).default([]),
})
```

Validation rules:
- `questionText` required, `questionTextZh` optional (bilingual graceful degradation)
- `options` requires 2-6 items, each non-empty
- `correctAnswer` must be valid index into options array
- If `optionsZh` provided, must match `options` length
- `domain` and `difficulty` must be valid enum values

### Error Handling Pattern

Follows existing pattern from `lib/actions/flashcards.ts`:
- Zod validation errors → `{ error: 'Validation failed: ...' }`
- Prisma errors → `{ error: error.message }`
- Unknown errors → `{ error: 'Unknown error occurred' }`

## Import Flow

```
1. User uploads CSV or JSON file on /admin/questions/import
2. Client reads file content, sends to parseImportFile(content, format)
3. Server parses and validates each row:
   - Returns array of parsed questions with validation status per row
   - Invalid rows marked with error message
4. Client displays preview table showing all rows:
   - Valid rows: green checkmark, editable
   - Invalid rows: red X with error, excluded from import
   - User can deselect rows to exclude
5. User clicks "Confirm Import"
6. Client calls importQuestions(selectedRows) to write to DB
7. Server returns { imported: N, errors: M }
8. Client shows success/error summary
```

### CSV Format

```csv
questionText,questionTextZh,options,optionsZh,correctAnswer,explanation,explanationZh,domain,difficulty,tags
"What is X?","X是什么？","A|B|C|D","甲|乙|丙|丁",0,"Because...","因为...",SECURITY_RISK_MANAGEMENT,EASY,"tag1|tag2"
```

- Options separated by `|`
- Tags separated by `|`
- First row must be header
- `optionsZh` and all `*Zh` fields optional
- `correctAnswer` is 0-based index

### JSON Format

```json
{
  "total_questions": 401,
  "questions": [
    {
      "question_id": "dc409adaef081694b5bb0c3adfdd6913",
      "domain": "SECURITY_RISK_MANAGEMENT",
      "type": "single_choice",
      "questionText": "english version",
      "questionTextZh": "1.Alyssa负责她组织的安全意识程序...",
      "options": {
        "A": "游戏化",
        "B": "基于计算机的培训",
        "C": "内容审查",
        "D": "在线培训"
      },
      "correctAnswer": "C",
      "explanation": "游戏化使培训变得更加有趣...",
      "question_images": ["data:image/jpeg;base64,<IMAGE_BASE64_CODE>"],
      "difficulty": "EASY",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

- `total_questions`: metadata, not strictly validated
- `question_id`: optional external identifier (not used as DB primary key)
- `type`: reserved for future use, only "single_choice" supported for now
- `options`: object with letter keys (A-Z), values are option text (can be any language)
- `correctAnswer`: letter string matching an option key (e.g., "C")
- `question_images`: optional array of base64 data URLs, stored as-is (not in current DB schema — future enhancement)
- `questionTextZh`, `explanationZh`: optional, for bilingual content
- Parser converts `options` object → `string[]` array and `correctAnswer` letter → 0-based index for DB storage

## Question List Page

- Search bar: full-text search on `questionText`
- Filters: domain dropdown, difficulty dropdown
- Table columns: checkbox, question text (truncated), domain, difficulty, tags, actions
- Batch operations: select all, batch delete, batch export
- Pagination: page size 20, shows total count
- Each row: edit button → `/admin/questions/[id]`, delete with confirmation dialog

## Single Question Form

- Bilingual fields: question text (en/zh), options (en/zh), explanation (en/zh)
- Domain select dropdown (8 CISSP domains)
- Difficulty select (Easy/Medium/Hard)
- Tags input (comma-separated)
- Options: dynamic add/remove (2-6 options)
- correctAnswer: radio button selection among options
- Preview panel shows how question will look

## Admin Dashboard

- Stats cards: total questions, by domain breakdown, by difficulty breakdown
- Recent activity: last 5 questions added
- Quick actions: add question, import questions

## TDD Strategy

### Test File: `tests/actions/questions.test.ts`

Follows existing patterns from `tests/actions/flashcards.test.ts`:
- Uses `mockPrisma` from `tests/prisma-mock.ts`
- `beforeEach(() => vi.clearAllMocks())`
- No `@testing-library` for server actions

#### Test Categories Per Function

**getQuestions:**
- Returns paginated results with filters
- Returns empty list for no matches
- Handles database error

**createQuestion:**
- Creates question with valid data
- Returns validation error for empty questionText
- Returns validation error for invalid domain
- Returns validation error for correctAnswer out of range
- Returns validation error for options fewer than 2
- Handles database error
- Creates with optional Zh fields omitted
- Creates with tags array

**updateQuestion:**
- Updates question with valid data
- Returns error for non-existent id
- Returns validation error for invalid data
- Handles database error

**deleteQuestion:**
- Deletes successfully
- Returns error for non-existent id
- Handles database error

**deleteQuestions (batch):**
- Deletes multiple by ids
- Returns count of deleted
- Handles empty ids array
- Handles database error

**parseImportFile:**
- Parses valid JSON with `total_questions` + `questions` array
- Parses valid CSV with headers
- Converts JSON `options` object `{A: "...", B: "..."}` → `string[]` array
- Converts JSON `correctAnswer` letter "C" → 0-based index 2
- Returns error for invalid JSON
- Returns error for invalid CSV format
- Returns error for missing required fields in rows
- Handles mixed valid/invalid rows (valid ones parsed, invalid ones flagged)
- Handles optional Zh fields gracefully
- Ignores `question_id`, `type`, `total_questions` gracefully

**importQuestions:**
- Imports all valid questions
- Returns imported count
- Skips rows that fail validation
- Handles database error mid-import (partial success)

**exportQuestions:**
- Exports all as JSON string
- Exports filtered as CSV string
- Handles empty result set

## File Dependencies

### New Files
- `app/[locale]/admin/layout.tsx` — admin layout with sidebar
- `app/[locale]/admin/page.tsx` — admin dashboard
- `app/[locale]/admin/questions/page.tsx` — question list
- `app/[locale]/admin/questions/new/page.tsx` — add form
- `app/[locale]/admin/questions/[id]/page.tsx` — edit form
- `app/[locale]/admin/questions/import/page.tsx` — import page
- `lib/actions/questions.ts` — all question server actions
- `tests/actions/questions.test.ts` — TDD tests
- `components/admin-sidebar.tsx` — sidebar navigation component

### Modified Files
- `components/navbar.tsx` — add admin link in main navbar
- `locales/en.json` — add admin translation keys
- `locales/zh.json` — add admin translation keys

### No Database Changes
- Existing `Question` model in `prisma/schema.prisma` covers all required fields
- No migration needed

## Future Phases (Out of Scope)

- Phase 2: Flashcard management (enhance existing CRUD + import)
- Phase 3: Exam management (history, analytics)
- Authentication/authorization if needed later
