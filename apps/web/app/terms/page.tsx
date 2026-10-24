import type { Metadata } from "next";
import { GlassCard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern using CloudVidya Academy's platform, covering accounts, payments, intellectual property, liability and the law that applies.",
  alternates: { canonical: "/terms" },
};

function Section({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground text-sm italic leading-relaxed">
        [Content pending: to be provided by CloudVidya Academy]
      </p>
    </section>
  );
}

// NEEDS CLIENT/LEGAL REVIEW: every section below is a placeholder shell —
// no policy text is invented here. Headings only, per the release prompt.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Terms of Service</h1>
      </div>

      <GlassCard radius={24} className="space-y-8 p-5 sm:p-8">
        <Section title="Use of the platform" />
        <Section title="Accounts" />
        <Section title="Payments" />
        <Section title="Intellectual property" />
        <Section title="Limitation of liability" />
        <Section title="Governing law" />
        <Section title="Contact" />
      </GlassCard>
    </main>
  );
}
