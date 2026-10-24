import { getSession } from "@repo/auth";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getCourses, getUserPurchases } from "@/lib/actions";
import { getActiveBundles } from "@/lib/track-actions";
import { getActiveInternshipTracks } from "@/lib/internship-actions";
import { Aurora, Grain, HeroGrid } from "@repo/ui";
import { CourseCard } from "@/components/CourseCard";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Reveal } from "@/components/Reveal";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { ComboBanner } from "@/components/home/ComboBanner";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { FeaturedCourse } from "@/components/home/FeaturedCourse";
import { HeroContent } from "@/components/home/HeroContent";
import { InternshipTeaser } from "@/components/home/InternshipTeaser";
import { JoinBanner } from "@/components/home/JoinBanner";
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

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b">
        <Aurora variant="hero" />
        <Grain opacity={0.9} lightOpacity={0.05} />
        <HeroGrid />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
          <HeroContent courseCount={courses.length} />
        </div>
      </section>

      {!query && (
        <Reveal>
          <TechMarquee />
        </Reveal>
      )}
      {!query && <FeatureGrid />}

      {/* Courses */}
      <Reveal>
        <section id="browse" className="container scroll-mt-20 py-10 sm:py-16">
          <div className="mb-10 text-center">
            <SectionEyebrow>{query ? "Search results" : "Courses"}</SectionEyebrow>
            <h2 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">
              {query ? (
                <>
                  Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                <>
                  Explore our <span className="serif-accent">courses</span>
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
              prefill={
                session?.user ? { name: session.user.name, email: session.user.email } : null
              }
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
                  className="text-primary-ink text-sm font-medium underline underline-offset-4"
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
                  price={course.price}
                  purchased={purchasedIds.has(course.id)}
                  isAdmin={isAdmin}
                  accentIndex={i}
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {!query && (
        <Reveal>
          <InternshipTeaser tracks={internshipTracks} />
        </Reveal>
      )}

      {!query && (
        <Reveal>
          <GalleryGrid />
        </Reveal>
      )}

      {!query && (
        <Reveal>
          <JoinBanner signedIn={!!session?.user} />
        </Reveal>
      )}
    </>
  );
}
