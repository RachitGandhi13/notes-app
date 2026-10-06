import { SITE_URL } from "./site";

// Shared helpers for search metadata and structured data.

/** Used for social previews when a course or track has no image of its own. */
export const DEFAULT_OG_IMAGE = "/cloudvidya.png";

/** Collapses whitespace and shortens text to about `max` characters, without cutting a word. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Serialises JSON-LD for a `<script type="application/ld+json">` tag. "<" is escaped, so a
 * title containing "</script>" can't end the tag early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** An absolute URL. Relative paths resolve against the site origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
