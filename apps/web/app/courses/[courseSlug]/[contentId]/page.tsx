import { getSession } from "@repo/auth";
import { redirect, notFound } from "next/navigation";
import { getCourse, getContent, getCourseProgress, getBookmarks } from "@/lib/actions";
import { userCanAccessCourse } from "@/lib/access";
import { getComments, getQuestions } from "@/lib/community";
import { ContentSidebar } from "@/components/ContentSidebar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { BunnyVideoPlayer } from "@/components/BunnyVideoPlayer";
import { MaterialViewer } from "@/components/MaterialViewer";
import { ProgressButton } from "@/components/ProgressButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { QASection } from "@/components/QASection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";

// Only the kind is needed client-side to pick <iframe> vs <img> — not the raw Bunny path.
function materialKind(path: string | null | undefined): "pdf" | "image" | null {
  if (!path) return null;
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return "image";
  return null;
}

interface Props {
  params: { courseSlug: string; contentId: string };
}

function buildItems(courseContent: any[]): any[] {
  return courseContent.map((cc) => {
    const c = cc.content ?? cc;
    return {
      id: c.id,
      type: c.type,
      title: c.title,
      children: c.children ? buildItems(c.children.map((child: any) => ({ content: child }))) : [],
    };
  });
}

export default async function ContentViewerPage({ params }: Props) {
  // Independent of each other — course data is public, so it doesn't need
  // the session — so they run concurrently instead of two round trips.
  const [session, course] = await Promise.all([getSession(), getCourse(params.courseSlug)]);
  if (!session?.user) redirect("/auth");
  if (!course) notFound();

  // Admins always pass — they need to be able to view lessons without buying the course.
  if (!(await userCanAccessCourse(course.id))) redirect("/invalidsession");

  const content = await getContent(params.contentId);
  if (!content) notFound();

  // Fetch everything in parallel
  const [progressList, bookmarkList, comments, questions] = await Promise.all([
    getCourseProgress(course.id),
    getBookmarks(),
    getComments(params.contentId),
    getQuestions(params.contentId),
  ]);

  const watchedIds = new Set(progressList.filter((p) => p.markAsRead).map((p) => p.contentId));
  const isWatched = watchedIds.has(params.contentId);
  const isBookmarked = bookmarkList.some((b) => b.contentId === params.contentId);
  const sidebarItems = buildItems(course.content);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <ContentSidebar
        courseSlug={params.courseSlug}
        courseTitle={course.title}
        items={sidebarItems}
        activeContentId={params.contentId}
        watchedIds={watchedIds}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          <h1 className="text-2xl font-bold">{content.title}</h1>

          {/* Video — Bunny Stream takes priority when set; otherwise the existing
              Vercel-Blob-hosted <video> plays. A lesson only ever has one or the other
              populated in practice, but if somehow both are set, Bunny wins. */}
          {content.type === "VIDEO" &&
            content.videoMetadata &&
            (content.videoMetadata.bunnyVideoId ? (
              <BunnyVideoPlayer
                videoId={content.videoMetadata.bunnyVideoId}
                title={content.title}
              />
            ) : (
              content.videoMetadata.videoUrl && (
                <VideoPlayer
                  videoUrl={content.videoMetadata.videoUrl}
                  title={content.title}
                  subtitleUrl={content.videoMetadata.subtitleUrl}
                  thumbnail={content.videoMetadata.thumbnail1Url}
                />
              )
            ))}

          {/* Notes, if the admin attached one — view-only, served through the authenticated
              proxy inside a modal, never a direct Bunny Storage URL or a new-tab download.
              Only ever reached after the hasAccess check above, so this never renders for
              an unentitled user. */}
          {content.type === "VIDEO" &&
            content.videoMetadata?.bunnyPdfPath &&
            materialKind(content.videoMetadata.bunnyPdfPath) && (
              <MaterialViewer
                contentId={content.id}
                kind={materialKind(content.videoMetadata.bunnyPdfPath)!}
                label="View notes"
              />
            )}

          {/* Notion placeholder */}
          {content.type === "NOTION" && content.notionMetadata && (
            <div className="bg-muted/40 text-muted-foreground rounded-xl border p-8 text-center">
              Notion content: <code className="font-mono">{content.notionMetadata.notionId}</code>
            </div>
          )}

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <ProgressButton contentId={params.contentId} initialWatched={isWatched} />
            <BookmarkButton contentId={params.contentId} initialBookmarked={isBookmarked} />
          </div>

          {/* Community tabs */}
          <Tabs defaultValue="qa" className="pt-2">
            <TabsList>
              <TabsTrigger value="qa">Q&amp;A ({questions.length})</TabsTrigger>
              <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="qa" className="pt-4">
              <QASection
                contentId={params.contentId}
                initialQuestions={questions}
                currentUserId={session.user.id}
                isAdmin={session.user.admin}
              />
            </TabsContent>

            <TabsContent value="comments" className="pt-4">
              <CommentSection
                contentId={params.contentId}
                initialComments={comments}
                currentUserId={session.user.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
