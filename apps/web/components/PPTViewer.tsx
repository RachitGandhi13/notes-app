import { Presentation } from "lucide-react";

interface PPTViewerProps {
  pptUrl: string;
  title: string;
}

// Browsers can't render a .ppt/.pptx file inline, so this opens the uploaded
// file in a new tab rather than embedding it — no forced `download`
// attribute, but not real download-prevention either (opening the file *is*
// getting the file). See DEVELOPMENT.md for the trade-off this reflects.
export function PPTViewer({ pptUrl, title }: PPTViewerProps) {
  return (
    <div className="bg-muted/30 flex flex-col items-center justify-center gap-4 rounded-lg border px-6 py-16 text-center">
      <Presentation className="text-muted-foreground h-10 w-10" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">Presentation slides</p>
      </div>
      <a
        href={pptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
      >
        View presentation
      </a>
    </div>
  );
}
