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
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Award className="h-5 w-5" /> My Certificates
      </h2>
      <ul className="divide-y rounded-xl border">
        {certificates.map((cert) => (
          <li key={cert.certificateCode} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{cert.trackName}</span>
            <button
              onClick={() => setOpenCode(cert.certificateCode)}
              className="text-primary text-xs underline"
            >
              View &amp; download →
            </button>
          </li>
        ))}
      </ul>

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
