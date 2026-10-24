import type { Metadata } from "next";
import { GlassCard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "CloudVidya Academy's policy on refund eligibility, the cancellation window, how refunds are processed, and which course purchases are non-refundable.",
  alternates: { canonical: "/refund-policy" },
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
export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Refund Policy</h1>
      </div>

      <GlassCard radius={24} className="space-y-8 p-5 sm:p-8">
        <Section title="Eligibility" />
        <Section title="Cancellation window" />
        <Section title="Refund process and timelines" />
        <Section title="Non-refundable items" />
        <Section title="Contact" />
      </GlassCard>
    </main>
  );
}
