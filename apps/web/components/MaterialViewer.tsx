"use client";

import { useState } from "react";
import { FileText, Lock } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";

interface MaterialViewerProps {
  contentId: string;
  kind: "pdf" | "image";
  label: string;
  locked?: boolean;
}

// View-only by design: opens inside a modal on this page rather than navigating to the
// raw file, and for PDFs appends #toolbar=0 — the standard way to hide the browser's
// built-in PDF viewer toolbar (and the download button in it) when rendering inline.
export function MaterialViewer({ contentId, kind, label, locked }: MaterialViewerProps) {
  const [open, setOpen] = useState(false);

  if (locked) {
    return (
      <span
        className="text-muted-foreground flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
        title="Purchase this course to unlock"
      >
        <Lock className="h-3.5 w-3.5" />
        Locked
      </span>
    );
  }

  const src = `/api/notes/${contentId}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-card hover:bg-accent flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        <FileText className="h-3.5 w-3.5" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto p-0">
          {kind === "pdf" ? (
            <iframe src={`${src}#toolbar=0`} title={label} className="h-[80vh] w-full border-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={label} className="h-auto w-full" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
