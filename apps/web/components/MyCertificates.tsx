"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import { Certificate } from "@/components/Certificate";
import { formatCertificateDate } from "@/lib/internships";

interface CertItem {
  trackName: string;
  certificateCode: string;
  issueDate: Date;
}

export function MyCertificates({
  studentName,
  certificates,
}: {
  studentName: string;
  certificates: CertItem[];
}) {
  const [openCode, setOpenCode] = useState<string | null>(null);
  const open = certificates.find((c) => c.certificateCode === openCode) ?? null;

  if (certificates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-md sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Award className="h-4 w-4" />
          </span>
          My Certificates
        </h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          {certificates.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {certificates.map((cert) => (
          <button
            key={cert.certificateCode}
            onClick={() => setOpenCode(cert.certificateCode)}
            className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-blue-500/30 hover:bg-white/10"
          >
            <span className="truncate text-sm font-medium text-zinc-100">{cert.trackName}</span>
            <span className="shrink-0 text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
              View →
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(isOpen) => !isOpen && setOpenCode(null)}>
        <DialogContent className="max-w-3xl">
          {open && (
            <Certificate
              studentName={studentName}
              trackName={open.trackName}
              issueDate={formatCertificateDate(open.issueDate)}
              certificateCode={open.certificateCode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
