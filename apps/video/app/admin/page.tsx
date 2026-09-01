import { requireAdmin } from "@repo/auth";
import { redirect } from "next/navigation";
import { getPendingComments } from "@/lib/community";
import { ModerationPanel } from "./ModerationPanel";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth");
  }

  const pending = await getPendingComments();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Admin — Comment Moderation</h1>
        <p className="text-muted-foreground">
          {pending.length} comment{pending.length !== 1 ? "s" : ""} awaiting review.
        </p>
      </div>
      <ModerationPanel initialComments={pending} />
    </div>
  );
}
