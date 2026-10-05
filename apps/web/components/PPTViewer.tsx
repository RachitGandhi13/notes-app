import { ExternalLink, Presentation } from "lucide-react";

interface PPTViewerProps {
  pptUrl: string;
  title: string;
}

// Shows the uploaded slides on the page itself.
//
//  • PDF          → the browser's own viewer, inline. Works everywhere.
//  • PPT / PPTX   → Microsoft's free Office viewer in an iframe. It fetches the
//                   file from its own servers, so it only works when the file's
//                   URL is public https (i.e. once the site is deployed with
//                   cloud storage) — not for a file saved on a dev machine.
//                   Until then, and if the viewer ever fails to load, the
//                   "Open" link below still gets the student the file.
//
// Neither route prevents a student from saving the file — opening a file is
// getting it — so this is a convenience, not copy protection.
export function PPTViewer({ pptUrl, title }: PPTViewerProps) {
  const isPdf = pptUrl.split("?")[0]?.toLowerCase().endsWith(".pdf") ?? false;
  const isPublicHttps = pptUrl.startsWith("https://");

  const embedUrl = isPdf
    ? pptUrl
    : isPublicHttps
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptUrl)}`
      : null;

  return (
    <div className="space-y-3">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={`${title}: slides`}
          className="bg-muted/30 h-[70vh] min-h-[420px] w-full rounded-lg border"
          allowFullScreen
        />
      ) : (
        <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-16 text-center">
          <Presentation className="text-muted-foreground h-10 w-10" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground text-sm">
              The slide preview appears here once the site is live. You can open the file now.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <a
          href={pptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary flex items-center gap-1.5 text-sm hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open slides in a new tab
        </a>
      </div>
    </div>
  );
}
