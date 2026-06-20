# WikiHub

A personal wiki and worldbuilding tool for writers and creators to organize fictional universes — characters, factions, locations, lore, and more — with a rich-text editor experience inspired by Wikipedia and Notion.

> **Personal project** — Frontend by me, Backend API (ASP.NET Core) co-developed with AI assistance.

---

## What it does

Most worldbuilding tools are either too simple (plain notes) or too rigid (fixed templates). WikiHub aims for a middle ground: structured categories with a freeform rich-text editor, so a writer can have both an organized sidebar and the flexibility to write articles however they want.

**Core features:**

- Create multiple "worlds", each with its own wiki
- Sidebar with 30+ predefined article types across 7 categories (Characters, Factions, Geography, Creatures, Culture, Items, Lore)
- Rich-text editor built on [Tiptap](https://tiptap.dev/) with custom extensions
- Article templates that can be inserted into any article
- Global search within a world
- Overview page per world (pinned article)

---

## Tech Stack

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, React Router v6

**Editor** — Tiptap v2 with extensions: StarterKit, custom Image, custom Table, custom InfoBox, custom LaTeX (KaTeX), Mention, TextAlign, Color

**Backend** — ASP.NET Core (C#), REST API, file upload handling

**Other** — Axios, Tippy.js, Lucide React, KaTeX

---

## Editor — Custom Extensions

This is the most technically interesting part of the project. Tiptap's built-in extensions weren't enough, so several custom `Node` extensions were built from scratch using `ReactNodeViewRenderer`.

### CustomImage
- Drag image left/center/right to change float alignment (detects drop position relative to the editor container, not the window)
- Resize from any of the 4 corner handles
- Inline edit modal (URL or file upload) without leaving the editor
- Calculates natural image width on insert to avoid oversized images

### CustomTable
- Wraps Tiptap's Table extension with a custom NodeView
- Drag to change float alignment (left/right wrap text, center = full width)
- Resize handle on the right edge
- Right-click context menu: add/remove rows and columns, merge/split cells, toggle header row, delete table
- Floating mini toolbar for alignment and delete

### CustomInfoBox
- Wikipedia-style infobox that floats right of text
- Each field (key/value) is a mini Tiptap editor instance (`MiniMentionField`) supporting `@mention` inline
- Special `img` / `image` key triggers a drag-and-drop image upload UI for that field
- Uploads to the backend and stores the returned URL

### CustomLatex
- Block-level LaTeX formula rendered by KaTeX
- Click to edit raw LaTeX in a floating input, renders live preview

### CustomMention (`@mention`)
- Type `@` to trigger article search within the current world
- Fetches from the backend search API with debounce
- Renders as a styled inline chip
- In read mode: hovering a mention (or any internal article link) shows a Wikipedia-style tooltip preview fetched from the API

---

## Article Reader — Hover Preview

In read mode, all `@mention` chips and internal article links show a hover tooltip with:
- Article thumbnail
- Title and type badge
- Short description snippet (extracted from the article's "Mô tả" H2 section if available, falls back to the `description` field)

Implemented using Tippy.js with manual event delegation (`mouseover` + `closest()`) rather than the `delegate()` API, which requires a CSS selector string as its first argument and doesn't accept DOM elements directly.

---

## Article Templates

Users can create reusable content templates (stored separately in a `Templates` table). When editing an article, a modal lets you search and apply any template — it replaces the editor content with the template's Tiptap JSON. Templates themselves are editable in the same rich-text editor.

---

## State Management & Data Flow

No external state library (Redux, Zustand, etc.). State is kept local with React's `useState` / `useEffect` and lifted where needed.

A `refreshTrigger` counter pattern is used to re-fetch lists after create/delete operations without prop drilling:

```typescript
const [refreshTrigger, setRefreshTrigger] = useState(0);
// After any mutation:
setRefreshTrigger(prev => prev + 1);
```

Autosave is implemented with a 2-second debounce on the editor's `update` event, stored on `window.autoSaveTimer` to survive re-renders without adding it to the dependency array.

---

## Project Structure

```
wikihub-ui/src/
├── api/              # Axios client + typed API functions
├── components/
│   ├── lobby/        # World list, WorldCard, CreateWorldModal
│   └── world/        # WorldLayout, ArticleManager, ArticleReader,
│                     # ArticleEditor, TemplateManager,
│                     # Custom Tiptap extensions, MiniMentionField
└── types/            # Shared TypeScript interfaces
```

---

## Known Limitations / Future Work

- No authentication — single user only
- No version history for articles
- `@mention` hover preview parses HTML with `DOMParser` which is fragile if content format changes
- Image uploads stored on local disk (not cloud storage)
- Mobile layout not optimized

---

## Running Locally

```bash
# Frontend
cd wikihub-ui
npm install
npm run dev
```

Backend requires a running ASP.NET Core API at `http://localhost:5213`. Set `VITE_API_URL` in `.env` if the port differs.

```env
VITE_API_URL=http://localhost:5213
```
