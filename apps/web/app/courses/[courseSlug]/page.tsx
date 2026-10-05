import { getSession } from "@repo/auth";
import { BadgeCheck, CheckCircle2, PlayCircle, Users, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getUserPurchases } from "@/lib/actions";
import { PurchaseButton } from "@/components/PurchaseButton";
import { CurriculumAccordion } from "@/components/CurriculumAccordion";
import { needsUnoptimized } from "@/lib/images";

interface Props {
  params: { courseSlug: string };
  searchParams: { payment?: string };
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const course = await getCourse(params.courseSlug);
  if (!course) notFound();

  const session = await getSession();

  let purchased = false;
  if (session?.user) {
    const purchases = await getUserPurchases();
    purchased = purchases.some((p) => p.courseId === course.id);
  }

  const firstContent = course.content.find(
    (c) => c.content.type === "VIDEO" || c.content.type === "NOTION"
  );

  const allContent = course.content.flatMap((cc) =>
    cc.content.type === "FOLDER"
      ? cc.content.children.map((child) => ({
          ...child,
          folderTitle: cc.content.title as string | null,
        }))
      : [{ ...cc.content, folderTitle: null as string | null }]
  );

  const enrolledCount = course._count.purchases;

  // Group top-level content into chapters for the curriculum accordion —
  // FOLDER rows become a chapter of their children; any standalone
  // VIDEO/NOTION rows not inside a folder are bucketed into one trailing group.
  const chapters = course.content
    .filter((cc) => cc.content.type === "FOLDER")
    .map((cc) => ({
      id: cc.content.id,
      title: cc.content.title,
      thumbnail: cc.content.thumbnail as string | null,
      lessons: cc.content.children.map((child) => ({
        id: child.id,
        type: child.type,
        title: child.title,
        description: child.description,
        thumbnail: child.thumbnail,
      })),
    }));

  const standaloneLessons = course.content
    .filter((cc) => cc.content.type !== "FOLDER")
    .map((cc) => ({
      id: cc.content.id,
      type: cc.content.type,
      title: cc.content.title,
      description: cc.content.description,
      thumbnail: cc.content.thumbnail,
    }));

  if (standaloneLessons.length > 0) {
    chapters.push({
      id: "standalone",
      title: "More Lessons",
      thumbnail: null,
      lessons: standaloneLessons,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Payment status banner */}
      {searchParams.payment === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Payment successful! Your course access has been activated.
          </p>
        </div>
      )}
      {searchParams.payment === "cancelled" && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 rounded-xl border px-4 py-3">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Payment was cancelled. You can try again below.</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          <div className="bg-card overflow-hidden rounded-2xl border">
            {course.imageUrl && (
              <div className="bg-muted relative aspect-video w-full overflow-hidden">
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  unoptimized={needsUnoptimized(course.imageUrl)}
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                {course.description}
              </p>

              {/* Trust-signal row — real, computed data only */}
              <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <PlayCircle className="h-4 w-4" />
                  {allContent.length} {allContent.length === 1 ? "lesson" : "lessons"}
                </span>
                {enrolledCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {enrolledCount.toLocaleString()} enrolled
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4" />
                  Lifetime access
                </span>
              </div>
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
              Curriculum{" "}
              <span className="text-muted-foreground font-sans text-sm font-normal">
                ({allContent.length} lessons)
              </span>
            </h2>
            {chapters.length === 0 ? (
              <p className="text-muted-foreground text-sm">No content yet.</p>
            ) : (
              <CurriculumAccordion chapters={chapters} />
            )}
          </div>
        </div>

        {/* Purchase panel */}
        <div className="lg:col-span-1">
          <div className="bg-card sticky top-20 space-y-4 rounded-2xl border p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {course.price === 0 ? "Free" : `₹${course.price}`}
              </span>
              {course.price > 0 && (
                <span className="text-muted-foreground text-xs">one-time payment</span>
              )}
            </div>

            {purchased ? (
              <Link
                href={
                  firstContent ? `/courses/${params.courseSlug}/${firstContent.content.id}` : "#"
                }
                className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90"
              >
                <PlayCircle className="h-5 w-5" />
                Continue Learning
              </Link>
            ) : !session?.user ? (
              <div>
                <Link
                  href="/auth"
                  className="bg-primary text-primary-foreground flex w-full items-center justify-center rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                >
                  Sign in to enroll
                </Link>
              </div>
            ) : (
              <PurchaseButton
                courseId={course.id}
                price={course.price}
                courseSlug={params.courseSlug}
                prefill={{ name: session?.user?.name, email: session?.user?.email }}
              />
            )}

            <ul className="text-muted-foreground space-y-2 border-t pt-4 text-sm">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                Lifetime access, no expiry
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                {allContent.length} {allContent.length === 1 ? "lesson" : "lessons"} included
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                Progress tracking &amp; bookmarks
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
