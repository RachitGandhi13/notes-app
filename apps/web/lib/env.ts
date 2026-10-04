// Production environment checks. Run once at server start (see instrumentation.ts),
// so a missing variable stops the deploy with a clear message instead of
// surfacing later as a broken page or a silent fallback.

/** Variables the running production server cannot work without. */
export const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GITHUB_ID",
  "GITHUB_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "REDIS_URL",
  "REVALIDATE_SECRET",
] as const;

/** The required production variables that are missing or empty. */
export function missingProductionEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== "production") return [];
  return REQUIRED_IN_PRODUCTION.filter((name) => !env[name]?.trim());
}

/** Throws if any required production variable is missing or empty. */
export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = missingProductionEnv(env);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for production: ${missing.join(", ")}. ` +
        "Set them in the hosting environment (App Runner) before starting the server."
    );
  }
}
