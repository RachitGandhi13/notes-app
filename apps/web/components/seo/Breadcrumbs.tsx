import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl, jsonLd } from "@/lib/seo";

export interface Crumb {
  label: string;
  /** Omit on the current/last crumb — it renders as plain text, not a link. */
  href?: string;
}

// Visible trail + matching BreadcrumbList JSON-LD, built from the same items
// so they can never drift apart.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.label,
              ...(item.href ? { item: absoluteUrl(item.href) } : {}),
            })),
          }),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex items-center gap-1.5 text-xs"
      >
        {items.map((item, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground truncate transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground truncate font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
