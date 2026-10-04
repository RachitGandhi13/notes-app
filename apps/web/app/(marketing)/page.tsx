import { getSession } from "@repo/auth";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCourses, getUserPurchases } from "@/lib/actions";
import { instructor } from "@/lib/instructor";
import { CourseCard } from "@/components/CourseCard";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import { InstructorSection, SupportSection } from "@/components/InstructorSection";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { FeaturedCourse } from "@/components/home/FeaturedCourse";
import { HeroArt } from "@/components/home/HeroArt";
import { JoinBanner } from "@/components/home/JoinBanner";
import { NotesShowcase } from "@/components/home/NotesShowcase";
import { TechMarquee } from "@/components/home/TechMarquee";

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

  // Only real numbers: what's in the catalogue, plus facts from the
  // instructor profile the client supplied.
  const stats = [
    courses.length > 0 && {
      value: String(courses.length),
      label: courses.length === 1 ? "Course" : "Courses",
    },
    totalStudents > 0 && {
      value: totalStudents.toLocaleString(),
      label: totalStudents === 1 ? "Student enrolled" : "Students enrolled",
    },
    { value: String(instructor.certifications.length), label: "AWS certifications" },
    { value: instructor.experienceYears, label: "Years of experience" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b">
        <AnimatedBackdrop />
        <div className="container grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="min-w-0 space-y-7">
            <div className="bg-card/80 animate-fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-sm backdrop-blur">
              <Image
                src="/cloudvidya.png"
                alt=""
                width={20}
                height={20}
                className="rounded-full object-cover"
              />
              <span className="text-muted-foreground">Programs by CloudVidya Academy</span>
            </div>

            <h1 className="animate-fade-up text-5xl font-extrabold leading-[1.08] tracking-tight [animation-delay:80ms] sm:text-6xl">
              Level up your{" "}
              <span className="animate-gradient-shift from-primary bg-gradient-to-r via-cyan-400 to-violet-500 bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none sm:whitespace-nowrap">
                Cloud &amp; DevOps
              </span>{" "}
              skills
            </h1>

            <p className="text-muted-foreground animate-fade-up max-w-xl text-lg leading-relaxed [animation-delay:160ms]">
              Hands-on video courses by {instructor.name} — with notes, practice quizzes and
              progress tracking. Learn at your own pace.
            </p>

            <div className="animate-fade-up flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <Link
                href="/#browse"
                className="bg-primary text-primary-foreground shadow-primary/30 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:gap-3 hover:shadow-xl"
              >
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/notes"
                className="bg-card/80 hover:bg-accent inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold backdrop-blur transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Explore notes
              </Link>
            </div>

            <div className="animate-fade-up max-w-xl [animation-delay:320ms]">
              <CourseSearchBar />
            </div>

            <dl className="animate-fade-up grid max-w-xl grid-cols-2 gap-3 [animation-delay:400ms] sm:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-card/80 flex flex-col rounded-xl border px-3 py-3 backdrop-blur"
                >
                  <dt className="text-muted-foreground order-2 text-xs">{label}</dt>
                  <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hidden lg:block">
            <HeroArt />
          </div>
        </div>
      </section>

      {!query && <TechMarquee />}
      {!query && <FeatureGrid />}

      {/* Courses */}
      <section id="browse" className="container scroll-mt-20 py-16">
        <div className="mb-10 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-wide">
            {query ? "Search results" : "Courses"}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {query ? (
              <>
                Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              <>
                Explore our <span className="text-primary">courses</span>
              </>
            )}
          </h2>
        </div>

        {courses.length === 0 ? (
          <div className="text-muted-foreground py-20 text-center">
            {query ? <>No courses match &ldquo;{query}&rdquo;.</> : <>No courses yet.</>}
          </div>
        ) : courses.length === 1 ? (
          <FeaturedCourse
            slug={courses[0]!.slug}
            title={courses[0]!.title}
            description={courses[0]!.description}
            imageUrl={courses[0]!.imageUrl}
            price={courses[0]!.price}
            purchased={purchasedIds.has(courses[0]!.id)}
            enrolledCount={courses[0]!._count.purchases}
          />
        ) : (
          <div
            className={`grid gap-6 sm:grid-cols-2 ${courses.length > 2 ? "lg:grid-cols-3" : ""}`}
          >
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
      </section>

      {!query && <NotesShowcase />}

      <div className="container pb-16">
        <InstructorSection />
      </div>

      {!query && <JoinBanner signedIn={!!session?.user} />}

      <div className="container">
        <SupportSection />
      </div>
    </>
  );
}
