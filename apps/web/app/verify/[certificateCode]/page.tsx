import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Certificate } from "@/components/Certificate";
import { getCertificateByCode } from "@/lib/internship-actions";
import { formatCertificateDate } from "@/lib/internships";

interface Props {
  params: { certificateCode: string };
}

export const metadata: Metadata = {
  title: "Verify Certificate",
  robots: { index: false, follow: false },
};

export default async function VerifyCertificatePage({ params }: Props) {
  const certificate = await getCertificateByCode(params.certificateCode);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-16">
      {certificate ? (
        <>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            <p className="text-lg font-bold">This certificate is genuine</p>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            Issued by CloudVidya Academy to {certificate.user.name ?? "this student"} on{" "}
            {formatCertificateDate(certificate.issueDate)}.
          </p>
          <Certificate
            studentName={certificate.user.name ?? "Student"}
            trackName={certificate.trackName}
            issueDate={formatCertificateDate(certificate.issueDate)}
            certificateCode={certificate.certificateCode}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <XCircle className="text-destructive h-10 w-10" />
          <h1 className="text-xl font-bold">Certificate not found</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            This link doesn&apos;t match any CloudVidya Academy certificate on record. If you
            believe this is an error, contact the Academy directly.
          </p>
        </div>
      )}
    </div>
  );
}
