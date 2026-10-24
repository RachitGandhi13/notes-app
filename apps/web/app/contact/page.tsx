import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { GlassCard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with CloudVidya Academy by email.",
  alternates: { canonical: "/contact" },
};

// No contact form backend exists yet (confirmed: no apps/web/app/api/contact
// route) — per the Phase 1 constraints, a new API route is out of scope
// for this presentation-only pass. This is a mailto: page, not a form.
// See NEEDS LOGIC CHANGE: a real contact form backend.
const CONTACT_EMAIL = "admin@cloudvidyaacademy.com";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10 text-center sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Questions about a course, your account or an internship application? Reach us directly —
          we read every message.
        </p>
      </div>

      <GlassCard radius={24} className="flex flex-col items-center gap-4 p-5 sm:p-8">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="bg-primary text-primary-foreground flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-lg transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
        >
          <Mail className="h-4 w-4" />
          {CONTACT_EMAIL}
        </a>
      </GlassCard>
    </main>
  );
}
