import { requireAuth } from "@repo/auth";
import { getUserQuizScores } from "@/lib/actions";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth");
  }

  const scores = await getUserQuizScores();

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
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
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Quiz history */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quiz History</h2>
        {scores.length === 0 ? (
          <p className="text-muted-foreground">No quizzes taken yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {scores.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{s.problem.title}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
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
