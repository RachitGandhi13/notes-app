import { getSession } from "@repo/auth";
import { ArrowRight, BadgeCheck, BookOpen, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { AscendButton, AscendEyebrow, ThemedLogo } from "@repo/ui";
import { getCourses, getUserPurchases } from "@/lib/actions";
import { getActiveBundles } from "@/lib/track-actions";
import { getActiveInternshipTracks } from "@/lib/internship-actions";
import { CourseCard } from "@/components/CourseCard";
import { CourseSearchBar } from "@/components/CourseSearchBar";
// import { InstructorSection, SupportSection } from "@/components/InstructorSection";
import { SupportSection } from "@/components/InstructorSection";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";
import { ComboBanner } from "@/components/home/ComboBanner";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { FeaturedCourse } from "@/components/home/FeaturedCourse";
import { HeroArt } from "@/components/home/HeroArt";
import { HeroGlow } from "@/components/home/HeroGlow";
import { JoinBanner } from "@/components/home/JoinBanner";
import { NotesShowcase } from "@/components/home/NotesShowcase";
import { StatStrip } from "@/components/home/StatStrip";
import { TechMarquee } from "@/components/home/TechMarquee";

// Rendered per request (same reasoning as app/notes/page.tsx) — getSession() already
// forces this dynamically, but this makes it explicit so a later refactor can't
// accidentally opt the course grid back into static rendering. The course list is
// still cached in Redis (see lib/actions.ts), invalidated on every admin mutation.
export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: Props) {
  const query = searchParams.q?.trim();
  const [courses, session, bundles, internshipTracks] = await Promise.all([
    getCourses(query),
    getSession(),
    getActiveBundles(),
    getActiveInternshipTracks(),
  ]);
  const isAdmin = !!session?.user?.admin;

  // Collect purchased course IDs for the current user
  const purchasedIds = new Set<string>();
  if (session?.user) {
    const purchases = await getUserPurchases();
    purchases.forEach((p) => purchasedIds.add(p.courseId));
  }

  // The course count is a real, computed number. The other two are
  // deliberately *not* personal stats (e.g. one instructor's certification
  // count or years of experience) — the client wants the homepage to read
  // as an Academy with many trainers, not a single person's résumé.
  // Enrollment/student counts are also deliberately not shown here —
  // admin-only metric, see /admin.
  const stats: { Icon: LucideIcon; value?: string; text: string }[] = [
    courses.length > 0
      ? {
          Icon: BookOpen,
          value: String(courses.length),
          text: courses.length === 1 ? "Course" : "Courses",
        }
      : null,
    { Icon: BadgeCheck, text: "Get certified on AWS with cloud experts" },
    { Icon: Users, text: "Get trained with real-time industry experts" },
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b">
        <HeroGlow />
        <AnimatedBackdrop />
        <div className="pt-21 lg:gap-13 lg:pt-34 mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 sm:px-8 sm:pb-16 lg:grid-cols-[1.618fr_1fr] lg:pb-24">
          <div className="min-w-0 space-y-7">
            <div className="bg-card/80 animate-fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur">
              <ThemedLogo layout="mark" height={20} title="" />
              <AscendEyebrow>Programs by CloudVidya Academy</AscendEyebrow>
            </div>

            <h1 className="font-display text-display animate-fade-up [animation-delay:80ms]">
              Level up your{" "}
              <span className="animate-gradient-shift from-primary bg-gradient-to-r via-cyan-400 to-violet-500 bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none sm:whitespace-nowrap dark:[background-image:linear-gradient(45deg,#0066FF,#00F0FF)]">
                Cloud &amp; DevOps
              </span>{" "}
              skills
            </h1>

            <p className="text-body-lg text-muted-foreground animate-fade-up max-w-[65ch] [animation-delay:160ms]">
              Hands-on video courses by our Academy, with notes, practice quizzes and progress
              tracking. Learn at your own pace.
            </p>

            <div className="animate-fade-up flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <AscendButton href="/#browse" variant="primary" size="lg">
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </AscendButton>
              <AscendButton href="/notes" variant="secondary" size="lg">
                <BookOpen className="h-4 w-4" />
                Explore notes
              </AscendButton>
            </div>

            <div className="animate-fade-up max-w-xl [animation-delay:320ms]">
              <CourseSearchBar />
            </div>

            <dl className="animate-fade-up grid max-w-xl grid-cols-1 gap-3 [animation-delay:400ms] sm:grid-cols-3">
              {stats.map(({ Icon, value, text }, i) => (
                <div
                  key={i}
                  className="bg-card/80 flex h-full items-center gap-3 rounded-xl border p-4 backdrop-blur"
                >
                  <span className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    {value ? (
                      <>
                        <dd className="text-h3 tabular-nums leading-tight">{value}</dd>
                        <dt className="text-eyebrow text-muted-foreground normal-case">{text}</dt>
                      </>
                    ) : (
                      <dd className="text-sm font-semibold leading-snug">{text}</dd>
                    )}
                  </div>
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
      {!query && courses.length > 0 && (
        <StatStrip courseCount={courses.length} trackCount={internshipTracks.length} />
      )}

      {/* Courses */}
      <section id="browse" className="container scroll-mt-20 py-10 sm:py-16">
        <div className="mb-10 text-center">
          <SectionEyebrow>{query ? "Search results" : "Courses"}</SectionEyebrow>
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

        {!query && (
          <ComboBanner
            bundles={bundles.map((b) => ({
              id: b.id,
              title: b.title,
              bundlePrice: b.bundlePrice ?? 0,
              courses: b.courses.map((tc) => ({
                id: tc.course.id,
                slug: tc.course.slug,
                title: tc.course.title,
                price: tc.course.price,
              })),
            }))}
            prefill={session?.user ? { name: session.user.name, email: session.user.email } : null}
          />
        )}

        {courses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center sm:py-20">
            <span className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="text-muted-foreground">
              {query ? <>No courses match &ldquo;{query}&rdquo;.</> : <>No courses yet.</>}
            </p>
            {query && (
              <Link
                href="/"
                className="text-primary text-sm font-medium underline underline-offset-4"
              >
                Clear search
              </Link>
            )}
          </div>
        ) : courses.length === 1 ? (
          <FeaturedCourse
            slug={courses[0]!.slug}
            title={courses[0]!.title}
            description={courses[0]!.description}
            imageUrl={courses[0]!.imageUrl}
            purchased={purchasedIds.has(courses[0]!.id)}
            isAdmin={isAdmin}
          />
        ) : (
          <div
            className={`grid gap-6 sm:grid-cols-2 ${courses.length > 2 ? "lg:grid-cols-3" : ""}`}
          >
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                description={course.description}
                imageUrl={course.imageUrl}
                priority={i < 3}
                purchased={purchasedIds.has(course.id)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </section>

      {!query && <NotesShowcase />}

      {/* Instructor "About" section (photo, bio and mailto contact), hidden for now. To restore,
          delete these comment markers and put InstructorSection back in the import on line 9.
      <div className="container pb-16">
        <InstructorSection />
      </div>
      */}

      {!query && <GalleryGrid />}

      {!query && <JoinBanner signedIn={!!session?.user} />}

      <div className="container">
        <SupportSection />
      </div>
    </>
  );
}
