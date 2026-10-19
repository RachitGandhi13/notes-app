"use client";

interface BunnyVideoPlayerProps {
  videoId: string;
  title?: string;
}

// Bunny Stream playback via its iframe embed — Bunny handles adaptive bitrate and CDN
// delivery itself, so there's no player library here, just the iframe.
export function BunnyVideoPlayer({ videoId, title }: BunnyVideoPlayerProps) {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;

  if (!videoId || !libraryId) {
    return (
      <div className="bg-muted/40 text-muted-foreground flex aspect-video w-full items-center justify-center rounded-lg text-sm">
        Video unavailable.
      </div>
    );
  }

  const src = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=false&muted=false&preload=true`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={src}
        title={title ?? "Video"}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
