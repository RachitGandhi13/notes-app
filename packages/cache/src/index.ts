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

// Network and parse failures degrade to "no cache". Configuration errors are rethrown.
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
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
    await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    if (err instanceof CacheConfigError) throw err;
    // best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await getClient().del(...keys);
  } catch (err) {
    if (err instanceof CacheConfigError) throw err;
    // best-effort
  }
}
