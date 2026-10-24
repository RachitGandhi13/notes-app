import type { Metadata } from "next";
import { GlassCard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "CloudVidya Academy delivers every course and note set digitally — access is granted to your account right after payment, nothing is shipped.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Shipping Policy</h1>
      </div>

      <GlassCard radius={24} className="space-y-4 p-5 sm:p-8">
        <p className="text-muted-foreground text-sm leading-relaxed">
          All courses and notes are delivered digitally. Access is granted to your account
          immediately after successful payment. No physical goods are shipped.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Questions about your access? Contact us at{" "}
          <a href="mailto:admin@cloudvidyaacademy.com" className="text-primary-ink hover:underline">
            admin@cloudvidyaacademy.com
          </a>
          .
        </p>
      </GlassCard>
    </main>
  );
}
