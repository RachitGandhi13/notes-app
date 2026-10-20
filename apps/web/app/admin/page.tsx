import { requireAdmin } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { getPendingComments } from "@/lib/community";
import { getAllCoursesForAdmin } from "@/lib/actions";
import { getInternshipApplications } from "@/lib/internship-actions";
import { ModerationPanel } from "./ModerationPanel";
import { CourseManager } from "./CourseManager";
import { AdminPanel } from "./AdminPanel";
import { EnrolledStudentsTable } from "./EnrolledStudentsTable";
import { StudentAccessPanel } from "@/components/admin/StudentAccessPanel";
import { InternshipApplicationsList } from "@/components/admin/InternshipApplicationsList";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth");
  }

  const [pending, courses, notesTracks, applications] = await Promise.all([
    getPendingComments(),
    getAllCoursesForAdmin(),
    prisma.track.findMany({
      // Excludes tracks auto-mirrored from a course — those are managed from
      // the Courses list above, not this standalone-track list.
      where: { courseId: null },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        inSearch: true,
        hidden: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    getInternshipApplications(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Manage courses and notes, moderate comments, review enrolled students.
        </p>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="internships">
            Internships {applications.length > 0 && `(${applications.length})`}
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comments {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-4">
          <CourseManager courses={courses as any} />
        </TabsContent>

        <TabsContent value="students" className="pt-4">
          <EnrolledStudentsTable courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            Create a track, then upload PPT lessons and write MCQ quizzes for it directly.
          </p>
          <AdminPanel
            tracks={notesTracks}
            courses={courses.map((c) => ({
              id: c.id,
              title: c.title,
              linkedTrackId: c.linkedTrack?.id ?? null,
            }))}
          />
        </TabsContent>

        <TabsContent value="internships" className="space-y-6 pt-4">
          <StudentAccessPanel
            courses={courses.map((c) => ({ id: c.id, title: c.title, slug: c.slug }))}
          />
          <div className="space-y-3">
            <h2 className="font-semibold">Applications</h2>
            <InternshipApplicationsList applications={applications} />
          </div>
        </TabsContent>

        <TabsContent value="comments" className="pt-4">
          <ModerationPanel initialComments={pending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
