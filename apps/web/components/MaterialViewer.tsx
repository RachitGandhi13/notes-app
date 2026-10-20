"use client";

import { useState } from "react";
import { FileText, ImageOff, Lock } from "lucide-react";

interface MaterialViewerProps {
  contentId: string;
  kind: "pdf" | "image";
  label: string;
  locked?: boolean;
}

// Renders the attached material directly on the page — no button-behind-a-modal step —
// since by the time this renders, the surrounding page has already decided whether the
// viewer is allowed to see it. For PDFs, #toolbar=0 hides the browser's own PDF viewer
// toolbar (and the download button in it); images are a plain <img>. Served through
// /api/notes/[id] with Content-Disposition: inline — never a direct Bunny Storage URL.
//
// Both iframe and img sit in a fixed-min-height container with a skeleton behind them
// until onLoad fires, so the page never jumps once the file arrives — the img case had
// no reserved space before (no width/height), so a tall note image would shift everything
// below it down the moment it finished loading.
export function MaterialViewer({ contentId, kind, label, locked }: MaterialViewerProps) {
  const [loaded, setLoaded] = useState(false);
  // Only the <img> case needs this: a failed image fires onError, never onLoad, which
  // would otherwise leave the skeleton pulsing forever with no sign anything went wrong.
  // A failed iframe still "loads" successfully (the browser renders the error response
  // as a document either way), so onLoad alone already covers that case.
  const [failed, setFailed] = useState(false);

  if (locked) {
    return (
      <div className="bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-lg border px-6 py-12 text-center">
        <Lock className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">{label} is locked.</p>
      </div>
    );
  }

  const src = `/api/notes/${contentId}`;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        <FileText className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="relative min-h-[420px] w-full overflow-hidden rounded-lg border">
        {!loaded && !failed && <div className="bg-muted absolute inset-0 animate-pulse" />}
        {failed ? (
          <div className="bg-muted/30 absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <ImageOff className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Couldn&apos;t load {label.toLowerCase()}.
            </p>
          </div>
        ) : kind === "pdf" ? (
          <iframe
            src={`${src}#toolbar=0`}
            title={label}
            onLoad={() => setLoaded(true)}
            className="relative h-[70vh] min-h-[420px] w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`relative w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    </div>
  );
}
