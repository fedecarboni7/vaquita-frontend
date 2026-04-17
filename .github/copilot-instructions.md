# Project Context

Personal finance tracker with an AI agent as its main feature. Users interact primarily through a chat interface where they describe transactions in natural language ("I spent $20 on coffee") and the app handles the rest.

This is the **frontend** repo. The backend is a separate FastAPI service.

# Stack

- **Package manager:** pnpm
- **Framework:** React + Vite + TypeScript
- **Styling:** TailwindCSS
- **Components:** shadcn/ui
- **Auth:** @react-oauth/google
- **JWT storage:** localStorage

# Running the Project

```bash
pnpm install
pnpm dev
```

# Required Post-Task Validation (Mirror CI)

After finishing any task or code edit in the frontend repo, run the same checks used in CI:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

In a multi-repo task, run these frontend commands only when frontend files were changed.

# Auth Flow

1. User clicks Google sign-in button (`@react-oauth/google`)
2. Frontend receives Google credential
3. POST to `/auth/google` with the credential
4. Backend returns `{ access_token }`
5. Store JWT in `localStorage`
6. All API requests include: `Authorization: Bearer <token>`

# API Communication

All requests go to the backend REST API.

Base URL is read from `VITE_API_URL` env variable.

Always include the JWT header on protected endpoints:

```ts
headers: { Authorization: `Bearer ${token}` }
```

Main endpoints used:

```
POST /auth/google   — login, returns { access_token }
POST /chat          — send message, returns { reply: string }
GET  /expenses      — fetch expenses list
POST /expenses      — create expense manually
```

# Main UI Sections

- **Chat** — primary feature, conversational interface with the AI agent
- **Expenses** — list and history of recorded transactions
- **Statistics** — charts and summaries
- **Accounts** — account overview

# Coding Principles

- Simple and readable over clever
- Avoid unnecessary abstractions
- Keep components small and focused
- Use descriptive variable names
- Prefer shadcn/ui components over custom ones
- Chat-first UX: the chat is the main entry point, not a secondary feature