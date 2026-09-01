import { getSession } from "@repo/auth";
import { getCourses, getUserPurchases } from "@/lib/actions";
import { CourseCard } from "@/components/CourseCard";

export const revalidate = 3600;

export default async function HomePage() {
  const [courses, session] = await Promise.all([getCourses(), getSession()]);

  // Collect purchased course IDs for the current user
  const purchasedIds = new Set<string>();
  if (session?.user) {
    const purchases = await getUserPurchases();
    purchases.forEach((p) => purchasedIds.add(p.courseId));
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-2xl border bg-card p-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Level up your skills</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          High-quality video courses. Learn at your own pace, track your progress,
          and earn certificates.
        </p>
      </div>

      {/* Course grid */}
      {courses.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No courses yet.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              slug={course.slug}
              title={course.title}
              description={course.description}
              imageUrl={course.imageUrl}
              price={course.price}
              purchased={purchasedIds.has(course.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
