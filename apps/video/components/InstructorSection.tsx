import { ArrowRight, BadgeCheck, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { instructor } from "@/lib/instructor";

export function InstructorSection() {
  return (
    <div className="border-t pt-10">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl">
          <Image src={instructor.photo} alt={instructor.name} fill className="object-cover" />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-primary text-sm font-semibold">Founder of CloudVidya Academy</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">About {instructor.name}</h2>
          </div>

          <div className="space-y-3">
            {instructor.bio.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              href={instructor.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1.5 font-medium hover:underline"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a
              href={`mailto:${instructor.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {instructor.email}
            </a>
          </div>

          {instructor.certifications.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                Certifications
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {instructor.certifications.map((cert) => (
                  <li key={cert} className="flex items-start gap-1.5 text-xs">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="text-muted-foreground">{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SupportSection() {
  return (
    <div className="border-t py-14 text-center">
      <p className="text-primary text-sm font-semibold uppercase tracking-wide">Student Support</p>
      <h2 className="mt-2 text-4xl font-extrabold tracking-tight">
        Need <span className="text-primary">help?</span>
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed">
        Have a question or need assistance? Email us at{" "}
        <a href={`mailto:${instructor.email}`} className="text-primary font-medium hover:underline">
          {instructor.email}
        </a>
        , and we&apos;ll get back to you as soon as we can.
      </p>
      <a
        href={`mailto:${instructor.email}`}
        className="bg-card hover:bg-accent mt-6 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        <Mail className="h-4 w-4" />
        Email support
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
