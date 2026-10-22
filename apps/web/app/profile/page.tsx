import { requireAuth } from "@repo/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui";
import {
  PlayCircle,
  BookmarkCheck,
  ClipboardCheck,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { getUserPurchases, getBookmarks } from "@/lib/actions";
import { getUserQuizScores } from "@/lib/track-actions";
import { getMyCertificates } from "@/lib/internship-actions";
import { MyCertificates } from "@/components/MyCertificates";

function MetricChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-md sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h2>
        {count > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-zinc-500">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-zinc-400">{message}</p>
      <Button
        asChild
        size="sm"
        className="transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:scale-95"
      >
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

export default async function ProfilePage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth");
  }

  const [purchases, bookmarks, scores, certificates] = await Promise.all([
    getUserPurchases(),
    getBookmarks(),
    getUserQuizScores(),
    getMyCertificates(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-blue-950/40 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="avatar"
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-blue-500/30 ring-offset-2 ring-offset-zinc-900"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-zinc-900">
              <UserIcon className="h-7 w-7" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
              {session.user.name ?? "User"}
            </h1>
            <p className="truncate text-sm text-zinc-400">{session.user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {session.user.admin && (
                <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                  Admin
                </span>
              )}
              {session.user.studentId && (
                <span className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-xs text-blue-400">
                  ID: {session.user.studentId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
          <MetricChip value={purchases.length} label="Enrolled Courses" />
          <MetricChip value={bookmarks.length} label="Bookmarks" />
          <MetricChip value={scores.length} label="Completed Quizzes" />
          <MetricChip value={certificates.length} label="Certificates" />
        </div>
      </div>

      {/* My courses */}
      <SectionCard icon={PlayCircle} title="My Courses" count={purchases.length}>
        {purchases.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            message="No courses yet."
            ctaLabel="Browse Courses"
            ctaHref="/#browse"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {purchases.map((p) => (
              <Link
                key={p.id}
                href={`/courses/${p.course.slug}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-blue-500/30 hover:bg-white/10"
              >
                <span className="truncate text-sm font-medium text-zinc-100">{p.course.title}</span>
                <span className="shrink-0 text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Continue →
                </span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Bookmarks */}
      <SectionCard icon={BookmarkCheck} title="Bookmarks" count={bookmarks.length}>
        {bookmarks.length === 0 ? (
          <EmptyState
            icon={BookmarkCheck}
            message="No bookmarks yet."
            ctaLabel="Explore Notes"
            ctaHref="/notes"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bookmarks.map((b) => {
              const slug = b.content.courseContent[0]?.course.slug;
              const className =
                "truncate rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-100 transition-colors hover:border-blue-500/30 hover:bg-white/10";
              return slug ? (
                <Link key={b.id} href={`/courses/${slug}/${b.content.id}`} className={className}>
                  {b.content.title}
                </Link>
              ) : (
                <span key={b.id} className={className}>
                  {b.content.title}
                </span>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Quiz history */}
      <SectionCard icon={ClipboardCheck} title="Quiz History" count={scores.length}>
        {scores.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            message="No quizzes taken yet."
            ctaLabel="Browse Notes"
            ctaHref="/notes"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {scores.map((s) => {
              const trackId = s.problem.trackProblems[0]?.trackId;
              const row = (
                <>
                  <span className="truncate text-sm font-medium text-zinc-100">
                    {s.problem.title}
                  </span>
                  <span className="shrink-0 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-xs tabular-nums text-blue-400">
                    {s.score}
                  </span>
                </>
              );
              const className =
                "flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-blue-500/30 hover:bg-white/10";
              return trackId ? (
                <Link key={s.id} href={`/tracks/${trackId}/${s.problemId}`} className={className}>
                  {row}
                </Link>
              ) : (
                <div key={s.id} className={className}>
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Certificates — only rendered once one has been issued */}
      <MyCertificates studentName={session.user.name ?? "Student"} certificates={certificates} />
    </div>
  );
}
