import { requireAuth } from "@repo/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlayCircle, BookmarkCheck, ClipboardCheck } from "lucide-react";
import { getUserPurchases, getBookmarks } from "@/lib/actions";
import { getUserQuizScores } from "@/lib/track-actions";

export default async function ProfilePage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth");
  }

  const [purchases, bookmarks, scores] = await Promise.all([
    getUserPurchases(),
    getBookmarks(),
    getUserQuizScores(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-10 py-8">
      {/* User info */}
      <div className="flex items-center gap-4">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{session.user.name ?? "User"}</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
          {session.user.admin && (
            <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* My courses */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <PlayCircle className="h-5 w-5" /> My Courses
        </h2>
        {purchases.length === 0 ? (
          <p className="text-muted-foreground">
            No courses yet.{" "}
            <Link href="/#browse" className="hover:text-foreground underline">
              Browse courses
            </Link>
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{p.course.title}</span>
                <Link href={`/courses/${p.course.slug}`} className="text-primary text-xs underline">
                  Continue →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bookmarks */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookmarkCheck className="h-5 w-5" /> Bookmarks
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground">No bookmarks yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {bookmarks.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm">
                {b.content.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quiz history */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ClipboardCheck className="h-5 w-5" /> Quiz History
        </h2>
        {scores.length === 0 ? (
          <p className="text-muted-foreground">
            No quizzes taken yet.{" "}
            <Link href="/notes" className="hover:text-foreground underline">
              Browse notes
            </Link>
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {scores.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{s.problem.title}</span>
                <span className="text-muted-foreground text-sm tabular-nums">
                  Score: <strong>{s.score}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
