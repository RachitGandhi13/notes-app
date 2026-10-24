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
  /** Full brand mark, e.g. `<CloudVidyaLogo layout="horizontal" />`. Takes over the whole brand slot — `brand`/`brandLogo` are ignored when set. */
  logo?: React.ReactNode;
  /** Large horizontal mark shown full-width below the link columns. Falls back to the plain `wordmark` text when omitted. */
  wordmarkLogo?: React.ReactNode;
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
  logo,
  wordmarkLogo,
  description,
  linkColumns,
  linkedinUrl,
  email,
  wordmark,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="py-13 mx-auto max-w-7xl px-5 sm:px-8">
        <div className="bg-card rounded-card border p-5 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <Link
                href={brandHref}
                aria-label={logo ? `${brand}, home` : undefined}
                className="ring-offset-background focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {logo ?? (
                  <>
                    {brandLogo && (
                      // eslint-disable-next-line
                      <img src={brandLogo} alt="" className="h-8 w-8 rounded-full object-cover" />
                    )}
                    <span className="text-primary text-lg font-extrabold tracking-tight">
                      {brand}
                    </span>
                  </>
                )}
              </Link>
              <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                {description}
              </p>
            </div>

            {linkColumns.map((col) => (
              <div key={col.title} className="sm:col-span-3">
                <p className="text-sm font-semibold">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm transition-colors lg:min-h-0"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {(linkedinUrl || email) && (
              <div className="flex items-start gap-2 sm:col-span-1 sm:justify-end">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary hover:bg-accent ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 lg:h-9 lg:w-9"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="bg-secondary hover:bg-accent ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 lg:h-9 lg:w-9"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 w-full">
          {wordmarkLogo ?? (
            <span className="text-primary text-2xl font-extrabold tracking-tight">{wordmark}</span>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] pt-6 sm:flex-row">
          <p className="text-muted-foreground text-small">
            © {year} {brand}. All rights reserved.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#71717A]">
            Learn &middot; Build &middot; Grow
          </p>
        </div>
      </div>
    </footer>
  );
}
