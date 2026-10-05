# Development Plan

Internal working document. This is the checklist Claude Code uses to track what's
implemented, what's next, and why decisions were made. Not for end users — see
`README.md` for that.

**How this file is used:** each phase has a status and a task checklist. When a
phase is finished, its checkboxes are ticked and its "Summary" line is filled in,
then `README.md` is updated to reflect the new user-facing capability. Phases are
appended (not rewritten) as the client's full requirement list comes in.

Status legend: ✅ Done · 🚧 In progress · ⬜ Not started

---

## Tech stack (finalized — free-tier only)

Client is a first freelance engagement: every backing service must be free.
The only cost the client accepts is domain registration at final launch.

| Concern         | Service                                                 | Why                                                                                                                                                                              |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Postgres        | [Neon](https://neon.tech) free tier                     | Serverless Postgres, works with Prisma via `DATABASE_URL` with no code changes                                                                                                   |
| Cache           | [Upstash Redis](https://upstash.com) free tier          | Drop-in `REDIS_URL` swap for the existing `ioredis` client in `packages/cache`                                                                                                   |
| Vector search   | [Qdrant Cloud](https://cloud.qdrant.io) free tier (1GB) | Already used via `QDRANT_URL`/`QDRANT_API_KEY` env vars — no code change                                                                                                         |
| Embeddings      | Google Gemini `embedding-001` free quota                | Already integrated in the notes app's AI search                                                                                                                                  |
| Video hosting   | YouTube (Unlisted videos)                               | Only genuinely free option that scales to unlimited hours of long-form (up to 3hr) lecture video with adaptive streaming. See "Video hosting decision" below.                    |
| Payments        | Razorpay                                                | Client is India-based; standard gateway there, works for individual freelance clients without Stripe's business-registration overhead. No fixed fee, only a per-transaction cut. |
| App hosting     | Vercel (Hobby, free)                                    | Free custom domain attachment — client only pays domain registration                                                                                                             |
| Local dev infra | `docker-compose.yml` (Postgres/Redis/Qdrant containers) | Kept for local development only; production uses the managed free tiers above                                                                                                    |

**Package manager note:** root `package.json` declares `yarn@1.22.22`, but no
lockfile exists in the repo yet. Use Yarn 1 for all installs unless a future
phase explicitly migrates this (not planned).

### Video hosting decision (accepted trade-off)

Client records lectures via Zoom/Meet and also uploads separate recorded
lectures, organized into playlist-like "sections" per course. Videos range
20 min–3 hrs. No dedicated video-hosting API (Bunny, Mux, Cloudflare Stream) has
a free tier that scales to this volume; raw S3/R2 free tiers (~10GB) fill up
after a handful of long recordings.

**Decision:** client uploads recordings as **Unlisted** YouTube videos (via
YouTube Studio, or a future paste-a-link admin flow); the app stores the video
ID/URL and embeds it behind the existing purchase/login gate.

**Accepted trade-off:** this is access-gating, not real DRM — someone with the
raw YouTube link could watch/share it outside the app. The schema's
`VideoMetadata.drmProtected` flag reflects "hide branding/related videos, gate
the page," not encryption-level protection. Confirmed acceptable for this
project's scope and budget.

---

## Phase 0 — Baseline audit ✅

**Summary:** Inherited monorepo from prior developer, audited against actual
code (not assumed from memory notes), pushed to the client's own GitHub repo
scoped correctly to this project folder (previously the local git root was
mistakenly the whole home directory).

- [x] Verified monorepo structure: `apps/notes`, `apps/video`, `packages/{auth,cache,db,store,ui,eslint-config,typescript-config}`
- [x] Verified Prisma schema covers: identity (User/Account/Session), notes domain (Track/Category/Problem/MCQQuestion/QuizScore), video domain (Course/Content tree/VideoMetadata/UserPurchases/VideoProgress/Bookmark/Comment/Question/Answer/Vote/Certificate/Event/BountySubmission)
- [x] Notes app: Notion-page-ID-based content ingestion (`/api/AddTracks`) + admin panel (`AdminPanel.tsx`) is functionally complete for the "link an existing Notion doc" model
- [x] Video app gap identified: **no admin UI, API route, or storage integration exists to create Courses/Content or upload videos.** `VideoMetadata.videoUrl` is an unpopulated string field; the only admin page that exists is comment moderation (`app/admin/page.tsx` → `ModerationPanel.tsx`)
- [x] `VideoPlayer.tsx` currently renders a raw `<video>` tag against `videoUrl` — will need to become (or branch into) a YouTube iframe embed for the chosen hosting approach
- [x] Initialized project-scoped git repo, pushed to `https://github.com/RachitGandhi13/notes-app`
- [x] Read every one of the 135 tracked files line by line (full audit below) and fixed one install-blocking bug found along the way: `packages/ui/package.json` listed `@radix-ui/react-sheet@^0.0.1`, a package that does not exist on npm (confirmed via registry — 404). `sheet.tsx` actually builds Sheet on `@radix-ui/react-dialog` (already a real dependency); the phantom line was removed.

---

## Codebase reference (full audit)

Living reference so future questions can be answered fast without re-reading
the whole repo. Update the relevant section whenever a phase changes a file.
Every file in the repo has been read in full at least once — the entries
below are deliberately terse; open the file for exact code.

### `packages/db` — shared Prisma schema (single source of truth for both apps)

- `prisma/schema.prisma` — one Postgres schema, split into three regions:
  - **Identity core**: `User` (has `admin: Boolean`, nullable `password` for OAuth-only users), `Account`, `Session`, `VerificationToken` (NextAuth standard tables; `VerificationToken` exists but nothing writes to it yet — no email verification flow implemented)
  - **Notes domain**: `Track` → `TrackCategory` (join) → `Categories`; `Track` → `TrackProblems` (join, ordered by `sortingOrder`) → `Problem` (`type`: `Blog` | `MCQ`) → `MCQQuestion` → `QuizScore` (per-user results)
  - **Video domain**: `Course` (slug, price in ₹, `hidden`) → `CourseContent` (join, ordered by `order`) → `Content` — a **self-referential tree** (`parentId`/`children`) where a node is `FOLDER` | `VIDEO` | `NOTION`. `VIDEO` nodes have one `VideoMetadata` (videoUrl, `drmProtected` bool, subtitleUrl, up to 3 thumbnail URLs). `NOTION` nodes have one `NotionMetadata` (just a `notionId`). Also: `UserPurchases` (the access-check table), `VideoProgress` (markAsRead per user+content), `Bookmark`, `Comment` (needs `approved` before showing), `Question`/`Answer` (with `accepted`), `Vote` (polymorphic: comment/question/answer, up/down), `Certificate`, `Event`, `BountySubmission` (has a dangling comment `// external reference — linked in Phase 8`, but nothing in this repo actually links bounties to anything — dead/future field)
  - **Payments (Phase 4)**: `PaymentOrder` (razorpayOrderId unique, razorpayPaymentId, userId, courseId, amount, status: CREATED/PAID/FAILED) — an audit trail of every Razorpay order attempt, kept separate from `UserPurchases` so failed/abandoned payments don't affect access and the client gets a clean payment history for the Excel export.
  - **Cross-app bundling (Phase 3)**: `Track.courseId` (nullable, `@unique`) + relation to `Course`. `Course.linkedTrack` is the reverse side. One course ↔ at most one track; `courseId: null` means the track is free/open. No join table — a 1:1 FK was sufficient for the client's actual requirement (see Phase 3 for the YAGNI note if this ever needs to become many-to-many).
- `src/client.ts` — Prisma client singleton, cached on `globalThis` in dev to survive HMR
- `src/index.ts` — re-exports `prisma` + everything from `@prisma/client`
- `prisma/seed.ts` — seeds one category, one Notion-backed track with a Blog problem + an MCQ problem (2 questions), one free course with a folder + one video (`videoUrl: "https://example.com/intro.mp4"` — placeholder, not real), and an admin user `admin@example.com` / `admin123`
- Scripts: `db:generate` (`prisma generate`), `db:migrate` (`prisma migrate dev --skip-seed`), `db:seed` (`tsx prisma/seed.ts`), `db:studio`

### `packages/auth` — shared NextAuth config

- `src/config.ts` — `authOptions`: JWT sessions, sign-in page `/auth`, three providers (Credentials via bcrypt against `User.password`, GitHub, Google — both OAuth with `allowDangerousEmailAccountLinking: true`). `jwt`/`session` callbacks pull `id` + `admin` from the DB into the token/session on every request (extra DB read per request — fine at this scale, worth caching if traffic grows). Also exports `checkRateLimit(key, maxRequests=10, windowMs=60_000)` — a plain in-memory `Map`, so **rate limits reset on server restart and don't work across multiple server instances**; fine for one Vercel Hobby instance, would need Upstash-backed rate limiting if scaled horizontally.
- `src/helpers.ts` — `getSession()`, `requireAuth()` (throws `AuthError(401)`), `requireAdmin()` (throws `AuthError(403)` if not admin), all built on `getServerSession`.
- `src/types.d.ts` — module augmentation adding `id`/`admin` to `Session.user` and `JWT`. Pulled into every consumer via a triple-slash reference in `index.ts` (see "First real build" below for why a plain import doesn't work here).
- `src/email.ts` (Phase 6) — `sendEmail(to, subject, html)`, Nodemailer over SMTP; best-effort like `@repo/cache` — logs and no-ops if `SMTP_HOST` isn't set, never throws.
- `src/tokens.ts` (Phase 6) — `createVerificationToken`/`consumeVerificationToken` against the shared `VerificationToken` table (identifier = email), single-use (deleted on consumption), 1hr TTL. Used for both email verification and password reset — no collision since consumption checks the exact (identifier, token) pair.
- `src/register.ts` (Phase 6) — `registerUser({name, email, password, ip, appUrl})`, shared by both apps' `/api/auth/register` routes: validates, rate-limits (5/min/IP), creates the user, sends a verification email pointing at the calling app's own `/api/auth/verify-email`.
- `src/password-reset.ts` (Phase 6) — `requestPasswordReset` (always resolves without error, never reveals whether an email exists), `resetPassword` (consumes the token, updates the hashed password).
- `src/action-error.ts` (Phase 6) — `AuthActionError`, a generic HTTP-status error for register/reset flows (separate from `AuthError`, which is specifically 401/403 for access control).
- `src/index.ts` — public exports: everything above, plus `authOptions`, `checkRateLimit`, `getSession`, `requireAuth`, `requireAdmin`, `AuthError`, `Session` type.

### `packages/cache` — Redis singleton

- `src/index.ts` — one `ioredis` client (`lazyConnect`, `maxRetriesPerRequest: 1`), `cacheGet<T>`/`cacheSet`/`cacheDel`, all wrapped in try/catch so Redis being down never breaks a request (logs a warning, returns `null`/no-ops). Default TTL 3600s (1hr).

### `packages/store` — Recoil atoms

- `src/atoms.ts` — 7 atoms total: UI (`currentViewAtom` grid/list, `profileSidebarOpenAtom`), notes (`quizProgressAtom`, `trackFilterAtom`, `searchOpenAtom`), video (`videoSidebarOpenAtom`, `currentContentIdAtom`). Only `searchOpenAtom` is actually consumed anywhere in the code (by `SearchDialog`) — the rest are declared but not currently wired to any component.

### `packages/ui` — shared components

- `lib/utils.ts` — `cn()` = `twMerge(clsx(...))`, standard shadcn helper.
- `hooks/use-toast.ts` — shadcn's toast state manager (module-level reducer + listener array, `TOAST_LIMIT=3`, auto-dismiss after 4s).
- **Custom components** (not generic Radix wrappers): `Navbar` (brand/links/actions props, session-aware — shows avatar dropdown w/ profile+sign-out when logged in, "Sign in" button otherwise, includes ThemeToggle and a mobile Sheet hamburger), `Spotlight` (mouse-tracked radial-gradient hover effect, pure CSS/JS, no deps), `ThemeToggle` (next-themes dark/light toggle).
- **Generic Radix/shadcn wrappers, verified to contain zero custom logic beyond Tailwind classes**: `Badge`, `Button` (cva variants: default/destructive/outline/secondary/ghost/link), `Card`, `Checkbox`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Pagination`, `ScrollArea`, `Select`, `Separator`, `Sheet` (built on `@radix-ui/react-dialog`, not a separate package — see bug fixed above), `Skeleton`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`/`Toaster`, `Tooltip`.
- Both apps' `tailwind.config.ts` point `content` at `../../packages/ui/src/**/*.tsx` so these compile correctly in each app.

### `apps/notes` (port 3000) — merged into `apps/web`, see Phase 9

- `app/layout.tsx` / `providers.tsx` — root layout wraps children in `SessionProvider` → `RecoilRoot` → `next-themes` `ThemeProvider`.
- `app/(marketing)/layout.tsx` — fetches all tracks server-side, renders `Navbar` + `SearchDialog` (client component fed server data) + page content.
- `app/(marketing)/page.tsx` — hero + track grid, `revalidate = 3600` (ISR hourly).
- `app/tracks/[...trackIds]/page.tsx` — catch-all route: `[trackId]` or `[trackId, problemId]`. Defaults to the track's first problem if none given. Renders `ProblemSidebar` + either `NotionRenderer` (Blog type, fetches live Notion page server-side) or `MCQQuiz` (MCQ type). Has `generateStaticParams` pre-rendering the first problem of every non-hidden track.
- `app/profile/page.tsx` — gated by `requireAuth`, shows avatar/name/email/admin-badge + quiz score history.
- `app/admin/page.tsx` + `AdminPanel.tsx` — gated by `requireAdmin`. Two-step flow: (1) paste a Notion page ID → `/api/AddTracks` fetches & strips first/last block (cover/footer convention) → (2) fill title/description/image/category → `createTrack()` server action creates the `Track` + `Problem`s in one transaction. Also lists existing tracks with an "Index for AI Search" button per track.
- `app/api/AddTracks/route.ts` — admin-gated POST, calls `getNotionPageBlocks`.
- `app/api/auth/[...nextauth]/route.ts` — standard NextAuth handler, just wires `authOptions`.
- `app/api/revalidate/route.ts` — `POST /api/revalidate?secret=&path=` — simple secret-token-gated ISR revalidation webhook.
- `app/auth/page.tsx` — **sign-in only** (Credentials form + GitHub/Google buttons). No register form/route exists in this app — see gap noted below.
- `lib/actions.ts` (server actions) — `getTracks`/`getTrack` (cached, `"tracks:all"` key, both now also select the linked `course` for cross-app bundling), `getProblem`, `submitQuizScore`/`getUserQuizScores`, `createTrack` (admin, transactional), `markTrackIndexed`, `indexTrack` (admin — embeds + upserts into Qdrant via `lib/search.ts`), `semanticSearch`, `hasTrackAccess(track)` (Phase 3 — free if `courseId` is null, otherwise requires a session + a matching `UserPurchases` row in the shared DB).
- `components/TrackPaywall.tsx` (Phase 3) — shown instead of lesson content when `hasTrackAccess` is false; links out to the matching course's purchase page in the video app (`NEXT_PUBLIC_VIDEO_APP_URL`) and to `/auth`.
- `app/tracks/[...trackIds]/page.tsx` now calls `hasTrackAccess` right after loading the track and renders `TrackPaywall` instead of the lesson if access is denied. Using `getSession()` here (via `hasTrackAccess`) opts this route out of full static generation despite `generateStaticParams` still existing — expected and fine, per-request rendering is required since access is user-specific.
- `TrackCard.tsx` now takes an optional `course` prop — shows a "🔒 ₹price bundle" badge instead of the lesson count when the track is bundled.
- `lib/notion.ts` — thin wrapper over `notion-client`'s `NotionAPI`: `getNotionPage(pageId)`, `getNotionPageBlocks(pageId)` (returns top-level child blocks with id/title/type).
- `lib/search.ts` — Gemini `embedding-001` → Qdrant. `ensureCollection()` creates the `notes_platform` collection (Dot distance, `VECTOR_SIZE` env, default 768) if missing. `insertData()` walks a track's problems, pulls each Notion page, extracts plain text from known block types (`extractTextFromRecordMap`), embeds title+body, upserts one point per problem keyed by problem UUID. `getSearchResults(query)` embeds the query and returns top-5 Qdrant matches.
- Components: `MCQQuiz` (client-side answer state, submits score once all answered, shows correct/incorrect highlighting after submit), `NotionRenderer` (dynamically-imported `react-notion-x` renderer, code/collection/equation/modal sub-renderers lazy-loaded), `ProblemSidebar` (collapsible lesson list), `SearchDialog` (Cmd/Ctrl+K palette with two tabs — Fuse.js fuzzy search over client-side track data, and a debounced AI-search tab calling `semanticSearch`; also has experimental Web Speech API voice input), `TrackCard`.

### `apps/video` (port 3001) — became `apps/web`, see Phase 9

- `app/layout.tsx` / `providers.tsx` — identical provider stack to notes app.
- `app/(marketing)/layout.tsx` — nav links: Courses / Profile / **Admin** (visible to everyone in the nav, but the page itself is `requireAdmin`-gated — not a security issue, just a UX note that non-admins see a nav link that will redirect them).
- `app/(marketing)/page.tsx` — hero + course grid, marks each `CourseCard` as "purchased" if the signed-in user owns it.
- `app/courses/[courseSlug]/page.tsx` — course detail: shows payment success/cancelled banners from `?payment=` query param (now set by the Razorpay flow), "Continue Learning" link if purchased, `PurchaseButton` if not, and a flattened curriculum list (folders' children flattened with their folder title shown as a tag).
- `app/courses/[courseSlug]/[contentId]/page.tsx` — the content viewer. Auth-gates (`redirect("/auth")` if no session), then **purchase-gates** (`redirect("/invalidsession")` if not purchased) before rendering. Renders `VideoPlayer` for VIDEO content or a placeholder `<code>` block for NOTION content (Notion content type exists in the schema/UI but has no real renderer wired up yet — dead end, unlike the notes app's real `NotionRenderer`). Below the player: `ProgressButton`, `BookmarkButton`, then tabbed `QASection`/`CommentSection`.
- `app/admin/page.tsx` — admin-gated, tabbed: **Courses** (`CourseManager.tsx`) and **Comments** (`ModerationPanel.tsx`, approve/delete pending comments), plus an "Export Students (Excel)" link to `/api/admin/export-students`.
- `app/admin/CourseManager.tsx` (Phase 2) — create a Course (title/slug/description/price in ₹/image, optional link to an unlinked notes Track), then per-course: add a section (`FOLDER` Content, appended at the end) and add a video to the course or to a section (title + YouTube URL/ID + optional description — `lib/youtube.ts`'s `extractYouTubeId` parses `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, or a bare 11-char ID). All mutations call `router.refresh()` rather than hand-syncing local state, since the data comes from server actions. **Not built**: editing/deleting a course or its content, and reordering sections/videos (both append-at-end only) — deferred until real usage shows they're needed.
- `lib/youtube.ts` — `extractYouTubeId`, `youtubeEmbedUrl` (→ `youtube-nocookie.com/embed/{id}`), `youtubeThumbnailUrl` (→ `img.youtube.com/vi/{id}/hqdefault.jpg`, used as the auto thumbnail on video creation).
- `app/auth/page.tsx` — sign-in **and** register tabs (unlike notes app). Register calls `/api/auth/register`, then auto signs in.
- `app/invalidsession/page.tsx` — static "Access Denied" page linking Home/Sign-in.
- `app/api/auth/register/route.ts` — validates name/email/password (min 8 chars), rate-limited (5/min/IP via `checkRateLimit`), checks for existing email, bcrypt-hashes, creates `User`.
- `app/api/bookmark/route.ts`, `app/api/progress/route.ts` — thin POST wrappers around `toggleBookmark`/`markProgress` server actions, each catching `AuthError` for proper status codes.
- `app/api/purchase/route.ts` — free-course direct enroll (calls `purchaseCourse`).
- `app/api/razorpay/order/route.ts` (Phase 4) — auth-required POST: looks up the course price, rejects if free (use `/api/purchase` instead) or already purchased, creates a Razorpay order (amount in paise, `notes: {userId, courseId}`), stores a `PaymentOrder` row (status `CREATED`), returns `{orderId, amount, currency, keyId, courseName}` to the client.
- `app/api/razorpay/verify/route.ts` (Phase 4) — auth-required POST, called from the client's Razorpay Checkout success `handler`: verifies the HMAC-SHA256 signature (`lib/razorpay.ts`'s `verifyPaymentSignature`), looks up the `PaymentOrder` by `razorpayOrderId`, checks it belongs to the calling user, marks it `PAID`, upserts `UserPurchases`, invalidates the purchases + courses cache. Idempotent (checks `status !== "PAID"` before re-granting).
- `app/api/razorpay/webhook/route.ts` (Phase 4) — durability backstop for `/verify` in case the client tab closes before the success handler fires. Verifies `x-razorpay-signature` over the raw body with the webhook secret (`verifyWebhookSignature`), handles `payment.captured`, does the same idempotent upsert.
- `lib/razorpay.ts` — `getRazorpay()` (SDK client singleton), `verifyPaymentSignature`, `verifyWebhookSignature`.
- `app/api/admin/export-students/route.ts` (Phase 5) — admin-gated GET, joins `UserPurchases` → `User`/`Course`, maps in the most recent `PAID` `PaymentOrder` per (user, course) for amount/order-id/payment-id (free enrollments just show "(free enrollment)"), streams an `.xlsx` via `exceljs` with `Content-Disposition: attachment`.
- `lib/actions.ts` (server actions) — courses (`getCourses`/`getCourse`, cached), content (`getContent`), purchases (`getUserPurchases` cached 5min, `hasPurchased`, `purchaseCourse` for free enroll), progress (`getCourseProgress`, `markProgress`), bookmarks (`getBookmarks`, `toggleBookmark`), certificates (`getCertificate`, `claimCertificate` — upsert, no actual PDF/asset generation, just a DB row + `slug`). Admin additions (Phase 2/3): `getAllCoursesForAdmin`, `getLinkableTracks`, `createCourse` (optionally links a Track, invalidates both apps' course/track caches), `createSection`, `createVideo` (parses the YouTube URL, only attaches a top-level `CourseContent` row when there's no `parentId` — videos inside a section are reached via `Content.parentId`, matching how `getCourse` already read the tree).
- `lib/community.ts` (server actions) — comments (`getComments` only returns `approved: true`, `addComment` always creates unapproved, admin `getPendingComments`/`approveComment`/`deleteComment`), questions/answers (`addQuestion`, `addAnswer`, `acceptAnswer` — question author or admin only, unaccepts siblings first), voting (`voteOnComment`/`voteOnQuestion`/`voteOnAnswer` — toggle-off-if-same-vote pattern, one vote row per user per target).
- Components: `VideoPlayer` (Phase 2 — now renders a `youtube-nocookie.com` iframe when `videoUrl` contains `youtube.com`/`youtu.be`; otherwise falls back to the original raw `<video src>` with poster/subtitle/error handling, which covers the seed/demo data), `PurchaseButton` (Phase 4 — rewritten to dynamically load `checkout.js`, hit `/api/razorpay/order`, open the Razorpay modal, and call `/api/razorpay/verify` from the success handler; free courses still call `purchaseCourse` directly), `ContentSidebar` (recursive folder/video tree, per-node watched checkmark, course-level progress bar), `CourseCard`, `ProgressButton`, `BookmarkButton`, `CommentSection`/`QASection` (both do optimistic local-state updates on submit, "Pending review" badge for unapproved comments), `VoteButtons` (optimistic up/down toggle, shared by comments/questions/answers).

### Infra / tooling

- `docker-compose.yml` — `postgres:16-alpine` (5432), `redis:7-alpine` (6379). **No Qdrant service defined here** despite Qdrant being used by the notes app — local Qdrant would need to be added manually or the Qdrant Cloud free tier used even for local dev.
- `apps/{notes,video}/Dockerfile` — multi-stage (deps → builder → runner), Yarn + `output: standalone`, non-root `nextjs` user, matches Next 14 standalone conventions correctly.
- `next.config.js` (both apps) — `output: "standalone"`, `transpilePackages` for all internal `@repo/*` packages, `images.remotePatterns` allow-listing Notion/S3/placeholder/Unsplash/Google/GitHub avatar hosts (no host for a future video-thumbnail CDN yet).
- ESLint: root has no config; `packages/eslint-config` exports `index.js` (base), `next.js` (extends `next/core-web-vitals` + base), `react-internal.js` (unused by either app currently — written for a future non-Next React package). Both apps' `.eslintrc.js` just extend `@repo/eslint-config/next`.
- TypeScript: `packages/typescript-config` exports `base.json` (strict, ES2022, `noUncheckedIndexedAccess`), `nextjs.json` (extends base, bundler resolution, JSX preserve), `react-library.json` (extends base, JSX react-jsx). All apps/packages extend one of these — no duplicated compiler options anywhere.
- `commitlint.config.js` — conventional commits only.
- `.husky/pre-commit` runs `npx lint-staged`; `.husky/commit-msg` runs commitlint. **Both hook files use the pre-v9 Husky format** (`. "$(dirname -- "$0")/_/husky.sh"` sourcing line), and root `package.json`'s `"prepare": "husky install"` uses the `install` subcommand that Husky v9 removed (v9's CLI is just `husky` with no subcommands). Since `husky@^9.0.0` is the installed version, **this will very likely error or no-op on first `yarn install`** — untested since no install has been run yet in this environment; verify and fix (probably: change `prepare` to `"husky"` and drop the sourcing line from both hook files) during Phase 1.
- `.prettierrc` — double-quote-off (`singleQuote: false`), 100 print width, `prettier-plugin-tailwindcss` for class sorting.

---

## Phase 1 — Free-tier infra provisioning ⬜

**Goal:** move local-only `docker-compose` services to their free managed
equivalents so the app is deployable without any paid infra. No application
code changes expected — all three clients already read connection info from
env vars.

- [ ] Create Neon project, get `DATABASE_URL`, run `db:migrate` + `db:seed` against it
- [ ] Create Upstash Redis database, set `REDIS_URL`
- [ ] Create Qdrant Cloud free cluster, set `QDRANT_URL` / `QDRANT_API_KEY`
- [ ] Verify `packages/cache` and notes AI search still work against the new Redis/Qdrant
- [ ] Document final `.env` values (redacted) and setup steps in README

---

## Phase 2 — Video upload & section/playlist admin ✅

**Goal:** close the core gap — give the client an admin flow to create a
Course, add "sections" (playlist-style groupings) to it, and add videos
(20min–3hr, via Unlisted YouTube link) to a section, in order. Also lets a
Course be linked to a notes Track for Phase 3's cross-app bundling.

- [x] Admin UI: create Course (title, description, price in ₹, slug, image, optional linked Track)
- [x] Admin UI: create a "section" — a `FOLDER`-type `Content` node attached to a Course via `CourseContent`, appended at the end
- [x] Admin UI: add a video to a course or a section — form takes a YouTube URL/ID + title + description, parses the video ID, creates a `VIDEO`-type `Content` + its `VideoMetadata` (embed URL + auto thumbnail from YouTube's `img.youtube.com`)
- [x] `VideoPlayer.tsx` now renders a `youtube-nocookie.com` iframe embed when `videoUrl` is a YouTube URL, falls back to the original raw `<video>` tag otherwise (covers the seed/demo data)
- [x] Edit a Course (title/description/slug/price/image) via an inline edit form
- [x] Hide/show a Course, a section, or a video — reuses the schema's existing (previously unused) `hidden` field rather than hard delete, since a hard delete would hit foreign-key constraints once there's any real purchase/progress/comment activity referencing that row. `getCourse` now filters hidden content out of the public tree; hidden courses/content stay reachable by direct link (same "Unlisted" model as the YouTube videos themselves), and the admin panel still shows hidden items (struck through) so they can be unhidden.
- [x] Reorder sections and top-level videos (↑/↓, swaps the `CourseContent.order` value with the adjacent sibling) — videos nested inside a section aren't independently reorderable (`Content` has no `order` field of its own; they're read by `parentId` + `createdAt`), which is an acceptable scope cut, not a schema change worth making without a concrete need for it
- [ ] Hard delete — **deliberately not implemented**, see above; "hide" is the permanent replacement for this, not a placeholder
- [ ] Manual test once Phase 1 infra (a real Postgres) exists: create a course, add 2 sections, add a short + a long (3hr) YouTube video to each, verify playback and progress tracking (`VideoProgress`) still work

---

## Phase 3 — Cross-app topic bundling (video purchase → notes access) ✅

**Client requirement:** _"there is a playlist for TOPIC A in video app, the
student pays for it, and can also access the notes app for TOPIC A with that
same payment."_

**Goal:** one `Course` purchase unlocks both the video content (already
worked) and one linked notes `Track`.

- [x] Schema: `Track.courseId` (nullable, `@unique`) + relation to `Course` — a 1:1 "this track is bundled with this course" link. A track with `courseId: null` stays free/open exactly as before.
- [x] Admin: the Course-creation form (Phase 2) includes an optional "Link to notes Track" dropdown
- [x] Notes app: `hasTrackAccess()` helper — free (`courseId: null`) tracks are always open; bundled tracks require a signed-in session **and** a matching row in the shared `UserPurchases` table (same Postgres DB, so this is a direct query, no cross-app API call needed)
- [x] Notes app: track page shows a `TrackPaywall` (title, price, description, links to sign in / to the matching course's purchase page in the video app via `NEXT_PUBLIC_VIDEO_APP_URL`) instead of content when access is denied
- [x] Notes app: track listing (`TrackCard`) shows a "🔒 ₹price" badge on bundled tracks instead of the lesson count
- [ ] Only a 1:1 bundle is supported (one Course ↔ one Track). If the client later wants one course to unlock multiple tracks, or one track shared across multiple course bundles, this needs a join table instead of the `courseId` FK — not built since nothing today needs it (YAGNI)

---

## Phase 4 — Razorpay payments (replaces Stripe) ✅

**Client requirement:** Razorpay integration for course purchases (client is
India-based; Razorpay is the standard gateway there and works for individual
freelance clients without the business-registration overhead Stripe needs).
Stripe is removed rather than kept alongside — no requirement calls for two
payment providers, and running both would be pure unused complexity.

- [x] Removed `stripe` dependency + `/api/stripe/checkout` + `/api/stripe/webhook`
- [x] Added `razorpay` dependency
- [x] Schema: new `PaymentOrder` model (razorpayOrderId, razorpayPaymentId, userId, courseId, amount, status: CREATED/PAID/FAILED) — an audit trail of every payment attempt, independent from `UserPurchases` (which stays the "does this user have access" table used everywhere else)
- [x] `/api/razorpay/order` — admin-agnostic, auth-required: looks up the course price, creates a Razorpay order (amount in paise), stores a `PaymentOrder` row, returns the order id + amount + `key_id` to the client
- [x] `/api/razorpay/verify` — client calls this from Razorpay Checkout's success handler with `razorpay_order_id`/`razorpay_payment_id`/`razorpay_signature`; verifies the HMAC-SHA256 signature server-side with `key_secret`, marks the `PaymentOrder` PAID, upserts `UserPurchases`, invalidates caches
- [x] `/api/razorpay/webhook` — durability backstop: verifies Razorpay's webhook signature independently, handles `payment.captured`, does the same idempotent upsert as `/verify` in case the client tab closes before the verify call fires
- [x] `PurchaseButton.tsx` rewritten to load Razorpay's `checkout.js` and open the payment modal instead of redirecting to a Stripe-hosted page
- [x] Prices displayed in ₹ (rupees) instead of $ throughout the video app
- [ ] Refunds — **not implemented**, no requirement for it yet; Razorpay supports refund APIs if the client asks later

---

## Phase 5 — Student roster Excel export ✅

**Client requirement:** _"store the student database in excel sheet
format"_ — the client wants his own record of who bought what, as a
downloadable spreadsheet, not a database he has to query.

- [x] Added `exceljs` dependency to `apps/video`
- [x] `/api/admin/export-students` — admin-gated GET route, joins `UserPurchases` → `User` + `Course`, includes matching `PaymentOrder` payment/order IDs and amount, streams back an `.xlsx` file (columns: Student Name, Email, Course, Amount Paid (₹), Razorpay Order ID, Razorpay Payment ID, Purchased At)
- [x] "Export Students (Excel)" button added to the video app's admin page

---

## Phase 6 — Auth hardening (register, password reset, email verification) ✅

**Goal:** close the three auth gaps flagged during the codebase audit —
notes app had no register flow, and neither app had password reset or email
verification despite the schema's `VerificationToken` table existing unused.

- [x] `packages/auth` gained a shared email/token layer: `sendEmail` (Nodemailer over SMTP, best-effort — logs and no-ops if `SMTP_HOST` isn't set, same pattern as `@repo/cache`), `createVerificationToken`/`consumeVerificationToken` (random token against `VerificationToken`, single-use, 1hr TTL), `registerUser` (shared by both apps' register routes), `requestPasswordReset`/`resetPassword`, and `AuthActionError` (generic HTTP-status error for these flows)
- [x] Notes app now has a register route + register tab on `/auth` (previously sign-in only)
- [x] Both apps: `/api/auth/forgot-password` (always responds success — never reveals whether an email is registered), `/api/auth/reset-password`, `/api/auth/verify-email` (GET, consumes the token and sets `User.emailVerified`, redirects to `/auth`)
- [x] Both apps: `/auth/forgot-password` and `/auth/reset-password` pages; `/auth` page links to forgot-password and shows a "verified" banner
- [x] Registration sends a verification email but **does not block sign-in** on being unverified — a deliberate choice to avoid building enforcement nobody asked for; `emailVerified` is just set when the link is clicked, available if the client wants to gate on it later
- [ ] SMTP credentials aren't configured yet (Phase 1) — until then, `sendEmail` just logs what it would have sent. Register/reset still work end-to-end (the token is created and consumable), the user just won't receive the actual email until `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` are set

---

## Phase 7 — Client's full requirement list ⬜

Placeholder — to be expanded as more requirements come in. Each new
requirement gets its own numbered sub-phase below rather than rewriting this
section.

### Phase 7.1 — Cross-app nav link + manual PPT/MCQ lesson authoring ✅

**Client requirement:** the notes app should be reachable from the main
(video app) navbar; and for notes-app content, the client wants to upload
his own PPT slide decks and write MCQ quiz questions by hand, rather than
everything having to come from a Notion page.

- [x] `packages/ui`'s `Navbar` component gained a working `links` prop (it
      existed in the interface already but was never destructured/rendered —
      dead prop). The video app's root layout now passes a "Notes" link built
      from a new `NEXT_PUBLIC_NOTES_APP_URL` env var (mirrors the existing
      `NEXT_PUBLIC_VIDEO_APP_URL` used the other direction for Phase 3
      bundling), added to `.env.example` and all three local `.env` copies.
      Only wired one direction (video → notes), matching what was asked; the
      notes app's navbar doesn't link back to video app yet.
- [x] Schema: `Problem.notionDocId` is now nullable (previously required —
      even MCQ problems had to carry a placeholder Notion ID, a pre-existing
      wart). Added `Problem.slideUrl` (nullable) and a new `ProblemType.Slides`
      value alongside the existing `Blog`/`MCQ`. **Migration not yet run** — no
      reachable Postgres in this environment (Phase 1 still blocks this); ran
      `prisma generate` only, so the Prisma Client types are current but
      `yarn db:migrate` still needs to run against a real database.
- [x] `apps/notes/lib/actions.ts`: `createBlankTrack` (a track with no
      Notion step, for tracks built entirely from manual content),
      `addSlideLesson` (creates a `Slides`-type `Problem` from a pasted
      embeddable link), `addMCQLesson` (creates an `MCQ`-type `Problem` +
      `MCQQuestion` rows from hand-typed question/option data, validated
      server-side — at least 2 filled options per question, correct option
      must match one of them).
- [x] Admin panel (`apps/notes/app/admin/`): three new forms
      (`components/admin/ManualContentForms.tsx`) — create a blank track, add a
      slides lesson to any existing track, add an MCQ quiz lesson to any
      existing track (dynamic question/option rows, radio-select the correct
      option, add/remove both questions and options).
- [x] New `SlidesEmbed` component renders `slideUrl` as a responsive 16:9
      iframe on the track/lesson page (same treatment as the video app's
      YouTube embed) for `Slides`-type problems; `ProblemSidebar` shows a
      distinct icon for them.
- [x] `lib/search.ts`'s `insertData` now skips problems with no
      `notionDocId` (Slides/MCQ lessons) rather than erroring — AI semantic
      search still only indexes Notion-backed Blog content; extending it to
      slide/MCQ text wasn't asked for.
- [x] **Slide hosting decision:** no PPT file upload/storage was built —
      same free-tier reasoning as the video app's YouTube choice (Phase 0/1):
      no free file-storage tier here either. The admin pastes an _embeddable
      link_ instead (Canva's "Share → Embed" link, or a Google Slides "File →
      Publish to web" link), both free and already host the actual file. This
      wasn't confirmed with the client explicitly — flagging in case they
      expected direct file upload; the workaround is one extra step (upload to
      Canva/Slides first) rather than new infra.
- [x] Fixed three pre-existing build-blocking ESLint errors surfaced while
      verifying this change with a full `next build` (unrelated to this
      work, never caught before because a full build+lint had only been run
      twice before in this project's history — see "First real build" above):
      `apps/video/components/VoteButtons.tsx` and
      `apps/video/lib/community.ts` had genuinely unused
      variables/imports (`net`, `getSession`); `apps/notes/components/MCQQuiz.tsx`
      had two unused per-question booleans (`isCorrect`/`isWrong` — the actual
      styling logic uses per-_option_ variables further down, these were dead);
      `apps/notes/components/SearchDialog.tsx` had an unused `useCallback`
      import. All four were `no-unused-vars` errors, not warnings — they made
      `next build` exit 1 for both apps. Both apps now build clean again aside
      from the pre-existing `@typescript-eslint/no-explicit-any` warnings
      (non-blocking, already present throughout the codebase before this
      session).

---

## UI design pass — competitor-informed polish ✅

Compared the actual student-facing product (this app) against creator
course-platform marketplaces (Kajabi, Thinkific, Teachable, Graphy, Podia)
and a live large-scale example (Physics Wallah), then pulled specific,
_honest_ patterns from the best-ranked ones into real code. Deliberately did
**not** add fabricated ratings/reviews/testimonials — there's no review
system, so only real, computed numbers are shown.

- Added real enrollment counts (`Course._count.purchases`) to `getCourses`/`getCourse` — used as an honest trust signal (Kajabi/Thinkific pattern: concrete numbers over vague claims), never fabricated.
- `CourseCard`/`TrackCard`: bigger radius, hover-lift + shadow, gradient-on-hover image overlay, refined pill badges, real enrolled-count stat, "View course →" hover affordance.
- Course detail page (`app/courses/[courseSlug]/page.tsx`): rebuilt as a proper two-column sales-page layout (Thinkific/Kajabi pattern) — main content + a distinct sticky purchase panel with price, CTA, and a real trust-signal row (lesson count, enrolled count, "Lifetime access" — accurate, since purchases never expire in this schema).
- Both homepages: bigger hero typography, a real stats row (course/track count, total enrolled/lesson count) instead of decoration-only hero text.
- `ContentSidebar`: progress bar now shows "`X of Y` lessons completed" alongside the percentage, turns green at 100%.
- **Gotcha hit while doing this**: changing a cached query's shape (adding `_count`) without flushing Redis serves the _old_ shape back from cache, crashing on the new field access (`Cannot read properties of undefined`). Not a code bug — just a reminder that a query-shape change needs a cache flush (`docker exec <redis> redis-cli FLUSHALL` locally) or a cache-key version bump in production.

---

## Design system overhaul — client-supplied reference ✅ (superseded, see next section)

**Update:** the client saw this live and was disappointed — it didn't match
what they actually wanted. They then supplied a second, different reference
(100xDevs.com: dark navy + vivid blue, bold sans, not cream/terracotta/serif)
and asked for an exact clone of that instead. The section below records
what shipped from _that_ pivot; this section is kept as history of what was
tried first and superseded, not because any of it remains live.

Client supplied a 4-page Squarespace-style mockup (warm cream + terracotta
"quiet luxury" editorial aesthetic, serif display headlines, pill buttons,
a chapter/lesson curriculum accordion, instructor bio, FAQ). Rebuilt the
actual design tokens and highest-value pages to match; did **not** build the
sections that would need fabricated content (see below).

- **Color palette** (`app/globals.css` in both apps + `packages/ui/src/globals.css`): replaced the default shadcn slate/zinc palette with a warm cream background (`36 46% 95%`) and terracotta primary (`14 55% 62%`), light and dark variants both defined. All existing components inherit this automatically since everything already reads from the same CSS variables — no component-level color changes needed beyond this.
- **Typography**: added `Fraunces` (serif, via `next/font/google`, weights 400/500/600 + italics) alongside the existing `Inter`, wired through CSS variables (`--font-serif`/`--font-sans`) and each app's `tailwind.config.ts` `fontFamily` so `font-serif`/`font-sans` utility classes work anywhere. Applied `font-serif` to hero headlines, course/curriculum titles, and chapter names — body text and UI chrome stay on Inter for readability.
- **Buttons**: shared `Button` component (`packages/ui`) and the major hand-styled CTAs (`PurchaseButton`, course detail purchase panel) changed from `rounded-md`/`rounded-lg` to `rounded-full` (pill shape), matching the reference. `Badge` was already `rounded-full`.
- **Homepages** (both apps): rebuilt as a two-column hero — serif headline + stats + pill "Explore" CTA on the left, a real image (first course/track's actual thumbnail, not a stock photo) in a rounded panel on the right, falling back to a decorative gradient if no image exists yet.
- **Course detail page**: title now serif; **curriculum rebuilt as a chapter/lesson accordion** (`CurriculumAccordion.tsx`, new) matching the reference almost exactly — each `FOLDER`-type `Content` node becomes a collapsible "Chapter N" panel (first one open by default), each child becomes a lesson row with its real thumbnail, title, and description snippet. Standalone (non-foldered) content gets bucketed into a trailing "More Lessons" group so nothing is ever dropped.
- **Deliberately not built** — the reference also showed an "About Your Instructor" bio section and an FAQ accordion. Both would need real content (instructor bio/photo, actual Q&A) that doesn't exist in the schema or from the client yet — building them with placeholder text would mean shipping fabricated content. Flagged as a follow-up: adding an instructor bio needs a small schema addition (name/photo/bio on `Course` or a site-wide setting) and the client's actual bio text; an FAQ needs either a `Course.faq` field with an admin editor, or the client's actual list of questions. Also skipped the standalone "Request a Consultation" / "Contact" pages from the reference — they're not part of this app's functionality (a course platform, not a lead-gen site).
- Swapped the seed data's dead `via.placeholder.com` image URLs for `placehold.co` (PNG format specifically — their default SVG response gets rejected by Next's image optimizer unless `dangerouslyAllowSVG` is enabled, which wasn't worth turning on globally just for a placeholder given course images accept arbitrary admin-supplied URLs).

---

## Design system pivot #2 — 100xDevs clone (current) ✅

Client provided real assets this round: `apps/veerannaSir.png` (instructor
photo, moved to `apps/{video,notes}/public/instructor.png`), plus a
`sampleimg/` folder with a sample article thumbnail and a real ~31MB sample
lesson video (`team15_decisionTree_video.mp4`) — **not yet wired in**: the
video file isn't used anywhere, since the platform's whole video strategy is
YouTube-hosted (Phase 2/free-tier decision) rather than self-hosted files;
using it would mean building a different, non-free video pipeline. Flagged
for the client's decision, not decided unilaterally.

- **Theme flip**: dark is now the default and only visually-designed theme (`ThemeProvider defaultTheme="dark" enableSystem={false}` in both apps). Light mode CSS variables still exist as a fallback (nothing was deleted) but aren't the target look anymore.
- **Palette**: dark navy-black background (`224 45% 5%`) + vivid blue primary (`217 91% 60%`), same three `globals.css` files as the previous pivot.
- **Typography**: removed `Fraunces`/serif entirely — headlines are bold `Inter` (`font-extrabold`) throughout, matching 100xDevs' bold-sans look.
- **Buttons**: reverted from full pill (`rounded-full`) back to moderate rounding (`rounded-lg`) — the terracotta pivot used true pills, 100xDevs' buttons are rounded rectangles. `Badge` stays `rounded-full` (its small pill tags do match the reference).
- **Navbar rebuilt** (`packages/ui/src/components/navbar.tsx`): circular brand logo (using the instructor photo — a real, if temporary, stand-in for an actual site logo/favicon) + bold brand name, a centered search slot, and **Login + Join now** as two separate buttons when signed out (previously a single "Sign in" button). Dropped the always-visible text nav links and the theme toggle to match the reference's cleaner header — Profile and (for admins only) Admin moved into the avatar dropdown instead of being lost.
- **Real course search, added from scratch** (video app had none before): `CourseSearchBar` (client component, its own internal `<Suspense>` boundary per the earlier `useSearchParams` lesson) drives a `?q=` URL param; `getCourses(query)` does a real `title: { contains }` Postgres filter, bypassing the Redis cache for searches (only the unfiltered list is cached) rather than polluting it with arbitrary query strings. One instance lives in the navbar (compact), another larger one in the hero, both hitting the same URL param so they stay in sync. Notes app reuses its existing Cmd+K `SearchDialog` instead of duplicating search logic — the navbar's search slot there is just a styled trigger button (`NavSearchTrigger`) that opens it.
- **`?tab=register` deep link** added to both `/auth` pages so the navbar/footer "Join now"/"Register" links land directly on the register tab instead of always defaulting to sign-in.
- **Homepage hero rebuilt** as a centered layout (previously two-column) matching the reference: small pill badge with the instructor's photo ("Programs by CloudVidya Academy"), bold headline with one word in the primary blue, subtitle, the search bar, then the real course/track count + enrolled/lesson stats.
- **`InstructorSection` restructured** to match the reference's actual layout: square photo on the left (using the real photo now, not a placeholder path), "Founder of CloudVidya Academy" label + bold heading + bio on the right, then a real link row (LinkedIn, mailto: email) — kept the certifications list from the previous pass since it's real content the reference-2 site doesn't happen to show but adds genuine credibility.
- **New `SupportSection`** ("Need help?") using the client's support email (`veeranna@cloudvidyaacademy.com`, previously `vcgatate@gmail.com`) as both a mailto: link and displayed text — matches the reference's student-support block.
- **New shared `Footer` component** (`packages/ui/src/components/footer.tsx`) — brand + description, two link columns, LinkedIn/email icons, copyright, and the reference's giant low-opacity background wordmark. **Only real, working links included** — Home, Browse, Sign in, Register, Profile. Deliberately did **not** add Terms & Conditions / Privacy Policy / Refund & Cancellation links like the reference has, since those pages don't exist and fabricating either the links or placeholder legal text would be worse than not having them.
- **Flagging, not fixing**: this is a payment-collecting platform now (Razorpay), and it currently has no Terms of Service, Privacy Policy, or Refund/Cancellation policy anywhere — genuinely worth the client's attention before going live (Razorpay's own merchant approval sometimes expects these), not something I should draft unilaterally since it's legal content, not UI.

---

## Phase 9 — Merge notes + video into one app ✅

**Client decision (2026-09-26):** one website at `www.cloudvidyaacademy.com`
with everything in it; the client will remove the old static site there and
put this one up. The domain is registered with Amazon Registrar, DNS is in
Route 53, and the same zone carries the client's Google email (`MX
smtp.google.com` + a `google-site-verification` TXT) — **DNS changes must be
additive and must never touch MX/TXT.** The old site (S3 + CloudFront) serves
both the apex and `www`; note its alias records before repointing so the
change can be rolled back.

- [x] `apps/video` renamed to `apps/web` (`@repo/web`, port 3000); `apps/notes`
      folded in and removed. Dependencies unioned (`@google/generative-ai`,
      `@qdrant/js-client-rest`, `fuse.js` added).
- [x] **Routes:** `/` course landing (unchanged), `/courses/...` (unchanged),
      `/notes` (was the notes app's `/`; `app/notes/layout.tsx` mounts the
      Cmd+K `SearchDialog`), `/tracks/...` (unchanged), one `/admin` with
      Courses / Notes / Comments tabs, one `/profile` (courses, bookmarks,
      quiz history, admin badge), one `/auth`, union of all `/api/*` routes.
- [x] **Actions:** `lib/actions.ts` (courses/videos) and
      `lib/track-actions.ts` (was the notes app's `lib/actions.ts`). The two
      files have no overlapping export names, so they sit side by side
      instead of being merged into one file.
- [x] **Cross-app plumbing removed:** `NEXT_PUBLIC_VIDEO_APP_URL`,
      `NEXT_PUBLIC_NOTES_APP_URL` and `NEXT_PUBLIC_APP_URL` are gone (nothing
      read the last one). `TrackPaywall` now links to `/courses/<slug>`
      internally; the navbar has Courses + Notes links. Only `NEXTAUTH_URL`
      is needed for the site's own URL.
- [x] **Tailwind:** took the notes config (a superset: `destructive`/`popover`
      colors and the accordion keyframes the video config lacked). Replaced
      `require("tailwindcss-animate")` with an ES import — the `require` was
      an existing `no-require-imports` lint error in both apps.
- [x] **Dockerfile:** single `apps/web/Dockerfile`, port 3000. Fixed two bugs
      both old Dockerfiles had: `packages/storage/package.json` was never
      copied (added after they were written), and in a monorepo the standalone
      server lands at `apps/web/server.js`, so static assets, `public/` and
      the `CMD` all needed the `apps/web/` prefix.
- [x] **Verified:** `tsc --noEmit` clean; `next build` generates 25 pages; the
      standalone output run in the Docker image's layout
      (`node apps/web/server.js`) returns 200 for `/`, `/notes`, `/auth`,
      static assets and `/api/auth/providers`, 404 for unknown course/track
      slugs, and 307 → `/auth` for `/admin` and `/profile` when signed out.
      Docker itself isn't runnable on the dev machine, so the image was never
      actually built.
- [ ] **Follow-up:** the navbar search is courses-only and the notes Cmd+K
      search only exists on `/notes`; a single search across both is a
      possible improvement, not done.

The `### apps/notes` and `### apps/video` reference sections above describe
the two apps as they were before this merge and are kept for history.

---

## Phase 10 — Notes sections (slides + practice questions), playlist thumbnails, rebrand ✅

Client requirements (2026-09-26): in Notes he uploads a PPT for each section
directly on the page, with MCQs for students to practise; in Courses he
uploads the videos and needs a thumbnail option for each new playlist; and
the institution name is "CloudVidya Academy" everywhere.

- [x] **Rebrand:** navbar/footer brand and the giant footer wordmark now say
      "CloudVidya Academy" (all other copy already did). Wordmark shrunk
      (`12vw` → `8vw`) so the longer name isn't clipped; the navbar brand can
      wrap on phones and the theme toggle is hidden below `sm` (the site is
      dark-only by design) so nothing overflows at 375px.
- [x] **Notes model — no data-model change beyond one column.** A "section" is
      still a `Problem` row and can now carry a presentation (`pptUrl`),
      practice MCQs, or both; `type` is kept as `PPT` when a file exists,
      `MCQ` otherwise. New migration `20260926120000_mcq_question_created_at`
      adds `MCQQuestion.createdAt` so questions keep the order they were added
      in (Postgres doesn't guarantee row order). **Must be applied to Neon:**
      `prisma migrate deploy` from `packages/db` with the direct URL.
- [x] **In-page admin editing** (admins only, on the track page itself):
      sidebar "Add section" form (title, description, optional slides upload);
      per-section "Edit this section" panel — rename, upload/replace/remove
      slides, add/edit/delete practice questions, move up/down, delete (with
      an in-page confirm, no browser dialogs). Server actions in
      `lib/track-actions.ts` (`addSection`, `updateSection`, `setSectionPPT`,
      `deleteSection`, `moveSection`, `addQuestion`, `updateQuestion`,
      `deleteQuestion`, `toggleTrackHidden`). The old separate "PPT lesson" /
      "MCQ lesson" forms and `addPPTLesson`/`addMCQLesson` are gone; `/admin`
      → Notes now only creates tracks, lists them ("Open & edit", hide/show)
      and runs AI indexing.
- [x] **Slides show on the page.** `PPTViewer` embeds PDFs natively and PPT/PPTX
      through Microsoft's Office viewer iframe (needs a public https URL, so it
      only works once files live in cloud storage; locally it falls back to an
      "open in a new tab" card). `/api/admin/upload-ppt` now accepts
      `.ppt/.pptx/.pdf` (100MB soft cap) and either creates a section or
      replaces a section's file. **PPTX embedding is untested** — it needs a
      deployed public URL; only PDF embedding and the fallback were exercised.
- [x] **Practice mode for students:** questions render under the slides,
      "Try again" resets the quiz, scores save when signed in, and a visitor who
      isn't signed in still sees their result (previously the submit threw and
      the button stuck on "Submitting…"). Prev/Next section links added.
- [x] **Security fix found on the way:** a section could be opened through any
      track's URL (`/tracks/<free track>/<paid track's section id>`), bypassing
      the paywall, because only the track was access-checked. The page now
      404s unless the section belongs to the track. Admins can also open
      bundled tracks without "buying" them.
- [x] **Thumbnails by upload:** new `/api/admin/upload-image` (JPG/PNG/WebP,
      4MB, no SVG) and a shared `ThumbnailPicker` replace every "Image URL"
      text box — course create/edit, track create — and add thumbnails to
      playlists (sections) and videos, with a change-thumbnail button on
      existing ones. Sections' thumbnail shows in the course curriculum
      header; a video's is stored both as `Content.thumbnail` (list) and
      `VideoMetadata.thumbnail1Url` (player poster). No schema change
      (`Content.thumbnail` already existed).
- [x] **Upload progress:** video, slide and section uploads use XHR with a
      progress bar (`components/admin/upload.tsx`); stored filenames are
      sanitised (a `../` in an uploaded name could previously escape the
      local uploads folder).
- [x] **Validation shown reliably:** Next.js anonymises errors thrown from
      server actions in production builds, so question rules live in
      `lib/question-validation.ts` and run in the form first (the server
      re-checks). Other older admin forms still rely on thrown messages and
      would show a generic error in production.
- [x] **Track page** now renders on demand (`force-dynamic`) and
      `generateStaticParams` is gone — it depends on who is looking, and the
      old version needed a database at build time. Fixed the page height
      (`3.5rem` → `4rem` navbar) and made the section list stack above the
      lesson on phones (it squeezed the lesson into ~100px).
- [x] **Verified** with a real browser (Playwright driving headless Chrome)
      against a throwaway Postgres running all 4 migrations from scratch (no
      drift): 26 checks on the notes flow pass against both the dev server and a
      production build (`next build` + `next start`); the video/thumbnail flow
      passes on the dev server. Also checked at a 375px phone width.
      Docker was not available, and the E2E scripts are not in the repo.
- [ ] **Not done — production file storage.** `next start` returns 404 for
      files written to `public/` after startup (checked), so uploads only work
      locally. `@repo/storage` supports Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
      or local disk only — there is no S3 backend, and on serverless hosts big
      uploads still hit the ~4.5MB request cap (see Open risks). Decision
      needed on hosting + storage before real uploads work when deployed.

---

## Phase 11 — Fuller home and notes pages (client: "not minimalistic") ✅

The client found the home hero sparse — big empty margins, and a single
course leaving two thirds of its row blank — and wants it to look full, with
images or animation.

- [x] **Home hero** (`app/(marketing)/page.tsx`): full-bleed, two columns.
      Left — badge, gradient headline ("Level up your Cloud & DevOps skills"),
      copy, Browse courses / Explore notes buttons, search, and stat tiles.
      Right (`components/home/HeroArt.tsx`, desktop) — the instructor's photo
      in a gradient frame, a rotating dashed orbit, pulsing rings, five
      infrastructure icons joined by animated dashed lines, and four floating
      glass cards. Behind it `AnimatedBackdrop`: fading grid + three drifting
      colour blobs.
- [x] **New sections:** scrolling topics strip (`TechMarquee`), 8-card feature
      grid (`FeatureGrid`), a notes showcase with a mock slide + quiz
      (`NotesShowcase`), and a sign-up / "keep going" banner (`JoinBanner`).
      The instructor section gained bottom spacing. The marketing layout no
      longer wraps everything in a narrow `container` so sections can run edge
      to edge. Search results (`/?q=`) hide the marketing sections.
- [x] **Few courses no longer look empty:** exactly one course renders as a
      wide `FeaturedCourse` card; two courses use a two-column grid; three or
      more keep the three-column grid. Same idea for tracks on `/notes`.
- [x] **Notes page** gets the same backdrop, stat tiles, a 3-step "how it
      works" row and the adaptive track grid; track cards say "sections".
- [x] **Nothing invented:** every number and claim comes from real data or
      from the client's own instructor content in `lib/instructor.ts` — course
      and enrolled counts from the database, "6 AWS certifications" from the
      certification list, "7+ years" from the bio (`experienceYears`), topics
      from `expertise`. Each feature card describes something the platform
      does. No testimonials, student counts or logos were made up.
- [x] **Motion:** pure CSS keyframes added to `tailwind.config.ts` (`float`,
      `blob`, `marquee`, `dash`, `fade-up`, `pulse-ring`, `spin-slow`,
      `gradient-shift`); all animated pieces use `motion-reduce:animate-none`.
      No extra JavaScript or new dependencies.
- [x] **Verified** in headless Chrome at 1440px in light and dark, and at
      360/390/430/768px. That found a real phone bug (headline forcing the
      hero column wider than the screen, clipping the buttons and search bar),
      fixed by only keeping "Cloud & DevOps" on one line from `sm` up and
      adding `min-w-0` to the column. Type-check, lint and `next build` pass.
      Lighthouse/performance were not measured.
- [ ] **Not done:** no stock photography or generated imagery — visuals are the
      instructor photo plus drawn shapes. The hero art is hidden below `lg`
      (phones get the text, stats, topics strip and cards). If the client has
      real photos or a short promo video, they would slot into `HeroArt`.

---

## First real build — critical bugs found and fixed

Everything up to this point had only been read, schema-validated, and
grep-checked — never actually installed, typechecked, or built. This section
ran `yarn install` for real (via `corepack enable`, since no package manager
was installed in this environment) and `next build` for both apps for the
first time ever in this project's history. That surfaced real, previously
invisible defects — some pre-existing (inherited, predate this session
entirely), some introduced this session. All are now fixed and both apps
build clean (`tsc --noEmit` passes, `next build` exits 0) using a dummy
`DATABASE_URL` for anything that doesn't require a live query.

**Pre-existing bugs (predate this session):**

- `packages/ui/src/components/spotlight.tsx`'s `Spotlight` component never
  rendered `{children}` at all — it was purely a decorative mouse-tracking
  gradient div. The notes app's homepage wraps its entire hero heading and
  paragraph in `<Spotlight>...</Spotlight>`, so that text would have
  silently never appeared on the page. Fixed by adding a `children` prop
  and rendering it above the gradient layer.
- `apps/video/app/courses/[courseSlug]/page.tsx`'s "Continue Learning" link
  used `firstContent.id`, but `firstContent` is a `CourseContent` join row
  (`{courseId, contentId, order, content}`), not the `Content` itself —
  the link was silently building `/courses/{slug}/undefined`. Fixed to
  `firstContent.content.id`.
- `apps/notes/lib/search.ts` called `qdrant.search(...)`, a method that no
  longer exists on `@qdrant/js-client-rest` — the resolved version (1.19.0,
  since no lockfile existed to pin an older one) replaced `.search` with
  the unified `.query()` API (`{query: vector}` instead of `{vector}`,
  response shape `{points: [...]}` instead of a bare array). Fixed to use
  `.query()`; `IndexPayload` also needed an index signature to satisfy the
  new client's payload type.
- `packages/auth/src/config.ts` had a `// @ts-expect-error` suppressing an
  adapter type mismatch that no longer exists with the resolved
  `next-auth`/`@auth/prisma-adapter` versions — an unused `@ts-expect-error`
  is itself a type error. Removed the stale comment.
- **The big one:** `packages/auth/src/types.d.ts`'s module augmentation
  (adding `id`/`admin` to `Session.user`) was never actually reachable by
  either app's own TypeScript program — nothing imported it, and it lives
  outside each app's tsconfig `include` glob, so it only ever applied when
  compiling the `auth` package in isolation. Every one of the dozens of
  `session.user.id`/`session.user.admin` call sites across both apps
  (written by the original developer, used everywhere from `lib/actions.ts`
  to `lib/community.ts` to `profile/page.tsx`) failed to typecheck and
  **failed `next build`** — this would have blocked shipping the app
  entirely, and had never been caught because the build had never run.
  Fixed with a triple-slash reference (`/// <reference path="./types.d.ts" />`)
  in `packages/auth/src/index.ts` — a plain `import "./types"` looked like
  it'd work too but made webpack try to bundle a file with no runtime JS,
  breaking the build differently; the triple-slash form is compile-time-only
  for TypeScript and invisible to bundlers.
- Both apps' `/auth/page.tsx` call `useSearchParams()` without a `<Suspense>`
  boundary, which Next.js's App Router requires during static
  prerendering — `next build` failed on both. Fixed by splitting each into
  an outer default export wrapping an inner component in `<Suspense>`.

**Introduced this session, caught before being an issue:**

- `apps/video/lib/youtube.ts`'s regex-match branch returned
  `string | undefined` where `string | null` was expected (a
  `noUncheckedIndexedAccess` strictness catch) — fixed with `?? null`.
- The two new `/auth/reset-password` pages have the same `useSearchParams()`
  pattern as the pre-existing `/auth` bug above — fixed the same way,
  before it ever shipped.

**What this means going forward:** both apps now build successfully end to
end (`next build` exit 0) against a dummy, unreachable `DATABASE_URL` — the
only thing that still can't be verified without Phase 1's real Postgres is
`generateStaticParams` on the notes app's track page, which needs to
actually query the database at build time to enumerate which tracks to
pre-render (confirmed this is a connectivity issue, not a code defect — the
error is a plain "denied access" from Prisma trying to reach the dummy
`postgresql://user:pass@localhost:5432/db`). Docker is installed on this
machine but the daemon isn't running, so a local Postgres for full
end-to-end testing (including a real migration + seed) wasn't attempted —
that's the natural next validation step once Phase 1 starts.

---

## First real local run — the app had genuinely never been started before this

Docker Desktop was started, `docker-compose` brought up real Postgres +
Redis, a real `.env` was created, the schema was migrated and seeded, and
`yarn dev` ran both apps for the very first time ever. This is a stronger
test than the build check above (that only proves the code compiles; this
proves pages actually render real data end to end) and it found bugs the
build check couldn't:

- **This machine already runs a native Postgres on `127.0.0.1:5432`**
  (unrelated to this project), which silently intercepts connections to
  `localhost:5432` ahead of Docker's port-forward — `docker exec` into the
  container worked, but `psql`/Prisma connecting via `localhost:5432` hit
  the _other_ Postgres and got "role does not exist". Fixed with a
  gitignored `docker-compose.override.yml` remapping the container to host
  port 5433 — the committed `docker-compose.yml` (host port 5432) is
  untouched, so this doesn't affect anyone without the same conflict.
- **`turbo.json`'s `"pipeline"` vs `"tasks"` key (previously logged as a
  soft "risk") is actually a hard failure** with the resolved Turbo version
  (2.10.12) — `yarn dev` refused to start at all, not just a warning. Fixed
  by renaming the key.
- **`packages/db/prisma/seed.ts` crashed** ("hash is not a function") — it
  dynamically `await import()`-ed `bcryptjs` (a CommonJS package), which
  doesn't interop the same way as a static import in this setup. Fixed by
  switching to the static `import { hash } from "bcryptjs"` already used
  successfully elsewhere in the codebase (`packages/auth`).
- **The real homepage was unreachable in both apps** — `apps/notes/app/page.tsx`
  and `apps/video/app/page.tsx` were leftover scaffold placeholders
  ("Notes Platform" / "Video Platform" stub text) sitting at the same `/`
  route as the real homepage in `app/(marketing)/page.tsx` (a route group
  doesn't change the URL, so both resolved to `/`). Next.js silently picked
  the top-level placeholder with no error or warning at any point —
  `next build` didn't catch it either, since it's not a type or build
  error, just two files matching one route. The Navbar, search, and
  track/course grid on the _actual_ homepage were structurally unreachable
  until this was caught by actually loading the page and not seeing the
  expected content. Fixed by deleting both placeholder `page.tsx` files.
- **Next.js only auto-loads `.env` from an app's own directory, not the
  monorepo root** — a root-level `.env` (matching where `.env.example`
  lives) is invisible to `next dev`/`next build` unless something copies or
  symlinks it down into `apps/notes/` and `apps/video/`. Worked around
  locally by copying `.env` into both app directories (with `NEXTAUTH_URL`
  adjusted per app's port) — **this needs a real decision for Phase 1**:
  either commit to always copying `.env` into both app dirs as a documented
  setup step, or add a small `predev`/`prebuild` script that copies it
  automatically. Not fixed generically yet since it's a process/tooling
  decision, not a code bug.

After all of the above, both apps serve real seeded content: the notes
homepage renders "Learn at your own pace" + the seeded "Introduction to
TypeScript" track card; the video homepage renders "Level up your skills" +
the seeded "Full Stack Development 101" course card; `/admin` on both
correctly 307-redirects an unauthenticated request to `/auth`; the seeded
MCQ lesson renders and is answerable. The one page that legitimately errors
(500) is the seeded Blog-type lesson, because its `notionDocId` is the
seed's own placeholder string `"replace-with-real-notion-page-id"` — that's
expected until a real Notion integration is configured, not a bug.

Local login: **admin@example.com / admin123** (from the seed script).

---

## Phase 12 — Pre-deployment cleanup & security hardening ✅

**Decision (2026-10-04):** hosting is **AWS App Runner** running the
`apps/web/Dockerfile` image, with Route 53 for DNS. The app is server-rendered
(16 route handlers, 4 `"use server"` modules, session-gated pages), so it cannot
be a static S3 + CloudFront site. A `next build` with `output: "export"` fails
on the first API route, and the full list of server-only features is above.

- [x] **Deleted:** `apps/notes/` (untracked leftover with a stale `.env`),
      `apps/cloudVidya.png` and `apps/veerannaSir.png` (byte-identical copies of
      files in `public/`), `apps/web/public/demo-lesson.mp4` and
      `course-fullstack-thumbnail.jpg` (seed-only; the video was identical to the
      deleted `sampleimg/` copy, so it is gone from disk), `sampleimg/`,
      `components/NavSearchTrigger.tsx`, and dead actions `getCertificate`,
      `claimCertificate`, `markTrackIndexed`.
- [x] **UI package:** removed 17 unused shadcn components, plus `use-toast.ts`
      (imported the deleted toast) and `globals.css` (never imported). The index
      exports only the 8 active modules. `packages/ui` typechecks; it previously
      failed on a missing session type.
- [x] **Dependencies removed:** `framer-motion` (apps/web, packages/ui),
      `react-scroll-to-top`, and 10 unused Radix packages.
- [x] **Node 22** everywhere (Dockerfile `node:22-alpine`, root `engines`). Node 20
      is past end-of-life, and the locked `eslint-visitor-keys@5` needs Node
      20.19+. `openssl` added to the Alpine image for Prisma.
- [x] **Qdrant pinned** to `~1.18.0` in `apps/web`. `1.19` requires Node 22+ and
      `1.18` still exposes the `query()` call `lib/search.ts` uses (checked in the
      published typings). Relax to `^1.18` on Node 22 if you want the latest.
- [x] **Ignores:** `.gitignore` and `.dockerignore` now cover `out/`, `build/`,
      `*.log`, `.env*` (except `.env.example`), `.vercel/`, `.eslintcache`,
      `coverage/`, and `apps/*/public/uploads`.

**Security fixes**

- [x] **Paid courses could be taken for free.** `purchaseCourse` never checked
      the price, so any signed-in user could `POST /api/purchase` with a paid
      course ID. It now refuses paid and hidden courses.
- [x] **Paid lessons readable by anyone.** `getCourse` returned every `videoUrl`
      and `getContent` returned any lesson by ID. Both are now gated. The course
      outline has no URLs, and `getContent` returns `null` unless the caller owns
      the lesson's course (or is an admin). Lessons were also reachable across
      courses (buy course A, read course B's lessons by ID). Fixed by resolving
      each lesson's course.
- [x] **Bundled slides and quizzes readable by anyone.** `getTrack` returned
      `pptUrl` for every section, and `getProblem` returned any section. Both are
      now gated on the section's track.
- [x] **Bookmarks leaked video URLs.** `toggleBookmark` had no purchase check,
      and `getBookmarks` returned `videoMetadata`. Both are fixed.
- [x] **Comments, questions and answers** on paid lessons need the purchase.
      Text fields have length limits (5000 characters, 200 for titles).
- [x] **Quiz scores** are checked as integers in `0..questionCount` and need
      access to the section.
- [x] **Rate limiting** trusted the leftmost `x-forwarded-for` hop, which the
      client controls. It now uses the rightmost hop. Login was not rate limited
      at all. It is now 10 attempts per email per 15 minutes.
- [x] **Razorpay:** signatures compared in constant time, and the webhook grants
      access only when the captured amount matches the order.
- [x] **Upload validation:** each file must match an allowlist of extension and
      magic bytes (JPEG/PNG/WebP, PDF/PPT/PPTX, MP4/MOV/WebM). Video is capped at
      1 GB. Cross-origin multipart posts are rejected by Origin. A declared
      `Content-Length` over the cap gets a 413. Before this, a renamed `.html`
      could be stored under `public/`.
- [x] **Revalidate endpoint:** the secret moved from the query string to an
      `Authorization: Bearer` header and is compared with `timingSafeEqual`.
      `path` must be site-relative.
- [x] **Email:** the register name is HTML-escaped in the verification email.
      Password length is capped at 128. The recipient address is no longer logged.
- [x] **No localhost fallback** for `NEXTAUTH_URL`, so links can't silently point
      at localhost. (The brief said `AUTH_URL`; this codebase reads `NEXTAUTH_URL`.)
- [x] **Security headers** in `next.config.js`: HSTS, a Content-Security-Policy
      limited to the hosts the app uses (Razorpay, Office viewer), X-Frame-Options,
      nosniff, Referrer-Policy and Permissions-Policy. `X-Powered-By` is off.
- [x] **Session lifetime** is 7 days (NextAuth's default is 30).
- [x] **Search** query capped at 200 characters. Qdrant URL fails loudly in
      production rather than defaulting to localhost.
- [x] **Cache key** for courses moved to `course:v2:` so entries that still hold
      video URLs stop being served.

**Verification**

- `tsc --noEmit` passes in `apps/web`, `packages/ui`, `packages/auth`,
  `packages/db`, `packages/storage`, `packages/cache` and `packages/store`.
- `yarn lint` passes: 0 errors, 26 `no-explicit-any` warnings (unchanged).
- Strict `yarn install --frozen-lockfile` passes under Node 22.
- `next build` passes under Node 22 (28 routes; first-load JS down about 20 kB on
  the home and admin pages after removing `framer-motion`).
- The standalone server, laid out like the Dockerfile runner, returns the expected
  security headers, rejects unauthenticated purchase, bookmark and progress
  calls with 401, and rejects the old query-string revalidate secret.
- Paywall integration tests run against a throwaway local database: 40 checks,
  all passing with the fixes. The same suite against the original code fails 23
  of them. The test database is separate from the dev database.
- **Not verified here:** the Docker image build (the Docker daemon's API socket
  timed out during this run), and a live browser pass over the CSP.

## Phase 13 — Razorpay checkout hardening (test mode) ✅

Phase 4 built the Razorpay flow. This pass checked it against the client's
requirements and fixed the gaps. The test key ID (`rzp_test_…`) is set in the
local env files. **The key secret and webhook secret are not set yet.**

- [x] **Amount comes from the server.** The order endpoint takes only `courseId`
      and ignores any `amount` in the body. The price is read from the database
      and converted to paise. A tampered request can't change the charge.
- [x] **Order endpoint:** rejects hidden, free and already-owned courses, and
      rate limits to 10 orders per user per minute. It returns `orderId`,
      `amount` (paise), `currency` and the key ID. Notes carry `userId` and
      `courseId`.
- [x] **Signature check** uses `crypto.timingSafeEqual` over the HMAC-SHA256 of
      `order_id|payment_id`. Malformed input is rejected rather than throwing.
- [x] **Webhook** checks its signature the same way and grants access only when
      the captured amount matches the order. A missing secret returns a clear 500.
- [x] **Missing configuration fails loudly** with "Payments are not configured
      yet" in the logs and the response, instead of an unhandled crash.
- [x] **Checkout button:** `checkout.js` loads once even under double clicks. It
      is locked from the first click until the modal closes. Errors are shown
      inline, including failed verification (with the payment ID for support).
      Name and email are pre-filled from the session. The business name is
      "Cloud Vidya Academy". It refuses to open checkout if the browser's key ID
      differs from the key the server used for the order.
- [x] **Env:** `NEXT_PUBLIC_RAZORPAY_KEY_ID` added to `.env.example`. The
      Dockerfile takes it as a build argument, because `NEXT_PUBLIC_*` values
      are compiled in at build time. The secret is never in the bundle (checked).
- [ ] **Needed from the client:** `RAZORPAY_KEY_SECRET` and
      `RAZORPAY_WEBHOOK_SECRET`. Without them, checkout reports "Payments are not
      configured yet". Webhook URL to register in the dashboard:
      `https://www.cloudvidyaacademy.com/api/razorpay/webhook`.
- [ ] **Browser run of the full checkout** (test card `4111 1111 1111 1111`)
      once the secret is set. Not done yet.
- [ ] **Before going live:** switch to `rzp_live_` keys in App Runner and the
      build argument, and publish Terms, Privacy and Refund pages (Razorpay
      requires them, see Open risks).

**Verification:** `tsc --noEmit` clean in `apps/web`; `yarn lint` 0 errors
(25 pre-existing `no-explicit-any` warnings). 36 payment route checks pass
against the throwaway database with the SDK stubbed, covering order pricing,
signature verification, idempotency, webhook amount matching and missing
configuration. Production build passes, and the browser bundle contains the
public key ID but no secret variable names.

## Phase 14 — Live Razorpay and production hardening ✅ (code); deploy pending

**Live keys:** the client's live key ID and secret are in `apps/web/.env.production.local`
(gitignored, mode 600, excluded from the Docker build). The key pair was checked
with one read-only API call. Local `.env` keeps the test key, so `yarn dev` cannot
create live charges. Live values belong in App Runner, not in files in the repo.

- [x] **Live integration:** same flow as Phase 13. The order amount comes from the
      database and is converted to paise. Verification uses `crypto.timingSafeEqual`.
      The webhook returns explicit statuses: 400 for bad signature or body, 500 when
      unconfigured, and 200 with `granted`, `already_granted`, `ignored`,
      `unknown_order` or `amount_mismatch`. Checkout locks the button while processing.
- [x] **Startup check** (`apps/web/lib/env.ts`, `instrumentation.ts`): in production the
      server refuses to start when a required variable is missing, and names every
      missing one. Verified: an empty environment fails with the full list.
- [x] **No silent fallbacks:** `REDIS_URL` and `QDRANT_URL` no longer default to
      localhost. Production uploads refuse local disk, which is lost on every deploy.
      Production email refuses to skip sending when SMTP is unset.
- [x] **Logging:** all `console.log` and `console.warn` removed from application code.
      `console.error` stays for real failures. The dev-only email print is gated to
      `NODE_ENV=development`. The seed script keeps its `console.log` (CLI only).
- [x] **Boundaries and metadata:** `not-found.tsx`, `error.tsx`, `global-error.tsx`,
      an icon (`app/icon.png`), a title template and `metadataBase`. The description
      no longer promises certificates.
- [x] **Assets:** the logo was reduced to 256 px and the instructor photo to 320 px.
      Removed the untracked local dev upload output.
- [x] **Build:** `tsc --noEmit` clean in every package. `yarn lint`: 0 errors, 25
      `no-explicit-any` warnings. Standalone build passes with
      `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_…` as build argument. The browser bundle
      contains the live public key ID and not the secret.
- [x] **Tests:** 36 payment checks, 40 paywall checks and the helper checks pass.
      The standalone server boots with a full placeholder environment, and returns
      the 404 page, the favicon, the security headers, 401/400 on unauthenticated
      Razorpay routes, and no stack traces in responses.
- [ ] **Docker image build not run.** The Docker daemon's API socket timed out. Run
      `docker build --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_… -f apps/web/Dockerfile -t cloudvidya-web .`
      from the repo root once Docker Desktop responds.
- [ ] **Browser check of checkout, and a first real payment.** Do this with a low-price
      course, then refund it from the dashboard. Live charges move real money.
- [ ] **Rotate the live key secret.** It was pasted into a chat transcript. Regenerate
      it in the Razorpay dashboard, then update App Runner.
- [ ] **Webhook secret:** `RAZORPAY_WEBHOOK_SECRET` has not been provided. Until it is set,
      the webhook returns 500 and Razorpay keeps retrying. Register
      `https://www.cloudvidyaacademy.com/api/razorpay/webhook` in the dashboard.

**Required in App Runner (production runtime):**
`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_FROM`, `RAZORPAY_KEY_ID` (`rzp_live_…`), `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN`, `REDIS_URL`, `REVALIDATE_SECRET`.
Optional: `QDRANT_URL`, `QDRANT_API_KEY`, `GOOGLEAI_API_KEY`, `VECTOR_SIZE`.
**Docker build argument:** `NEXT_PUBLIC_RAZORPAY_KEY_ID`, set to the same value as `RAZORPAY_KEY_ID`.

## Phase 15 — Launch blockers resolved (code) ✅; Docker and deploy pending

- [x] **Certificate promises removed** from the feature grid, hero card, featured
      course list, marketing intro and README. Replaced with practice quizzes and
      lesson Q&A, which exist. The instructor's own AWS certifications stay: they
      are real credentials.
- [x] **Email verification required for password login when SMTP is configured.**
      The check runs after the password matches, so it reveals nothing about
      whether an address exists. With SMTP unset (development), login is not gated.
      The sign-in page explains the situation and points to "Forgot password".
      Following a password-reset link also marks the email verified. This is the
      way out for accounts that never verified.
- [x] **Post-registration sign-in no longer redirects** to a generic error. The
      "check your inbox" message stays on screen when verification is required.
- [x] **`/notes` renders per request** (`dynamic = "force-dynamic"`). It used to be
      prerendered hourly, which needed the database and Redis during `next build`.
      The Docker build has neither, so it would have failed. The track list is still
      cached in Redis. The ISR hour is gone.
- [x] **Build no longer depends on the environment.** The standalone build passes
      with `DATABASE_URL` and `REDIS_URL` unset.
- [x] **Verified:** `tsc --noEmit` clean in every package. `yarn lint` 0 errors (25
      `no-explicit-any` warnings). The authorize gate was tested against the real
      `config.ts` and database: 7 of 7 pass. Helper checks pass.
- [ ] **Docker image not built.** The Docker Desktop daemon is unresponsive. A restart
      attempt stopped the local Postgres container that serves port 5433, so the dev
      database is down until Docker is running again.
- [ ] **Re-run the database suites** (payments 36, paywall 40) once Postgres is back.
      They passed before the auth change. The auth change is covered by the gate tests.

**Before taking password logins in production:** count existing accounts that will be
gated. Run this on the production database and decide what to do with the result:
`SELECT count(*) FROM "User" WHERE password IS NOT NULL AND "emailVerified" IS NULL;`
Those accounts can verify through "Forgot password". Marking them verified in bulk is
a decision for the client.

## Phase 16 — Auth UX, startup config checks, direct uploads ✅ (code); live Blob and OAuth untested

- [x] **Social sign-in only shows when configured.** A GitHub or Google provider is
      enabled only when both its ID and secret are set and neither is a placeholder
      (`dummy`, `changeme`, `your…`, `example`, `<…>`, `.invalid`/`.example` hosts). The
      same check gates the NextAuth provider list, so a hidden button can't be used.
      `GET /api/auth/config` reports which are on. The sign-in page hides the buttons and
      the "or continue with email" divider when neither is on.
- [x] **Strict startup checks** (`apps/web/lib/env.ts`, run from `instrumentation.ts`).
      In production a missing required variable, a bad format (`DATABASE_URL`,
      `REDIS_URL`, `NEXTAUTH_URL` not https), a `BLOB_READ_WRITE_TOKEN` without the
      `vercel_blob_rw_` prefix, or a placeholder secret stops the server. Findings are
      printed by variable name only, never by value. Outside production they are warnings.
- [x] **Resend verification email.** The sign-in page shows "Email not verified? Click
      here to resend verification email" after an `EMAIL_NOT_VERIFIED` error.
      `POST /api/auth/resend-verification` always answers with the same message, so it
      can't reveal whether an address has an account. Limits: 10 per IP per hour, 3 per
      email per hour.
- [x] **Show/hide password** on sign-in, register and reset-password forms
      (`components/PasswordInput.tsx`). The button has an accessible name and reports
      its pressed state.
- [x] **Direct browser-to-Blob uploads for videos and thumbnails.** When
      `BLOB_READ_WRITE_TOKEN` is set, the admin page uploads straight to Vercel Blob using
      `upload()` from `@vercel/blob/client`. The server never buffers the file. - `/api/admin/upload-config` tells the page which mode is on (admin only). - `/api/admin/blob-upload` issues the short-lived upload token. It requires an
      admin and allows only the folder, extensions, content types and size for the
      kind (images 4 MB; videos 500 MB, multipart). - `/api/admin/blob-verify` (images) and `/api/admin/videos` (videos, then the
      record) check the file's first bytes against its extension. A mismatch deletes
      the blob. Only URLs on `*.public.blob.vercel-storage.com`, under `images/` or
      `videos/`, are accepted. - `/api/admin/upload-video` and `/api/admin/upload-image` answer 410 when Blob is
      configured. Without a token (development) they still write to `public/uploads`. - The CSP `connect-src` now allows `https://blob.vercel-storage.com`.
- [x] **Build regression fixed.** `env.ts` had imported the `@repo/auth` root, which
      pulls in `next-auth` and its Node `crypto` import. `instrumentation.ts` is also
      bundled for the Edge runtime, so the dev server and build failed. `env.ts` now
      imports the `@repo/auth/placeholder` subpath.
- [x] **Verified:** `tsc --noEmit` clean in `apps/web` and `packages/auth`. `yarn lint`
      0 errors (26 `no-explicit-any` warnings). `next build` passes. Route checks on the
      dev server: anonymous requests to every new admin route get 401. The token route
      issues tokens for valid video and image requests and rejects 8 malformed requests
      with 400 (test token, no network). The URL parser and byte check pass on real file
      heads and on a local HTTP server. The auth page in headless Chrome hides the social
      buttons and divider, and the eye toggle works on sign-in and register. Resend
      returns the same message every time and gives 429 on the fourth request in an hour.
- [ ] **Not verified (needs live credentials or data):** a real upload to Vercel Blob
      (no token here), the admin page using direct mode end to end, the resend link after
      a real `EMAIL_NOT_VERIFIED` login, and the social buttons with OAuth configured.
- [ ] **Slides still buffer on the server.** `/api/admin/upload-ppt` is unchanged and
      still reads files up to 100 MB into memory. Move it to direct upload if the
      client's decks get large.
- [ ] **Orphan blobs are possible.** A direct upload that succeeds, followed by a failed
      save, leaves the file in storage with no record. Clean up later if it matters.

## Open risks / known issues

- `turbo.json` uses the Turbo v1 `"pipeline"` key while `turbo@^2.0.0` is
  installed (v2 expects `"tasks"`). Works today via v2's backward-compat
  shim, but should be migrated if it ever starts warning/breaking.
- `docker-compose.yml` has no Qdrant service, so local dev needs either a
  manually-added Qdrant container or just pointing `QDRANT_URL` at the
  Qdrant Cloud free tier even locally.
- `apps/video`'s NOTION content type has UI/schema support but no real
  renderer — the content viewer just shows the raw `notionId` in a `<code>`
  tag, unlike the notes app's fully working `NotionRenderer`. It's also
  unreachable in practice: the video admin only has a creation flow for
  Course/Section/Video, nothing creates NOTION-type content, so this is
  dead code inherited from before this project started, not a live bug.
  Building a real renderer (or a creation flow for it) wasn't requested by
  the client and would be speculative work — flagged rather than built.
  Certificates are similarly minimal by original design: `Certificate` is
  just a DB row + a `slug`, no PDF/asset generation — also never requested.
- `lucide-react` is used throughout `apps/video` (including
  `CourseManager.tsx`/admin export button) but isn't a direct dependency in
  `apps/video/package.json` — it resolves transitively via `@repo/ui` and
  Yarn 1's hoisting. Pre-existing pattern, flagged in case a future
  package-manager change stops hoisting it and imports start failing.
- SMTP isn't configured (Phase 1) — register/reset emails are logged, not
  sent, until `SMTP_HOST` etc. are set. Functionally complete otherwise.
- Phases 2–6 are now verified to typecheck and build, but still haven't run
  against a live database — a real manual test (create a course, add a
  section+video, purchase it with a real Razorpay test key, confirm the
  linked notes track unlocks, download the Excel export, register/reset a
  real account) is still needed once Phase 1 infra exists.
- **Production database is migrated but empty** (Neon, Singapore; all 3
  migrations applied 2026-09-26, no drift). **Never run `yarn db:seed` against
  it** — the seed creates `admin@example.com` / `admin123`. Create the real
  admin by registering through the site, then
  `UPDATE "User" SET admin = true WHERE email = '<their email>';`. Run
  migrations with Neon's _direct_ (non-pooled) URL; the running app should use
  the pooled URL plus `&pgbouncer=true&connect_timeout=15`.
- **Vercel Hobby is for non-commercial use** and this site sells courses, so
  the free-plan hosting assumption needs the client's decision (paid plan, or
  another host). Vercel functions also cap the request body at ~4.5MB, which
  breaks `/api/admin/upload-video` and `/api/admin/upload-ppt` for real lecture
  files in production — they need client-side direct uploads to Blob/S3 (or a
  host without that cap) before large uploads work when deployed.
- **Uploaded files don't survive/serve in production without cloud storage.**
  Verified: a production Next server 404s anything written to `public/` after
  it started, and serverless disks are ephemeral anyway. Thumbnails, slides
  and videos therefore need Vercel Blob (`BLOB_READ_WRITE_TOKEN`, supported) or
  an S3 backend (not built). Uploaded-image hosts must also be in
  `next.config.js` `images.remotePatterns` (`**.amazonaws.com` and Vercel Blob
  are; a custom CloudFront domain would need adding).
- **The GitHub repo is public** and contains the client's logo and
  instructor photo; make it private before pushing.
- Legal pages (Terms, Privacy, Refund/Cancellation) still don't exist and are
  expected by Razorpay before live payments — waiting on the client's text.

- ~~**Certificates are advertised but not built.**~~ Resolved in Phase 15: the
  promise was removed from the copy. Building certificates later is a separate feature.
- **Partly resolved (Phase 15):** password login now requires a verified email
  when SMTP is configured. **Still open:** GitHub and Google use
  `allowDangerousEmailAccountLinking`. Removing it, or using a verified-email
  check, closes the remaining path where an OAuth sign-in attaches to an existing
  account with the same address.
- **Password reset does not end existing sessions.** JWTs are stateless. Fix:
  store `passwordChangedAt` and reject tokens issued before it.
- **Rate limits are in-memory per instance.** Behind App Runner with more than
  one instance, each instance has its own counters. Move them to the Redis
  already used by `packages/cache`. Comments, questions and quiz submissions
  are not rate limited.
- **Quiz answers ship to the browser.** Instant feedback needs `correctOption` on
  the client. Scores are checked for range, not authenticity.
- **Paid video is a plain URL.** Once a student has bought a course they can
  download the file, and the right-click block in `VideoPlayer` is cosmetic.
  Protecting it needs signed or expiring URLs.
- **Uploads are buffered in memory.** A 1 GB video takes about 1 GB of container
  memory. Large lectures need direct-to-storage uploads (S3 or Blob).
- **CSP allows `unsafe-inline` scripts** because Next.js hydration needs them.
  Nonces would be stronger. The policy has not been checked in a browser.
- **Server Actions behind a proxy:** Next.js rejects a Server Action whose Origin
  does not match the host. Confirm a comment submission works on the custom
  domain after deploy, and set `serverActions.allowedOrigins` if it doesn't.
- **Certificate and Notion dead branches**: `courses/[courseSlug]/[contentId]`
  still renders a "Notion content" placeholder. Remove it after confirming no
  `NOTION` rows exist. The Prisma schema is left as-is.
- **Operational:** set AWS Budgets alerts and App Runner max instances; use Neon's
  pooled URL in the app and the direct URL for migrations; make the repo private
  before pushing.
