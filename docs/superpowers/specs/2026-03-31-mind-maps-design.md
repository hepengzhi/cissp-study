# Mind Maps Feature Design

**Date**: 2026-03-31
**Status**: Approved

## Overview

Add interactive mind maps (knowledge graphs) to the CISSP study platform — one per CISSP domain. Users create and edit concept nodes and connect them with labeled relationships, building personal knowledge graphs as they study. Built with React Flow for an interactive node-graph canvas.

## Scope

- 8 mind maps, one per CISSP domain
- User-created nodes (concepts) and edges (relationships)
- Full CRUD for nodes and edges via inline editing
- Bilingual support (EN/ZH) for all content
- Optional linking of nodes to flashcards and quiz questions
- Interactive canvas with zoom, pan, drag, minimap
- Cyber-themed dark mode styling matching existing UI

## Data Model

### MindMap

| Field      | Type         | Notes                        |
|------------|--------------|------------------------------|
| id         | String (cuid)| Primary key                  |
| domain     | Domain (enum)| One of 8 CISSP domains (unique) |
| createdAt  | DateTime     | Auto-generated               |
| updatedAt  | DateTime     | Auto-updated                 |

One MindMap per domain, enforced by unique constraint on `domain`.

### MindMapNode

| Field              | Type          | Notes                            |
|--------------------|---------------|----------------------------------|
| id                 | String (cuid) | Primary key                      |
| mindMapId          | String        | FK → MindMap, cascade delete     |
| label              | String        | Short concept title (EN)         |
| labelZh            | String?       | Chinese label                    |
| description        | String?       | Longer explanation (EN)          |
| descriptionZh      | String?       | Chinese explanation              |
| positionX          | Float         | Canvas X coordinate              |
| positionY          | Float         | Canvas Y coordinate              |
| color              | String?       | Custom hex color (e.g. "#9fef00")|
| linkedFlashcardId  | String?       | FK → Flashcard, set null on delete |
| linkedQuestionId   | String?       | FK → Question, set null on delete |
| createdAt          | DateTime      | Auto-generated                   |
| updatedAt          | DateTime      | Auto-updated                     |

### MindMapEdge

| Field        | Type          | Notes                           |
|--------------|---------------|---------------------------------|
| id           | String (cuid) | Primary key                     |
| mindMapId    | String        | FK → MindMap, cascade delete    |
| sourceNodeId | String        | FK → MindMapNode                |
| targetNodeId | String        | FK → MindMapNode                |
| label        | String?       | Relationship label (EN)         |
| labelZh      | String?       | Chinese relationship label      |
| createdAt    | DateTime      | Auto-generated                  |

Unique constraint on `(mindMapId, sourceNodeId, targetNodeId)` — no duplicate edges.

## UI

### Page: `/mindmaps` — Domain List

- 8 cards in a responsive grid, one per CISSP domain
- Each card shows: domain badge, domain name, node count, edge count, last edited date
- Click card → navigates to `/mindmaps/[domain]` canvas
- Consistent with existing list pages (notes, flashcards)

### Page: `/mindmaps/[domain]` — Interactive Canvas

- Full-width React Flow canvas with dark background
- **Left toolbar** (vertical): Add Node, Select, Delete, Auto-Layout, Fit View
- **Nodes**: Rounded rectangles with title text, optional description on hover/expand, link indicator badge for flashcard/question connections
- **Edges**: Curved bezier lines, optional label text, animated flow effect
- **MiniMap**: Bottom-right corner, shows full graph overview
- **Controls**: Zoom in/out, fit view (React Flow built-in Controls component)

### Interactions

| Action            | Trigger                    | Result                                       |
|-------------------|----------------------------|----------------------------------------------|
| Add node          | Double-click canvas OR toolbar button | Inline text input appears at click position, Enter creates node |
| Edit node         | Double-click node          | Side panel opens with editable fields        |
| Delete node       | Select node → Delete key or toolbar | Confirmation dialog, removes node + connected edges |
| Connect nodes     | Drag from node handle to another | Creates edge, optionally prompts for label   |
| Edit edge         | Double-click edge          | Inline label editor                          |
| Delete edge       | Select edge → Delete key   | Removes edge                                 |
| Move node         | Drag node                  | Updates position, persisted on mouse up      |
| Zoom/Pan          | Mouse wheel / drag canvas  | Standard React Flow behavior                 |
| Auto-layout       | Toolbar button             | D3 force-directed layout reorganization      |
| Navigate to link  | Click link indicator       | Opens linked flashcard or question           |

### Node Edit Panel (Side Panel)

Fields:
- Label (EN) — required
- Label (ZH) — optional
- Description (EN) — optional, textarea
- Description (ZH) — optional, textarea
- Color — color picker with preset cyber palette options
- Link to Flashcard — search/select dropdown
- Link to Question — search/select dropdown

## Server Actions

All actions follow existing patterns: async functions returning `{ success, data }` or `{ error }`.

### `getMindMapByDomain(domain: Domain)`
- Returns mind map with all nodes and edges
- Auto-creates mind map if none exists for the domain

### `createNode(mindMapId: string, data: CreateNodeInput)`
- Input: label (required), labelZh, description, descriptionZh, positionX, positionY, color, linkedFlashcardId, linkedQuestionId
- Zod validation
- Returns created node

### `updateNode(nodeId: string, data: UpdateNodeInput)`
- Input: any subset of node fields including positionX, positionY
- Returns updated node

### `deleteNode(nodeId: string)`
- Deletes node and all connected edges (cascade)
- Returns success

### `createEdge(mindMapId: string, sourceNodeId: string, targetNodeId: string, label?: string, labelZh?: string)`
- Validates no duplicate edge
- Returns created edge

### `updateEdge(edgeId: string, data: UpdateEdgeInput)`
- Input: label, labelZh
- Returns updated edge

### `deleteEdge(edgeId: string)`
- Returns success

### `getMindMapStats()`
- Returns node and edge counts per domain for the list page

## File Structure

```
app/[locale]/mindmaps/
├── page.tsx                        # Domain list
└── [domain]/page.tsx               # Canvas

components/mindmap/
├── mindmap-canvas.tsx              # React Flow wrapper + toolbar
├── concept-node.tsx                # Custom node component
├── relation-edge.tsx               # Custom edge component
├── node-edit-panel.tsx             # Side panel for node editing
└── mindmap-card.tsx                # Domain card for list page

lib/actions/mindmaps.ts             # Server actions

locales/en.json                     # mindmaps.* translation keys
locales/zh.json                     # mindmaps.* translation keys (Chinese)

tests/actions/mindmaps.test.ts      # Unit tests for all actions

prisma/migrations/                  # Migration for new models
```

## New Dependency

- `@xyflow/react` — React Flow v12 for interactive node graphs

## Testing

- Unit tests for all 7 server actions (following TDD):
  - Happy path, validation error, database error for each
  - Edge cases: duplicate edge, node with connected edges delete, auto-create mind map
- E2E tests for canvas interactions (add node, connect, delete)

## i18n

Translation keys under `mindmaps` namespace:
- `mindmaps.title`, `mindmaps.description`
- `mindmaps.nodes`, `mindmaps.edges`, `mindmaps.lastEdited`
- `mindmaps.addNode`, `mindmaps.editNode`, `mindmaps.deleteNode`
- `mindmaps.connectNodes`, `mindmaps.editEdge`, `mindmaps.deleteEdge`
- `mindmaps.autoLayout`, `mindmaps.fitView`
- `mindmaps.linkLabel`, `mindmaps.label`, `mindmaps.description`
- `mindmaps.color`, `mindmaps.linkFlashcard`, `mindmaps.linkQuestion`
- `mindmaps.confirmDeleteNode`, `mindmaps.confirmDeleteEdge`

## Styling

- Nodes use project CSS variables (`bg-card`, `text-foreground`, border with domain accent colors)
- Edges use cyber green (#9fef00) or cyan (#00d4ff) gradients
- Canvas background: subtle dot grid pattern (React Flow Background component)
- Toolbar: glass-morphism style matching admin sidebar
- MiniMap: themed with domain colors
