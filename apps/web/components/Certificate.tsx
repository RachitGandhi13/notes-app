"use client";

import { useEffect, useRef, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site";

const cursive = Dancing_Script({ subsets: ["latin"], weight: "700" });

export interface CertificateProps {
  studentName: string;
  trackName: string;
  issueDate: string;
  certificateCode: string;
}

// Renders a self-contained certificate (no background template image — every field,
// including the decorative elements, is real DOM/CSS) and offers a high-DPI PDF download
// of exactly what's rendered. The QR code always points at this certificate's public
// /verify/[certificateCode] page, so a scan works for anyone, signed in or not.
export function Certificate({
  studentName,
  trackName,
  issueDate,
  certificateCode,
}: CertificateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const verifyUrl = `${SITE_URL}/verify/${certificateCode}`;
    QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [certificateCode]);

  async function handleDownload() {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`CloudVidya-${trackName.replace(/\s+/g, "-")}-Certificate.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="relative mx-auto aspect-[1.6/1] w-full max-w-3xl overflow-hidden rounded-2xl border bg-white p-6 text-slate-900 sm:p-10"
      >
        <div className="from-primary pointer-events-none absolute -right-12 -top-12 h-40 w-40 rotate-45 bg-gradient-to-br to-violet-500 opacity-90" />
        <div className="from-primary pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rotate-45 bg-gradient-to-br to-violet-500 opacity-90" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cloudvidya.png" alt="" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-primary text-sm font-extrabold tracking-tight">
              CloudVidya Academy
            </span>
          </div>
          <span className="text-right text-[10px] italic leading-tight text-slate-400">
            Learn · Practice
            <br />
            Build · Grow
          </span>
        </div>

        <div className="relative mt-6 text-center sm:mt-8">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">CERTIFICATE</h1>
          <p className="text-primary mt-1 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
            of Internship Completion
          </p>
        </div>

        <div className="relative mt-6 text-center sm:mt-8">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            This is to certify that
          </p>
          <p className={`${cursive.className} text-primary mt-2 text-3xl sm:text-5xl`}>
            {studentName}
          </p>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
            has successfully completed the Internship Program at <strong>CloudVidya Academy</strong>{" "}
            in the area of
          </p>
          <p className="text-primary mt-1 text-sm font-bold sm:text-base">{trackName}</p>
        </div>

        <div className="relative mt-8 flex items-end justify-between gap-4 sm:mt-10">
          <div>
            <p className={`${cursive.className} text-lg sm:text-xl`}>Veeranna Gatate</p>
            <p className="border-t pt-1 text-[10px] font-semibold sm:text-xs">
              Dr. Veeranna Gatate
            </p>
            <p className="text-[9px] text-slate-500">
              Founder &amp; Instructor, CloudVidya Academy
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500">Date of Issue</p>
            <p className="text-[10px] font-semibold sm:text-xs">{issueDate}</p>
          </div>
          {qrDataUrl && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Scan to verify" className="h-14 w-14 sm:h-16 sm:w-16" />
              <p className="mt-0.5 text-[8px] text-slate-500">Scan to verify</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
