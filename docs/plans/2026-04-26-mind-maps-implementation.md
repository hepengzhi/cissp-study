# Mind Maps Feature Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add interactive mind maps (knowledge graphs) to the CISSP study platform — one per CISSP domain, with React Flow canvas, full CRUD for nodes/edges, bilingual support, and linking to flashcards/questions.

**Architecture:** Next.js 16 App Router pages under `app/[locale]/mindmaps/`, React Flow v12 (`@xyflow/react`) for the canvas, Prisma models for persistence, server actions in `lib/actions/mindmaps.ts`, custom React Flow node/edge components in `components/mindmap/`.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, Tailwind CSS, Prisma 5.22, Zod, next-intl, @xyflow/react, Vitest, Playwright.

**Prisma note:** Both `@/prisma/config` and `@/lib/prisma` export `prisma` (singleton). Use `@/prisma/config` for new actions to stay consistent with questions/exam actions. Tests mock both paths via `tests/prisma-mock.ts`.

---

### Task 1: Add Prisma models for MindMap, MindMapNode, MindMapEdge

**Objective:** Define the 3 new models in Prisma schema and create migration.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/` (auto-generated)

**Step 1: Add models to schema.prisma**

```prisma
model MindMap {
  id        String   @id @default(cuid())
  domain    Domain   @unique
  nodes     MindMapNode[]
  edges     MindMapEdge[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model MindMapNode {
  id                String    @id @default(cuid())
  mindMapId         String
  label             String
  labelZh           String?
  description       String?
  descriptionZh     String?
  positionX         Float
  positionY         Float
  color             String?
  linkedFlashcardId String?
  linkedQuestionId  String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  mindMap     MindMap    @relation(fields: [mindMapId], references: [id], onDelete: Cascade)
  flashcard   Flashcard? @relation(fields: [linkedFlashcardId], references: [id], onDelete: SetNull)
  question    Question?  @relation(fields: [linkedQuestionId], references: [id], onDelete: SetNull)
  sourceEdges MindMapEdge[] @relation("SourceNode")
  targetEdges MindMapEdge[] @relation("TargetNode")
}

model MindMapEdge {
  id           String  @id @default(cuid())
  mindMapId    String
  sourceNodeId String
  targetNodeId String
  label        String?
  labelZh      String?
  createdAt    DateTime @default(now())

  mindMap    MindMap      @relation(fields: [mindMapId], references: [id], onDelete: Cascade)
  sourceNode MindMapNode  @relation("SourceNode", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode MindMapNode  @relation("TargetNode", fields: [targetNodeId], references: [id], onDelete: Cascade)

  @@unique([mindMapId, sourceNodeId, targetNodeId])
}
```

**Step 2: Generate migration**

```bash
npx prisma migrate dev --name add_mindmap_models
```

**Step 3: Verify Prisma client regenerates**

```bash
npx prisma generate
```

**Step 4: Verify schema compiles**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add MindMap, MindMapNode, MindMapEdge models"
```

---

### Task 2: Create server actions for mind maps

**Objective:** Create `lib/actions/mindmaps.ts` with all 7 server actions.

**Files:**
- Create: `lib/actions/mindmaps.ts`

**Reference patterns:**
- Import: `import { prisma } from '@/prisma/config'` (like questions.ts, not lib/prisma)
- Zod validation + try/catch + error handling pattern from `flashcards.ts`
- Domain enum: use `z.nativeEnum(Domain)` imported from `@prisma/client`
- Return: `{ success: true, data }` or `{ error: string }`

**Actions to implement (exact signatures):**

```typescript
'use server'

import { prisma } from '@/prisma/config'
import { z } from 'zod'
import { Domain } from '@prisma/client'

// --- Input schemas ---
const CreateNodeSchema = z.object({
  mindMapId: z.string().min(1),
  label: z.string().min(1),
  labelZh: z.string().optional(),
  description: z.string().optional(),
  descriptionZh: z.string().optional(),
  positionX: z.number().default(250),
  positionY: z.number().default(250),
  color: z.string().optional(),
  linkedFlashcardId: z.string().optional(),
  linkedQuestionId: z.string().optional(),
})

const UpdateNodeSchema = z.object({
  label: z.string().min(1).optional(),
  labelZh: z.string().optional(),
  description: z.string().optional(),
  descriptionZh: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  color: z.string().optional(),
  linkedFlashcardId: z.string().nullable().optional(),
  linkedQuestionId: z.string().nullable().optional(),
})

const CreateEdgeSchema = z.object({
  mindMapId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().optional(),
  labelZh: z.string().optional(),
})

const UpdateEdgeSchema = z.object({
  label: z.string().optional(),
  labelZh: z.string().optional(),
})

// --- Action 1: getMindMapByDomain ---
export async function getMindMapByDomain(domain: Domain) {
  // Auto-create mind map if none exists
  // Return mind map with all nodes and edges
}

// --- Action 2: createNode ---
export async function createNode(data: z.infer<typeof CreateNodeSchema>) {
  // Zod validate, then prisma.mindMapNode.create
}

// --- Action 3: updateNode ---
export async function updateNode(nodeId: string, data: z.infer<typeof UpdateNodeSchema>) {
  // Zod validate, then prisma.mindMapNode.update
}

// --- Action 4: deleteNode ---
export async function deleteNode(nodeId: string) {
  // prisma.mindMapNode.delete (cascade handles edges)
}

// --- Action 5: createEdge ---
export async function createEdge(data: z.infer<typeof CreateEdgeSchema>) {
  // Check for duplicate edge first, then create
}

// --- Action 6: updateEdge ---
export async function updateEdge(edgeId: string, data: z.infer<typeof UpdateEdgeSchema>) {
  // prisma.mindMapEdge.update
}

// --- Action 7: deleteEdge ---
export async function deleteEdge(edgeId: string) {
  // prisma.mindMapEdge.delete
}

// --- Action 8: getMindMapStats ---
export async function getMindMapStats() {
  // Return { domain, nodeCount, edgeCount, lastEdited } per domain
}
```

**Step 1: Create `lib/actions/mindmaps.ts`** with complete implementations following the patterns from `flashcards.ts` and `questions.ts`.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add lib/actions/mindmaps.ts
git commit -m "feat: add mind map server actions (CRUD + stats)"
```

---

### Task 3: Write unit tests for mind map server actions

**Objective:** Create `tests/actions/mindmaps.test.ts` covering all actions with TDD patterns.

**Files:**
- Create: `tests/actions/mindmaps.test.ts`
- Modify: `tests/prisma-mock.ts` (add mindMap, mindMapNode, mindMapEdge mocks)

**Test categories per action (following existing test patterns):**

```
describe('MindMaps Actions')
  describe('getMindMapByDomain')
    it('should return existing mind map with nodes and edges')
    it('should auto-create mind map if none exists for domain')
    it('should return database error on failure')

  describe('createNode')
    it('should create a node with required fields')
    it('should create a node with all optional fields')
    it('should return validation error for empty label')
    it('should return validation error for missing mindMapId')
    it('should return database error on failure')

  describe('updateNode')
    it('should update node label')
    it('should update node position')
    it('should return validation error for empty label')
    it('should return database error on failure')

  describe('deleteNode')
    it('should delete a node')
    it('should return database error on failure')

  describe('createEdge')
    it('should create an edge')
    it('should return error for duplicate edge')
    it('should return validation error for missing sourceNodeId')
    it('should return database error on failure')

  describe('updateEdge')
    it('should update edge label')
    it('should return database error on failure')

  describe('deleteEdge')
    it('should delete an edge')
    it('should return database error on failure')

  describe('getMindMapStats')
    it('should return stats for all 8 domains')
    it('should return zero counts for empty mind maps')
```

**Step 1: Add MindMap mocks to `tests/prisma-mock.ts`**

```typescript
mindMap: {
  findUnique: vi.fn(),
  create: vi.fn(),
},
mindMapNode: {
  create: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
},
mindMapEdge: {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  findFirst: vi.fn(),
},
```

**Step 2: Write all tests** following the pattern from `flashcards.test.ts`.

**Step 3: Run tests to verify they fail (RED phase)**

```bash
npm test -- tests/actions/mindmaps.test.ts
```

Expected: tests fail because actions don't exist yet (or fail if actions already written in Task 2).

**Step 4: Commit**

```bash
git add tests/actions/mindmaps.test.ts tests/prisma-mock.ts
git commit -m "test: add mind map server action tests"
```

---

### Task 4: Add i18n translation keys for mind maps

**Objective:** Add all mindmap.* translation keys to both locale files.

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/zh.json`

**Keys to add under `"mindmaps"` namespace:**

```json
{
  "mindmaps": {
    "title": "Mind Maps",
    "description": "Interactive knowledge graphs for each CISSP domain",
    "nodes": "nodes",
    "edges": "connections",
    "lastEdited": "Last edited",
    "addNode": "Add Node",
    "editNode": "Edit Node",
    "deleteNode": "Delete Node",
    "connectNodes": "Connect Nodes",
    "editEdge": "Edit Connection",
    "deleteEdge": "Delete Connection",
    "autoLayout": "Auto Layout",
    "fitView": "Fit View",
    "label": "Label",
    "labelZh": "Label (中文)",
    "description": "Description",
    "descriptionZh": "Description (中文)",
    "color": "Color",
    "linkFlashcard": "Link to Flashcard",
    "linkQuestion": "Link to Question",
    "confirmDeleteNode": "Delete this node and all its connections?",
    "confirmDeleteEdge": "Delete this connection?",
    "none": "No mind maps yet — start by clicking a domain!",
    "emptyDomain": "No nodes yet. Double-click the canvas or use the toolbar to add a concept."
  }
}
```

**Chinese translations (zh.json):**

```json
{
  "mindmaps": {
    "title": "思维导图",
    "description": "每个CISSP域的交互式知识图谱",
    "nodes": "节点",
    "edges": "连接",
    "lastEdited": "最后编辑",
    "addNode": "添加节点",
    "editNode": "编辑节点",
    "deleteNode": "删除节点",
    "connectNodes": "连接节点",
    "editEdge": "编辑连接",
    "deleteEdge": "删除连接",
    "autoLayout": "自动布局",
    "fitView": "适应视图",
    "label": "标签",
    "labelZh": "标签 (中文)",
    "description": "描述",
    "descriptionZh": "描述 (中文)",
    "color": "颜色",
    "linkFlashcard": "关联闪卡",
    "linkQuestion": "关联题目",
    "confirmDeleteNode": "确定删除此节点及其所有连接？",
    "confirmDeleteEdge": "确定删除此连接？",
    "none": "暂无思维导图 — 点击一个域开始！",
    "emptyDomain": "暂无节点。双击画布或使用工具栏添加概念。"
  }
}
```

**Step 1:** Add `"mindmaps"` block to `locales/en.json` after existing keys.

**Step 2:** Add `"mindmaps"` block to `locales/zh.json` after existing keys.

**Step 3: Commit**

```bash
git add locales/en.json locales/zh.json
git commit -m "feat: add mindmaps i18n translation keys"
```

---

### Task 5: Add mindmaps to navigation

**Objective:** Add Mind Maps link to navbar (desktop + mobile).

**Files:**
- Modify: `components/navbar.tsx`
- Modify: `locales/en.json` (nav.mindmaps key)
- Modify: `locales/zh.json` (nav.mindmaps key)

**Step 1: Add nav keys to locale files**

en.json `nav` block:
```json
"mindmaps": "Mind Maps"
```

zh.json `nav` block:
```json
"mindmaps": "思维导图"
```

**Step 2: Add nav item to navbar.tsx**

Import `Network` icon from lucide-react:
```typescript
import { Shield, FileText, Brain, ClipboardCheck, Trophy, Menu, X, Settings, Network } from 'lucide-react'
```

Add to navItems array:
```typescript
{ href: '/mindmaps', labelKey: 'mindmaps', icon: Network },
```

Place it between `/exam` and `/admin`:
```typescript
const navItems = [
  { href: '/', labelKey: 'dashboard', icon: Shield },
  { href: '/notes', labelKey: 'notes', icon: FileText },
  { href: '/flashcards', labelKey: 'flashcards', icon: Brain },
  { href: '/quiz', labelKey: 'quiz', icon: ClipboardCheck },
  { href: '/exam', labelKey: 'exam', icon: Trophy },
  { href: '/mindmaps', labelKey: 'mindmaps', icon: Network },
  { href: '/admin', labelKey: 'admin', icon: Settings },
]
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/navbar.tsx locales/en.json locales/zh.json
git commit -m "feat: add mindmaps link to navigation"
```

---

### Task 6: Create Mind Maps domain list page

**Objective:** Create `app/[locale]/mindmaps/page.tsx` — 8 domain cards in a grid.

**Files:**
- Create: `app/[locale]/mindmaps/page.tsx`
- Create: `components/mindmap/mindmap-card.tsx`

**Page pattern:** Follow `app/[locale]/notes/page.tsx` — server component, `getServerLocale()`, `getDomainLabel()`, `DomainBadge`.

**MindmapCard component:**
- Props: `domain`, `nodeCount`, `edgeCount`, `lastEdited`, `locale`
- Shows: DomainBadge with label, node/edge counts, last edited date
- Links to: `/[locale]/mindmaps/[domain]`
- Styling: `htb-card` + `hover-lift` class patterns

**Page logic:**
```typescript
import { getMindMapStats } from '@/lib/actions/mindmaps'
import { getTranslations } from 'next-intl/server'
import { CISSP_DOMAINS } from '@/lib/constants'

export default async function MindMapsPage({ params }) {
  const { locale } = await params
  const t = await getTranslations('mindmaps')
  const stats = await getMindMapStats()
  
  // Map stats to domain cards
  // Build card grid with 8 domains
}
```

**Step 1: Create `components/mindmap/mindmap-card.tsx`** — the domain card component.

**Step 2: Create `app/[locale]/mindmaps/page.tsx`** — the list page.

**Step 3: Verify page loads** (server must be running with DB)

```bash
npm run dev
# Visit http://localhost:3000/mindmaps
```

**Step 4: Commit**

```bash
git add app/[locale]/mindmaps/page.tsx components/mindmap/mindmap-card.tsx
git commit -m "feat: add mind maps domain list page"
```

---

### Task 7: Install @xyflow/react and create canvas page

**Objective:** Install React Flow, create the interactive canvas page.

**Files:**
- Modify: `package.json` (add @xyflow/react)
- Create: `app/[locale]/mindmaps/[domain]/page.tsx`

**Step 1: Install dependency**

```bash
npm install @xyflow/react
```

**Step 2: Create canvas page** `app/[locale]/mindmaps/[domain]/page.tsx`

```typescript
import { getMindMapByDomain } from '@/lib/actions/mindmaps'
import { MindMapCanvas } from '@/components/mindmap/mindmap-canvas'

export default async function MindMapDomainPage({ params }) {
  const { locale, domain } = await params
  
  // Validate domain is valid CISSP domain
  // Fetch mind map data (auto-creates if first visit)
  const result = await getMindMapByDomain(domain)
  
  return <MindMapCanvas mindMap={result.data} locale={locale} />
}
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add package.json package-lock.json app/[locale]/mindmaps/[domain]/page.tsx
git commit -m "feat: add mind map canvas page with React Flow dependency"
```

---

### Task 8: Create MindMapCanvas component (React Flow wrapper)

**Objective:** Build the core canvas component with toolbar and React Flow integration.

**Files:**
- Create: `components/mindmap/mindmap-canvas.tsx`

**Component structure:**
```typescript
'use client'

import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './concept-node'
import { RelationEdge } from './relation-edge'

const nodeTypes = { conceptNode: ConceptNode }
const edgeTypes = { relationEdge: RelationEdge }

interface Props {
  mindMap: { id: string; nodes: MindMapNode[]; edges: MindMapEdge[] }
  locale: string
}

export function MindMapCanvas({ mindMap, locale }: Props) {
  // Initialize nodes/edges from mindMap data
  // Set up toolbar actions: addNode, deleteSelected, autoLayout, fitView
  // Handle node/edge creation via server actions
  // Handle node drag → persist position
  // Side panel for editing selected node
}
```

**Toolbar buttons:**
- Add Node (double-click canvas also triggers)
- Delete Selected
- Auto Layout (apply d3 force simulation)
- Fit View

**Key behaviors:**
- Double-click canvas → create node at click position via `createNode()` server action
- Double-click node → open edit side panel
- Drag from node handle → create edge via `createEdge()` server action
- Drag node → update position via `updateNode()` on mouse up
- Select + Delete → `deleteNode()` with confirmation

**Step 1: Create `components/mindmap/mindmap-canvas.tsx`** with full React Flow setup.

**Step 2: Verify component compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/mindmap/mindmap-canvas.tsx
git commit -m "feat: add MindMapCanvas React Flow wrapper component"
```

---

### Task 9: Create custom React Flow node and edge components

**Objective:** Create cyber-themed custom node (`ConceptNode`) and edge (`RelationEdge`).

**Files:**
- Create: `components/mindmap/concept-node.tsx`
- Create: `components/mindmap/relation-edge.tsx`

**ConceptNode:**
```typescript
'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useLocale } from 'next-intl'

// Data payload includes: label, labelZh, description, descriptionZh, color, linkedFlashcardId, linkedQuestionId
export function ConceptNode({ data, selected }: NodeProps) {
  const locale = useLocale()
  const displayLabel = locale === 'zh' && data.labelZh ? data.labelZh : data.label
  
  return (
    <div className={`mindmap-node ${selected ? 'selected' : ''}`}
         style={{ borderColor: data.color || '#9fef00' }}>
      <Handle type="target" position={Position.Top} />
      <div className="mindmap-node-label">{displayLabel}</div>
      {/* Description on hover tooltip */}
      {/* Link badges for flashcard/question connections */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

**RelationEdge:**
```typescript
'use client'

import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import { useLocale } from 'next-intl'

export function RelationEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath(props)
  const locale = useLocale()
  const displayLabel = locale === 'zh' && props.data?.labelZh ? props.data.labelZh : props.label
  
  return (
    <>
      <BaseEdge path={edgePath} className="mindmap-edge" />
      {/* Edge label positioned at midpoint with cyber styling */}
    </>
  )
}
```

**Step 1: Create `concept-node.tsx`** with Handles, locale-aware label, optional description tooltip, link badges.

**Step 2: Create `relation-edge.tsx`** with bezier path, locale-aware label.

**Step 3: Verify components compile**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/mindmap/concept-node.tsx components/mindmap/relation-edge.tsx
git commit -m "feat: add custom React Flow node and edge components"
```

---

### Task 10: Create NodeEditPanel (side panel for editing)

**Objective:** Build the slide-out side panel for editing node properties.

**Files:**
- Create: `components/mindmap/node-edit-panel.tsx`

**Panel fields (from design spec):**
- Label (EN) — text input, required
- Label (ZH) — text input, optional
- Description (EN) — textarea, optional
- Description (ZH) — textarea, optional
- Color — color picker with cyber palette presets: `['#9fef00', '#00d4ff', '#ff6b6b', '#ffd93d', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894']`
- Link to Flashcard — search/select from flashcards
- Link to Question — search/select from questions

**Component signature:**
```typescript
'use client'

interface Props {
  node: MindMapNode | null
  onSave: (data: UpdateNodeInput) => Promise<void>
  onClose: () => void
}

export function NodeEditPanel({ node, onSave, onClose }: Props) {
  // Form with react-hook-form or controlled inputs
  // Color picker with preset swatches
  // Flashcard/Question search dropdowns
  // Save → calls onSave(updateNode(nodeId, data))
  // Cancel → onClose()
}
```

**Step 1: Create `components/mindmap/node-edit-panel.tsx`** with the full editing form.

**Step 2: Integrate into `mindmap-canvas.tsx`** — show panel when node is double-clicked.

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/mindmap/node-edit-panel.tsx components/mindmap/mindmap-canvas.tsx
git commit -m "feat: add node edit side panel with color picker and linking"
```

---

### Task 11: Add mind map CSS styles

**Objective:** Add mindmap-specific styles to globals.css — node, edge, toolbar, panel, canvas.

**Files:**
- Modify: `app/globals.css`

**CSS classes to add:**
```css
/* Mind Map Canvas */
.mindmap-canvas { background: #0d1117; }

/* Toolbar */
.mindmap-toolbar { /* glass-morphism, fixed left, vertical */ }

/* Concept Node */
.mindmap-node { 
  background: var(--bg-card);
  border: 2px solid #9fef00;
  border-radius: 8px;
  padding: 8px 16px;
  /* cyber glow on hover/select */
}

/* Relation Edge */
.mindmap-edge path { stroke: #9fef00; stroke-width: 2; }

/* Edit Panel */
.mindmap-edit-panel { /* slide-in from right */ }

/* Color picker presets */
.mindmap-color-swatch { width: 24px; height: 24px; border-radius: 4px; cursor: pointer; }
```

**Step 1: Add CSS classes** to `app/globals.css` after existing styles.

**Step 2: Verify visual appearance** by running dev server and navigating to a mind map.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add mind map canvas, node, edge, and panel CSS"
```

---

### Task 12: Add E2E tests for mind maps

**Objective:** Create Playwright E2E tests for mind map interactions.

**Files:**
- Create: `e2e/mindmaps.spec.ts`

**Test scenarios:**
```typescript
test('mind maps list shows all 8 domains')
test('clicking a domain navigates to canvas')
test('canvas loads with toolbar visible')
test('double-click canvas adds a node')
test('drag between nodes creates an edge')
test('double-click node opens edit panel')
test('delete key removes selected node')
```

**Step 1: Create `e2e/mindmaps.spec.ts`** following `playwright.config.ts` setup.

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- e2e/mindmaps.spec.ts
```

**Step 3: Commit**

```bash
git add e2e/mindmaps.spec.ts
git commit -m "test: add mind maps E2E tests"
```

---

### Task 13: Final integration — run all tests, verify, final commit

**Objective:** Full integration check — all tests passing, build passing, no regressions.

**Step 1: Run full test suite**

```bash
npm test
```

Expected: all unit tests pass including mindmaps.test.ts.

**Step 2: Run E2E tests**

```bash
npm run test:e2e
```

**Step 3: Production build**

```bash
npm run build
```

Expected: no build errors.

**Step 4: Verify existing pages still work** — dashboard, notes, flashcards, quiz, exam, admin.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete mind maps feature with canvas, CRUD, i18n, and tests"
```

---

## Principles Reminder

- **DRY**: Reuse existing patterns (DomainBadge, htb-card, server action error handling)
- **YAGNI**: Only build what's in the design spec, no scope creep
- **TDD**: Tests written before or alongside implementation
- **Frequent commits**: One commit per task
- **Bite-sized**: Each task is 2-5 minutes of focused work
