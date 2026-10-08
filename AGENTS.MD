# Vaquita — Frontend

Personal finance tracker with an AI agent as its main feature. Users describe transactions in natural language through a chat interface; the agent handles interpretation and storage.

This is the **frontend** repo. The backend is a separate FastAPI service.

---

## Stack

- **Package manager:** pnpm | **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 | **Components:** shadcn/ui
- **Routing:** react-router-dom v7
- **Server state:** TanStack Query | **Chat state:** local React state in `useChatStore` | **Shared UI state:** React Context for auth, currency, and balance visibility | **Charts:** Recharts
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

## API Communication

- `apiFetch` in `src/api.ts` prepends `VITE_API_URL`, sends the JWT bearer token from `localStorage`, and redirects to `/login` on a 401.
- `POST /chat` sends `{ messages, pending_draft? }` and receives `{ response_type: "draft" | "clarification" | "answer", message, data, ... }`. Chat responses are not shaped as `{ reply: string }`.
- Transaction records use the backend `/expenses` endpoints, not `/transactions`: list and available months use `/expenses`, creation uses `POST /expenses`, updates use `PUT /expenses/:id`, deletion uses `DELETE /expenses/:id`, and receipts use `/expenses/:id/receipt`. `transactions` is used for frontend routes and TanStack Query keys.
- Account, category, budget, statistics, and authentication requests are centralized in their corresponding hooks and use the backend `/accounts`, `/categories`, `/budgets`, `/stats`, and `/auth` routes.

## Agent Draft Flow

- `useChatStore` sends only user and assistant messages, capped to the last 8 messages in the request history. System notices are kept in the UI but omitted from the backend history.
- A `clarification` response carries a partial draft in `data`. The store keeps it as `pendingDraft` and sends it back as `pending_draft` with the next message.
- `pendingDraft` is cleared when a full `draft` arrives, when `TransactionDraftCard` confirms or cancels the draft, and when the chat is reset. Plain `answer` responses, request errors, rate-limit messages, and aborted requests leave it unchanged.
- `TransactionDraftCard` shows a small muted suggested-account hint for fields listed in `data.inferred_fields` (currently only `account`). The hint disappears after the user changes that field.
- On confirmation, `TransactionDraftCard` posts the transaction to `/expenses` and invalidates the `transactions` query.

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
- TanStack Query for server state; local React state and refs in `useChatStore` for chat state; React Context for shared auth, currency, and balance-visibility state
- Never use HTML `<form>` — use event handlers (`onClick`, `onChange`)
- Chat-first UX: chat is the main entry point, not a secondary feature
- UI copy, error messages, and labels → **Rioplatense Spanish**
- Code and variable names → **English**