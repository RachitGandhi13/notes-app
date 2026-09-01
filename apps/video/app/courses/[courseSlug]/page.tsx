import { getSession } from "@repo/auth";
import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getUserPurchases } from "@/lib/actions";
import { PurchaseButton } from "@/components/PurchaseButton";

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
      ? cc.content.children.map((child) => ({ ...child, folderTitle: cc.content.title }))
      : [{ ...cc.content, folderTitle: null }]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Payment was cancelled. You can try again below.</p>
        </div>
      )}

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {course.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <Image src={course.imageUrl} alt={course.title} fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-2 text-muted-foreground">{course.description}</p>

          <div className="mt-6">
            {purchased ? (
              <Link
                href={
                  firstContent
                    ? `/courses/${params.courseSlug}/${firstContent.id}`
                    : "#"
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <PlayCircle className="h-5 w-5" />
                Continue Learning
              </Link>
            ) : (
              <div className="max-w-xs">
                {!session?.user && (
                  <p className="mb-3 text-sm text-muted-foreground">
                    <Link href="/auth" className="underline">Sign in</Link> to enroll.
                  </p>
                )}
                {session?.user && (
                  <PurchaseButton
                    courseId={course.id}
                    price={course.price}
                    courseSlug={params.courseSlug}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Curriculum <span className="text-sm font-normal text-muted-foreground">({allContent.length} lessons)</span>
        </h2>
        <ul className="divide-y rounded-xl border">
          {allContent.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 shrink-0 text-sm text-muted-foreground">{i + 1}</span>
              <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{item.title}</span>
              {item.folderTitle && (
                <span className="text-xs text-muted-foreground">{item.folderTitle}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
