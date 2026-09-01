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

### `apps/notes` (port 3000)

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

### `apps/video` (port 3001)

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
