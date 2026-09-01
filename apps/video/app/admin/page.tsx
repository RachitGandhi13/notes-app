import { requireAdmin } from "@repo/auth";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { getPendingComments } from "@/lib/community";
import { getAllCoursesForAdmin, getLinkableTracks } from "@/lib/actions";
import { ModerationPanel } from "./ModerationPanel";
import { CourseManager } from "./CourseManager";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth");
  }

  const [pending, courses, tracks] = await Promise.all([
    getPendingComments(),
    getAllCoursesForAdmin(),
    getLinkableTracks(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">
            Manage courses, moderate comments, export student records.
          </p>
        </div>
        <a
          href="/api/admin/export-students"
          className="hover:bg-accent flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Students (Excel)
        </a>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="comments">
            Comments {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-4">
          <CourseManager courses={courses as any} tracks={tracks} />
        </TabsContent>

        <TabsContent value="comments" className="pt-4">
          <ModerationPanel initialComments={pending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
