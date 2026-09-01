import { requireAuth } from "@repo/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlayCircle, BookmarkCheck } from "lucide-react";
import { getUserPurchases, getBookmarks } from "@/lib/actions";

export default async function ProfilePage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth");
  }

  const [purchases, bookmarks] = await Promise.all([
    getUserPurchases(),
    getBookmarks(),
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
            <Link href="/" className="underline hover:text-foreground">
              Browse courses
            </Link>
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{p.course.title}</span>
                <Link
                  href={`/courses/${p.course.slug}`}
                  className="text-xs text-primary underline"
                >
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
    </div>
  );
}
