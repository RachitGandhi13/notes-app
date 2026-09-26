import { getSession } from "@repo/auth";
import Image from "next/image";
import { getCourses, getUserPurchases } from "@/lib/actions";
import { CourseCard } from "@/components/CourseCard";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import { InstructorSection, SupportSection } from "@/components/InstructorSection";

interface Props {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: Props) {
  const query = searchParams.q?.trim();
  const [courses, session] = await Promise.all([getCourses(query), getSession()]);

  // Collect purchased course IDs for the current user
  const purchasedIds = new Set<string>();
  if (session?.user) {
    const purchases = await getUserPurchases();
    purchases.forEach((p) => purchasedIds.add(p.courseId));
  }

  const totalStudents = courses.reduce((sum, c) => sum + c._count.purchases, 0);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="mx-auto max-w-2xl space-y-8 border-b py-16 text-center">
        <div className="bg-card mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
          <Image
            src="/cloudvidya.png"
            alt=""
            width={20}
            height={20}
            className="rounded-full object-cover"
          />
          <span className="text-muted-foreground">Programs by CloudVidya Academy</span>
        </div>

        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Level up your <span className="text-primary">skills</span>
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-lg leading-relaxed">
          High-quality video courses. Learn at your own pace, track your progress, and earn
          certificates.
        </p>

        <div className="mx-auto max-w-lg">
          <CourseSearchBar />
        </div>

        {(courses.length > 0 || totalStudents > 0) && (
          <div className="text-muted-foreground flex items-center justify-center gap-6 text-sm">
            {courses.length > 0 && (
              <span>
                <strong className="text-foreground font-semibold">{courses.length}</strong>{" "}
                {courses.length === 1 ? "course" : "courses"}
              </span>
            )}
            {totalStudents > 0 && (
              <span>
                <strong className="text-foreground font-semibold">
                  {totalStudents.toLocaleString()}
                </strong>{" "}
                {totalStudents === 1 ? "student" : "students"} enrolled
              </span>
            )}
          </div>
        )}
      </div>

      {/* Course grid */}
      <div id="browse">
        {courses.length === 0 ? (
          <div className="text-muted-foreground py-20 text-center">
            {query ? <>No courses match &ldquo;{query}&rdquo;.</> : <>No courses yet.</>}
          </div>
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
                enrolledCount={course._count.purchases}
              />
            ))}
          </div>
        )}
      </div>

      <InstructorSection />
      <SupportSection />
    </div>
  );
}
