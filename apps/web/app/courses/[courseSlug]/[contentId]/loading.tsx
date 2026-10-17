export default function ContentViewerLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="hidden w-72 shrink-0 space-y-2 border-r p-4 md:block">
        <div className="bg-muted h-5 w-2/3 animate-pulse rounded-md" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted h-9 w-full animate-pulse rounded-lg" />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          <div className="bg-muted h-7 w-1/2 animate-pulse rounded-md" />
          <div className="bg-muted aspect-video w-full animate-pulse rounded-xl" />
          <div className="flex gap-3 border-t pt-4">
            <div className="bg-muted h-9 w-28 animate-pulse rounded-lg" />
            <div className="bg-muted h-9 w-28 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
