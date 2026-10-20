import { Presentation } from "lucide-react";

interface PPTViewerProps {
  pptUrl: string;
  title: string;
}

// Shows the uploaded section file on the page itself, view-only — no link out to open
// or download it separately, so this is the only way a student ever sees the file.
//
//  • PDF             → the browser's own viewer, inline, with its toolbar (and the
//                       download button in it) hidden via #toolbar=0.
//  • PNG / JPG / JPEG → a plain <img>.
//  • PPT / PPTX       → Microsoft's free Office viewer in an iframe. It fetches the
//                       file from its own servers, so it only works when the file's
//                       URL is public https (i.e. once the site is deployed with
//                       cloud storage) — not for a file saved on a dev machine.
export function PPTViewer({ pptUrl, title }: PPTViewerProps) {
  const ext = pptUrl.split("?")[0]?.toLowerCase().split(".").pop() ?? "";
  const isPdf = ext === "pdf";
  const isImage = ext === "png" || ext === "jpg" || ext === "jpeg";
  const isPublicHttps = pptUrl.startsWith("https://");

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={pptUrl} alt={title} className="w-full rounded-lg border" />
    );
  }

  const embedUrl = isPdf
    ? `${pptUrl}#toolbar=0`
    : isPublicHttps
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptUrl)}`
      : null;

  return embedUrl ? (
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
          The slide preview appears here once the site is live.
        </p>
      </div>
    </div>
  );
}
