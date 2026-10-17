export default function TrackLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4rem)] md:min-h-0 md:flex-row">
      <div className="w-full shrink-0 space-y-2 border-b p-4 md:h-full md:w-72 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="bg-muted h-5 w-2/3 animate-pulse rounded-md" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted h-9 w-full animate-pulse rounded-lg" />
        ))}
      </div>

      <div className="flex-1 md:overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          <div className="bg-muted h-7 w-1/2 animate-pulse rounded-md" />
          <div className="bg-muted aspect-video w-full animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}
