# Vaquita — Frontend

Personal finance tracker with an AI agent as its main feature. Users describe transactions in natural language through a chat interface; the agent handles interpretation and storage.

This is the **frontend** repo. The backend is a separate FastAPI service.

---

## Stack

- **Package manager:** pnpm | **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 | **Components:** shadcn/ui
- **Routing:** react-router-dom v7
- **Server state:** TanStack Query | **Chat state:** Zustand (`useChatStore`) | **Charts:** Recharts
- **Auth:** `@react-oauth/google` + JWT in `localStorage` | **Toast:** sonner | **Font:** Geist

---

## Commands

```bash
pnpm install && pnpm dev   # install + dev server
pnpm build                 # production build
pnpm lint                  # lint
```

## Post-Task Validation (mirrors CI)

Propose the user to run after every task that touches frontend files:

```bash
pnpm lint
pnpm build
```

In a multi-repo task, only run these when frontend files were changed.

---

## UI & Design

- Minimalist, Notion-inspired — mobile-first
- Bottom nav on mobile, sidebar on desktop (`AppLayout.tsx`)
- Locale: `es-AR` (dots for thousands, commas for decimals)
- Dark/light theme via `useTheme`

---

## Coding Principles

- Simple and readable over clever — no unnecessary abstractions
- Small, focused components — prefer shadcn/ui over custom components
- React Query for server state — Zustand only for chat state
- Never use HTML `<form>` — use event handlers (`onClick`, `onChange`)
- Chat-first UX: chat is the main entry point, not a secondary feature
- UI copy, error messages, and labels → **Rioplatense Spanish**
- Code and variable names → **English**