import { requireAdmin } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { redirect } from "next/navigation";
import { ClipboardList, MessageSquare, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { getPendingComments } from "@/lib/community";
import { getAllCoursesForAdmin } from "@/lib/actions";
import { getInternshipApplications, getInternshipTracks } from "@/lib/internship-actions";
import { getAllBundlesForAdmin } from "@/lib/track-actions";
import { ModerationPanel } from "./ModerationPanel";
import { CourseManager } from "./CourseManager";
import { AdminPanel } from "./AdminPanel";
import { EnrolledStudentsTable } from "./EnrolledStudentsTable";
import { StudentAccessPanel } from "@/components/admin/StudentAccessPanel";
import { InternshipApplicationsList } from "@/components/admin/InternshipApplicationsList";
import { InternshipTrackManager } from "@/components/admin/InternshipTrackManager";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";
import { ComboBundleManager } from "@/components/admin/ComboBundleManager";

// Rendered per request (same reasoning as app/notes/page.tsx) — requireAdmin() already
// forces this dynamically, but this makes it explicit. Admin needs to see every
// mutation's effect immediately, with no cached page in between.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth");
  }

  const [pending, courses, notesTracks, applications, internshipTracks, bundles, enrolledStudents] =
    await Promise.all([
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
      getInternshipTracks(),
      getAllBundlesForAdmin(),
      // Distinct students with at least one course (bought or manually granted) —
      // the same definition EnrolledStudentsTable uses per-course, just unscoped.
      prisma.userPurchases.findMany({ select: { userId: true }, distinct: ["userId"] }),
    ]);

  // "Pending" mirrors InternshipApplicationsList's own badge rule (no startDate yet).
  const pendingApplicationsCount = applications.filter((app) => !app.startDate).length;

  return (
    // `container` matches every other page's widening (caps at 1400px, same
    // breakpoint padding) — the old flat max-w-3xl kept this dense,
    // table-heavy workspace squeezed into a ~768px column even on a 4K
    // monitor, which is the opposite of what a data-dense admin view wants.
    <div className="container space-y-8 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card border-border/60 hover:border-primary/40 flex items-center gap-4 rounded-xl border p-5 transition-all">
          <span className="bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none">{enrolledStudents.length}</p>
            <p className="text-muted-foreground mt-1 text-xs">Enrolled Students</p>
          </div>
        </div>
        <div className="bg-card border-border/60 hover:border-primary/40 flex items-center gap-4 rounded-xl border p-5 transition-all">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none">{pendingApplicationsCount}</p>
            <p className="text-muted-foreground mt-1 text-xs">Pending Internship Applications</p>
          </div>
        </div>
        <div className="bg-card border-border/60 hover:border-primary/40 flex items-center gap-4 rounded-xl border p-5 transition-all">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none">{pending.length}</p>
            <p className="text-muted-foreground mt-1 text-xs">Pending Moderation Comments</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="h-auto flex-wrap">
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

        <TabsContent value="courses" className="space-y-6 pt-6">
          <CourseManager courses={courses as any} />
          <ComboBundleManager
            allCourses={courses.map((c) => ({
              id: c.id,
              title: c.title,
              price: c.price,
              slug: c.slug,
            }))}
            bundles={bundles.map((b) => ({
              id: b.id,
              title: b.title,
              bundlePrice: b.bundlePrice,
              hidden: b.hidden,
              courses: b.courses.map((tc) => ({
                course: { id: tc.course.id, title: tc.course.title },
              })),
            }))}
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4 pt-6">
          <GrantAccessModal
            courses={courses.map((c) => ({ id: c.id, title: c.title }))}
            bundles={bundles.map((b) => ({
              id: b.id,
              title: b.title,
              bundlePrice: b.bundlePrice ?? 0,
              courses: b.courses.map((tc) => ({ id: tc.course.id, title: tc.course.title })),
            }))}
            internshipTracks={internshipTracks.map((t) => ({
              id: t.id,
              title: t.title,
              courses: t.courses.map((tc) => ({ id: tc.course.id, title: tc.course.title })),
            }))}
          />
          <EnrolledStudentsTable
            courses={courses.map((c) => ({ id: c.id, title: c.title }))}
            bundles={bundles.map((b) => ({ id: b.id, title: b.title }))}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
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

        <TabsContent value="internships" className="pt-6">
          <Tabs defaultValue="trackManager">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="trackManager">Track Manager</TabsTrigger>
              <TabsTrigger value="grantAccess">Grant Access</TabsTrigger>
              <TabsTrigger value="applications">
                Applications {applications.length > 0 && `(${applications.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trackManager" className="pt-6">
              <InternshipTrackManager
                tracks={internshipTracks}
                allCourses={courses.map((c) => ({
                  id: c.id,
                  title: c.title,
                  price: c.price,
                  slug: c.slug,
                }))}
              />
            </TabsContent>

            <TabsContent value="grantAccess" className="pt-6">
              <StudentAccessPanel
                courses={courses.map((c) => ({ id: c.id, title: c.title, slug: c.slug }))}
                internshipTracks={internshipTracks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  hidden: t.hidden,
                  courses: t.courses.map((tc) => ({
                    course: { id: tc.course.id, title: tc.course.title },
                  })),
                }))}
              />
            </TabsContent>

            <TabsContent value="applications" className="pt-6">
              <InternshipApplicationsList applications={applications} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="comments" className="pt-6">
          <ModerationPanel initialComments={pending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
