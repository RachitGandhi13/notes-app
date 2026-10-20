import { FileText, Lock } from "lucide-react";

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
export function MaterialViewer({ contentId, kind, label, locked }: MaterialViewerProps) {
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
      {kind === "pdf" ? (
        <iframe
          src={`${src}#toolbar=0`}
          title={label}
          className="h-[70vh] min-h-[420px] w-full rounded-lg border"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full rounded-lg border" />
      )}
    </div>
  );
}
