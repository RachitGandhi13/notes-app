import { requireAdmin } from "@repo/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db/client";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth");
  }

  const tracks = await prisma.track.findMany({
    select: { id: true, title: true, image: true, inSearch: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Add a new track by pasting a Notion parent page ID.
        </p>
      </div>
      <AdminPanel tracks={tracks} />
    </div>
  );
}
