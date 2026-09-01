# Notes & Video Learning Platform

An ed-tech platform combining Notion-based study notes with quizzes, and a
video course platform for recorded lectures. Built as a Turborepo monorepo
with two Next.js apps sharing a single Postgres database.

> This README describes what's actually built and working today. For the
> phase-by-phase implementation plan and what's still in progress, see
> [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## Apps

### `apps/notes` (port 3000)

Study tracks built from Notion pages, organized into categories, with
multiple-choice quizzes attached to individual problems/lessons.

- Admin pastes a Notion page ID; the app fetches that page's blocks and creates
  a `Track` from it
- AI-powered search over notes content (Gemini embeddings → Qdrant vector search)
- MCQ quizzes with score tracking per user

### `apps/video` (port 3001)

Recorded video courses, organized into sections (playlist-style groupings),
with purchase-gated access for paid courses.

- Admin can create courses, add playlist-style sections, and add videos by
  pasting an Unlisted YouTube link — no video files are ever uploaded to our
  own servers/storage
- Courses contain ordered sections, each holding one or more videos
- Free courses enroll directly; paid courses are purchased via **Razorpay**
  (Checkout modal + signature-verified confirmation + a webhook backstop)
- A course can optionally be linked to a matching notes-app track — one
  purchase unlocks both apps' content for that topic (see "Cross-app
  bundling" below)
- Per-video progress tracking, bookmarks, comments, and Q&A per video
- Certificates on course completion
- Admin can download a full student roster as an Excel file (name, email,
  course, amount paid, Razorpay order/payment IDs, purchase date)

Video hosting: recordings are uploaded as **Unlisted YouTube videos** and
embedded behind the app's purchase/login gate — see `DEVELOPMENT.md` for why.

### Cross-app bundling

A video course can be linked to one notes track (set from the video app's
admin panel when creating the course). Purchasing that course — free or paid
— unlocks the linked track in the notes app automatically, since both apps
read the same `UserPurchases` table in the shared database. A track with no
linked course stays open to everyone, exactly as before.

## Tech stack

- **Monorepo:** Turborepo 2.x + Yarn 1 workspaces
- **Framework:** Next.js 14 (App Router) for both apps
- **Database:** PostgreSQL via Prisma, shared schema (`packages/db`) across both apps
- **Auth:** NextAuth v4 — Credentials + GitHub + Google, Prisma adapter (`packages/auth`)
- **Cache:** Redis via `ioredis` (`packages/cache`) — best-effort TTL caching
- **State:** Recoil (`packages/store`)
- **UI:** Shared Radix/Shadcn-style components (`packages/ui`)
- **Payments:** Razorpay (video app only)
- **Excel export:** ExcelJS — admin student roster download (video app only)
- **AI search:** Gemini embeddings → Qdrant vector search (notes app only)

All backing services run on free tiers — see `DEVELOPMENT.md` for the specific
providers and reasoning.

## Project structure

```
apps/
  notes/          Notion notes + MCQ quizzes
  video/          Video courses, purchases, community features
packages/
  auth/           Shared NextAuth config
  cache/          Shared Redis client
  db/             Shared Prisma schema + client + seed
  store/          Shared Recoil atoms
  ui/             Shared UI components
  eslint-config/  Shared ESLint config
  typescript-config/  Shared tsconfig bases
```

## Getting started

```bash
# 1. Install dependencies
yarn install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Local infra (Postgres/Redis/Qdrant) — for local dev only;
#    production uses free managed equivalents (see DEVELOPMENT.md)
docker-compose up -d

# 4. Set up the database
yarn db:setup   # runs migrations, then seeds admin@example.com / admin123

# 5. Run both apps
yarn dev        # notes on :3000, video on :3001
```

### Required environment variables

See `.env.example` for the full list. At minimum you'll need:

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GITHUB_ID`/`GITHUB_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — OAuth login
- `QDRANT_URL`, `GOOGLEAI_API_KEY` — AI search in the notes app (optional, deferrable)
- `REDIS_URL` — caching (optional, best-effort)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — paid courses in the video app
- `NEXT_PUBLIC_VIDEO_APP_URL` — lets the notes app link out to the video app's purchase page for bundled tracks

## Deployment

Both apps deploy to Vercel (free Hobby tier), pointed at the same Neon
Postgres instance, Upstash Redis, and Qdrant Cloud cluster. Custom domain
attaches to Vercel for free — the only cost is domain registration itself.

## Status

Actively being built out. See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for current
progress and what's next.
