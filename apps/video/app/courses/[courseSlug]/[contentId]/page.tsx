import { getSession } from "@repo/auth";
import { redirect, notFound } from "next/navigation";
import {
  getCourse,
  getContent,
  getCourseProgress,
  getUserPurchases,
  getBookmarks,
} from "@/lib/actions";
import { getComments, getQuestions } from "@/lib/community";
import { ContentSidebar } from "@/components/ContentSidebar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ProgressButton } from "@/components/ProgressButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { QASection } from "@/components/QASection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";

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
  const session = await getSession();
  if (!session?.user) redirect("/auth");

  const course = await getCourse(params.courseSlug);
  if (!course) notFound();

  const purchases = await getUserPurchases();
  const hasPurchased = purchases.some((p) => p.courseId === course.id);
  if (!hasPurchased) redirect("/invalidsession");

  const content = await getContent(params.contentId);
  if (!content) notFound();

  // Fetch everything in parallel
  const [progressList, bookmarkList, comments, questions] = await Promise.all([
    getCourseProgress(course.id),
    getBookmarks(),
    getComments(params.contentId),
    getQuestions(params.contentId),
  ]);

  const watchedIds = new Set(
    progressList.filter((p) => p.markAsRead).map((p) => p.contentId)
  );
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
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
          <h1 className="text-2xl font-bold">{content.title}</h1>

          {/* Video */}
          {content.type === "VIDEO" && content.videoMetadata && (
            <VideoPlayer
              videoUrl={content.videoMetadata.videoUrl}
              title={content.title}
              subtitleUrl={content.videoMetadata.subtitleUrl}
              thumbnail={content.videoMetadata.thumbnail1Url}
            />
          )}

          {/* Notion placeholder */}
          {content.type === "NOTION" && content.notionMetadata && (
            <div className="rounded-xl border bg-muted/40 p-8 text-center text-muted-foreground">
              Notion content:{" "}
              <code className="font-mono">{content.notionMetadata.notionId}</code>
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
              <TabsTrigger value="qa">
                Q&amp;A ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
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
