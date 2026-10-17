export default function CourseDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="bg-card overflow-hidden rounded-2xl border">
            <div className="bg-muted aspect-video w-full animate-pulse" />
            <div className="space-y-3 p-6">
              <div className="bg-muted h-8 w-2/3 animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-5/6 animate-pulse rounded-md" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-muted h-7 w-48 animate-pulse rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted h-14 w-full animate-pulse rounded-xl" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card space-y-4 rounded-2xl border p-6 shadow-sm">
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
            <div className="bg-muted h-12 w-full animate-pulse rounded-lg" />
            <div className="space-y-2 border-t pt-4">
              <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-5/6 animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-2/3 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
