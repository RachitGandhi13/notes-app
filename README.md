# CloudVidya Academy — Learning Platform

An ed-tech platform in a single Next.js app: recorded video courses with
purchases and progress tracking, plus study notes (slide lessons and quizzes)
organised into tracks. Built as a Turborepo monorepo around one Postgres
database.

> This README describes what's actually built and working today. For the
> phase-by-phase implementation plan and what's still in progress, see
> [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## What's in the app (`apps/web`, port 3000)

### Courses

Recorded video courses, organised into sections (playlist-style groupings),
with purchase-gated access for paid courses.

- Admin creates courses, adds sections, and uploads lecture videos directly
- Free courses enroll directly; paid courses are purchased via **Razorpay**
  (Checkout modal + signature-verified confirmation + a webhook backstop)
- Course search from the navbar and hero
- Per-video progress tracking, bookmarks, comments, and Q&A per video
- Certificates on course completion
- Admin can download a full student roster as an Excel file (name, email,
  course, amount paid, Razorpay order/payment IDs, purchase date)

### Notes

Study tracks organised into categories, browsable at `/notes`.

- Admin creates a track, then adds PPT slide lessons (uploaded files) and
  hand-written MCQ quizzes to it
- MCQ quizzes with per-user score tracking (shown on the profile page)
- Cmd/Ctrl+K search on `/notes`: fuzzy search over tracks, plus AI-powered
  search (Gemini embeddings → Qdrant vector search)

### Course + notes bundling

A course can be linked to one notes track (set in the admin panel when
creating the course). Purchasing that course — free or paid — unlocks the
linked track automatically, since both read the same `UserPurchases` table.
A track with no linked course stays open to everyone.

### Accounts and admin

One sign-in for everything (email/password, GitHub, Google), one profile page
(courses, bookmarks, quiz history) and one `/admin` page with Courses, Notes
and Comments tabs.

## Tech stack

- **Monorepo:** Turborepo 2.x + Yarn 1 workspaces
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Prisma (`packages/db`)
- **Auth:** NextAuth v4 — Credentials + GitHub + Google, Prisma adapter (`packages/auth`)
- **Cache:** Redis via `ioredis` (`packages/cache`) — best-effort TTL caching
- **State:** Recoil (`packages/store`)
- **UI:** Shared Radix/Shadcn-style components (`packages/ui`)
- **File storage:** Vercel Blob when configured, local disk in dev (`packages/storage`)
- **Payments:** Razorpay
- **Excel export:** ExcelJS
- **AI search:** Gemini embeddings → Qdrant vector search

Backing services are chosen to run on free tiers — see `DEVELOPMENT.md` for
the specific providers and reasoning.

## Project structure

```
apps/
  web/            The whole site: courses, notes, admin, auth, API routes
packages/
  auth/           Shared NextAuth config
  cache/          Shared Redis client
  db/             Prisma schema + client + migrations + seed
  storage/        File upload storage (Vercel Blob / local disk)
  store/          Shared Recoil atoms
  ui/             Shared UI components
  eslint-config/  Shared ESLint config
  typescript-config/  Shared tsconfig bases
```

## Getting started

```bash
# 1. Install dependencies
yarn install

# 2. Copy env template and fill in values. Next.js only loads env files from
#    the app directory, so the app needs its own copy too.
cp .env.example .env
cp .env apps/web/.env

# 3. Local infra (Postgres/Redis/Qdrant) — for local dev only;
#    production uses free managed equivalents (see DEVELOPMENT.md)
docker-compose up -d

# 4. Set up the database
yarn db:setup   # runs migrations, then seeds admin@example.com / admin123

# 5. Run the app
yarn dev        # http://localhost:3000
```

> The seed creates a well-known admin login. It is for **local development
> only** — never run `yarn db:seed` against a production database.

### Required environment variables

See `.env.example` for the full list. At minimum you'll need:

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — `NEXTAUTH_URL` is the site's own public URL
- `GITHUB_ID`/`GITHUB_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — OAuth login
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — paid courses
- `QDRANT_URL`, `GOOGLEAI_API_KEY` — AI search (optional, deferrable)
- `REDIS_URL` — caching (optional, best-effort)
- `BLOB_READ_WRITE_TOKEN` — file uploads on Vercel (local disk is used without it)
- `SMTP_*` — verification and password-reset emails (logged instead of sent when unset)

## Deployment

The site is a single Next.js app that goes on one domain
(`www.cloudvidyaacademy.com`). The production Postgres is on Neon; apply
migrations with `prisma migrate deploy` using Neon's direct (non-pooled)
connection string, and give the running app the pooled one. Where the app
itself is hosted (Vercel or otherwise) is still being decided — see the
open risks in `DEVELOPMENT.md` before choosing. A `Dockerfile` for
container hosting is at `apps/web/Dockerfile`.

## Status

Actively being built out. See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for current
progress and what's next.
