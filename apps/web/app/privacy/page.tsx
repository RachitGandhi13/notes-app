import type { Metadata } from "next";
import { GlassCard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CloudVidya Academy collects, uses and protects your account, payment and usage data.",
  alternates: { canonical: "/privacy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

// NEEDS CLIENT/LEGAL REVIEW: the [placeholders] below (legal entity name,
// registered address, effective date) must be filled in by the client or
// their counsel before this page is relied on. Everything else describes
// data this app actually collects/processes, read from the real auth,
// payment and analytics integrations already in the codebase.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Effective date: [effective date]</p>
      </div>

      <GlassCard radius={24} className="space-y-8 p-5 sm:p-8">
        <Section title="Who we are">
          <p>
            CloudVidya Academy ({"[legal entity name]"}, registered at {"[registered address]"})
            operates this website and the courses, notes and internship programs offered on it. For
            any privacy question, contact us at{" "}
            <a
              href="mailto:admin@cloudvidyaacademy.com"
              className="text-primary-ink hover:underline"
            >
              admin@cloudvidyaacademy.com
            </a>
            .
          </p>
        </Section>

        <Section title="Account data">
          <p>
            When you register, we store your name, email address and a securely hashed password (or,
            if you sign in with Google, the profile information Google shares with us — your name,
            email and profile photo). We use this to create and secure your account, show your
            progress, and issue certificates in your name.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Course and internship payments are processed by Razorpay. We never see or store your
            card, UPI or bank details — Razorpay handles payment data directly and shares with us
            only the order status, amount and the course or track you purchased, so we can grant
            access.
          </p>
        </Section>

        <Section title="Cookies and analytics">
          <p>
            We use a session cookie to keep you signed in. Where enabled, we also use Google
            Analytics to understand how the site is used (pages visited, general location, device
            type). Google Analytics does not receive your name, email or payment details from us.
          </p>
        </Section>

        <Section title="How long we keep your data">
          <p>
            We keep your account, purchase and certificate records for as long as your account is
            active, and as needed to meet our legal and accounting obligations. You can ask us to
            delete your account by emailing the address above.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can review and update your profile from your account page at any time, and you can
            ask us to export or delete your data by contacting us.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the site changes. Material changes will be reflected by
            updating the effective date above.
          </p>
        </Section>
      </GlassCard>
    </main>
  );
}
