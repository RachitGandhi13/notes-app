import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";

export interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  brand: string;
  brandHref?: string;
  brandLogo?: string;
  description: string;
  linkColumns: { title: string; links: FooterLink[] }[];
  linkedinUrl?: string;
  email?: string;
  wordmark: string;
}

export function Footer({
  brand,
  brandHref = "/",
  brandLogo,
  description,
  linkColumns,
  linkedinUrl,
  email,
  wordmark,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container py-12">
        <div className="bg-card rounded-2xl border p-8">
          <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
            <div>
              <Link href={brandHref} className="flex items-center gap-2">
                {brandLogo && (
                  // eslint-disable-next-line
                  <img src={brandLogo} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <span className="text-primary text-lg font-extrabold tracking-tight">{brand}</span>
              </Link>
              <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                {description}
              </p>
            </div>

            {linkColumns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {(linkedinUrl || email) && (
              <div className="flex items-start gap-2 sm:justify-end">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="bg-secondary hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <p className="text-muted-foreground mt-8 text-xs">
            © {year} {brand}. All rights reserved.
          </p>
        </div>

        <div className="overflow-hidden pt-8 text-center" aria-hidden="true">
          <span className="text-primary/10 select-none whitespace-nowrap text-[8vw] font-extrabold leading-none tracking-tight">
            {wordmark}
          </span>
        </div>
      </div>
    </footer>
  );
}
