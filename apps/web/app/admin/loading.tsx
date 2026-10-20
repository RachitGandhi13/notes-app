// Mirrors admin/page.tsx's own wrapper (`container ... py-6 sm:py-8`) exactly —
// this used to be the old, narrower max-w-3xl layout the real page moved off
// of, so the page visibly jumped wider the moment it finished loading.
export default function AdminLoading() {
  return (
    <div className="container space-y-8 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-32 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-72 animate-pulse rounded-md" />
        </div>
        <div className="bg-muted h-10 w-48 animate-pulse rounded-lg" />
      </div>

      <div className="space-y-4">
        <div className="bg-muted h-9 w-64 animate-pulse rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-16 w-full animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
