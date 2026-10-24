import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Aurora, Grain, HeroGrid } from "@repo/ui";
import { Certificate } from "@/components/Certificate";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";
import { AuthCard } from "@/components/AuthCard";
import { Reveal } from "@/components/Reveal";
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

  if (!certificate) {
    return (
      <AuthCard
        title="Certificate not found"
        subtitle="This link doesn't match any CloudVidya Academy certificate on record. If you believe this is an error, contact the Academy directly."
        icon={
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
            <XCircle className="h-6 w-6" />
          </span>
        }
      >
        <></>
      </AuthCard>
    );
  }

  return (
    <div className="relative isolate overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      <AnimatedBackdrop className="dark:hidden" />
      <Aurora variant="panel" />
      <Grain opacity={0.6} />
      <HeroGrid />

      <Reveal distance={8} className="relative mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="text-lg font-bold">This certificate is genuine</p>
          <p className="text-muted-foreground text-sm">
            Issued by CloudVidya Academy to {certificate.user.name ?? "this student"} on{" "}
            {formatCertificateDate(certificate.issueDate)}.
          </p>
        </div>
        <Certificate
          studentName={certificate.user.name ?? "Student"}
          trackName={certificate.trackName}
          issueDate={formatCertificateDate(certificate.issueDate)}
          certificateCode={certificate.certificateCode}
        />
      </Reveal>
    </div>
  );
}
