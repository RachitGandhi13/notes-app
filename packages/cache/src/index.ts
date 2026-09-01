import Redis from "ioredis";

// ── Singleton ──────────────────────────────────────────────────────────────────

let _client: Redis | null = null;

function getClient(): Redis {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    _client.on("error", (err) => {
      // Log but don't crash — caching is best-effort
      console.warn("[cache] Redis error:", err.message);
    });
  }
  return _client;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_TTL = 3600; // 1 hour

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  try {
    await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await getClient().del(...keys);
  } catch {
    // best-effort
  }
}
