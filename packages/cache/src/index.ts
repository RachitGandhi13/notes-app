import Redis from "ioredis";

// ── Singleton ──────────────────────────────────────────────────────────────────

/** A missing setting. Unlike a network error, this is never swallowed. */
export class CacheConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheConfigError";
  }
}

let _client: Redis | null = null;

function getClient(): Redis {
  if (!_client) {
    const url = process.env.REDIS_URL;
    if (!url) throw new CacheConfigError("REDIS_URL is not set.");
    _client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      // Without these, an unreachable Redis holds the request open until the load balancer
      // gives up (a 504 for the admin). Caching is best-effort, so fail fast instead.
      connectTimeout: 3000,
      commandTimeout: 2000,
    });
    _client.on("error", (err) => {
      // Caching is best-effort, so a dropped connection is logged and the app carries on.
      console.error("[cache] Redis error:", err.message);
    });
  }
  return _client;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_TTL = 3600; // 1 hour

// Local dev and production point at the same REDIS_URL (no separate dev instance),
// so an unscoped key lets local work read, overwrite, or invalidate real production
// cache entries — this is what let a locally-triggered revalidation briefly affect
// production's course/bundle lists. Every key is scoped by NODE_ENV so the two
// environments can never collide, even while sharing one Redis URL. This app runs
// on Lightsail (via the Dockerfile's own ENV NODE_ENV=production), not Vercel, so
// VERCEL_ENV is never set here and isn't used.
function scopedKey(key: string): string {
  return `${process.env.NODE_ENV ?? "development"}:${key}`;
}

// Network and parse failures degrade to "no cache". Configuration errors are rethrown.
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(scopedKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (err instanceof CacheConfigError) throw err;
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  try {
    await getClient().set(scopedKey(key), JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    if (err instanceof CacheConfigError) throw err;
    // best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await getClient().del(...keys.map(scopedKey));
  } catch (err) {
    if (err instanceof CacheConfigError) throw err;
    // best-effort
  }
}
