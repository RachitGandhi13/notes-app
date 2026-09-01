"use client";

import { useRef, useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  subtitleUrl?: string | null;
  thumbnail?: string | null;
  onEnded?: () => void;
}

export function VideoPlayer({ videoUrl, title, subtitleUrl, thumbnail, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-black shadow-xl">
      {error ? (
        <div className="flex aspect-video items-center justify-center text-sm text-white/60">
          Failed to load video.
        </div>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video w-full"
          controls
          poster={thumbnail ?? undefined}
          onEnded={onEnded}
          onError={() => setError(true)}
          title={title}
          playsInline
        >
          <source src={videoUrl} />
          {subtitleUrl && (
            <track kind="subtitles" src={subtitleUrl} default label="English" />
          )}
          Your browser does not support the video element.
        </video>
      )}
    </div>
  );
}
