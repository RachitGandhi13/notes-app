import type { MetadataRoute } from "next";
import { cacheGet, cacheSet } from "@repo/cache";
import { prisma } from "@repo/db/client";
import { SITE_URL } from "@/lib/site";

// Built on request, not at build time. The Docker build has no database, and a sitemap built
// there would stay frozen with only the static pages.
export const dynamic = "force-dynamic";

const CACHE_KEY = "sitemap:entries:v1";
const CACHE_SECONDS = 60 * 60;

// Always listed, even when the database is unavailable.
const STATIC_PATHS = ["/", "/notes"];

interface DynamicEntry {
  path: string;
  lastModified?: string;
}

// Each cache call has its own try block. A missing or unreachable Redis must not stop the
// database fallback below.
async function readCache(): Promise<DynamicEntry[] | null> {
  try {
    return await cacheGet<DynamicEntry[]>(CACHE_KEY);
  } catch {
    return null;
  }
}

async function writeCache(entries: DynamicEntry[]): Promise<void> {
  try {
    await cacheSet(CACHE_KEY, entries, CACHE_SECONDS);
  } catch {
    // Caching is best-effort. The sitemap still works without it.
  }
}

async function loadDynamicEntries(): Promise<DynamicEntry[]> {
  const cached = await readCache();
  if (cached) return cached;

  // Hidden courses and tracks stay out of search. They are reachable by direct link only.
  const [courses, tracks] = await Promise.all([
    prisma.course.findMany({
      where: { hidden: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.track.findMany({
      where: { hidden: false },
      select: { id: true },
    }),
  ]);

  const entries: DynamicEntry[] = [
    ...courses.map((c) => ({
      path: `/courses/${c.slug}`,
      lastModified: c.updatedAt.toISOString(),
    })),
    ...tracks.map((t) => ({ path: `/tracks/${t.id}` })),
  ];

  await writeCache(entries);
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    const dynamicEntries = await loadDynamicEntries();
    return [
      ...staticEntries,
      ...dynamicEntries.map((entry) => ({
        url: `${SITE_URL}${entry.path}`,
        ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
      })),
    ];
  } catch (err) {
    console.error("[sitemap] database unavailable, listing static pages only:", err);
    return staticEntries;
  }
}
