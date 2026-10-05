// Imported from the placeholder subpath, not the package root. instrumentation.ts is also
// bundled for the Edge runtime, and the root pulls in next-auth, which needs Node's crypto.
import { isPlaceholder } from "@repo/auth/placeholder";

// Startup checks for the environment. Run once when the Node server starts (see
// instrumentation.ts). Problems are reported by name, never by value, so secrets stay out
// of the logs.
//
// In production, a missing or invalid required setting is an error and the server refuses
// to start. Outside production the same findings are warnings, so local development can
// run with a partial .env.

export interface EnvReport {
  /** Fatal in production. Always reported as warnings elsewhere. */
  errors: string[];
  /** Worth fixing, never fatal. */
  warnings: string[];
}

/** Required in production. Google and GitHub sign-in are optional and checked separately. */
export const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
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

/** Secrets that must not be placeholders. */
const SECRET_KEYS = [
  "NEXTAUTH_SECRET",
  "SMTP_PASS",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "REVALIDATE_SECRET",
] as const;

export function checkEnvironment(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const production = env.NODE_ENV === "production";
  const report: EnvReport = { errors: [], warnings: [] };
  const problem = (message: string) => {
    if (production) report.errors.push(message);
    else report.warnings.push(message);
  };
  const get = (key: string) => (env[key] ?? "").trim();

  // Missing required values.
  if (production) {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !get(key));
    if (missing.length > 0) {
      report.errors.push(`Missing required environment variables: ${missing.join(", ")}.`);
    }
  }

  // Formats.
  const databaseUrl = get("DATABASE_URL");
  if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
    problem("DATABASE_URL must start with postgresql:// (check for quotes or spaces).");
  }

  const redisUrl = get("REDIS_URL");
  if (redisUrl && !/^rediss?:\/\//.test(redisUrl)) {
    problem("REDIS_URL must start with redis:// or rediss:// (check for quotes or spaces).");
  }

  const nextAuthUrl = get("NEXTAUTH_URL");
  if (nextAuthUrl) {
    if (!/^https?:\/\//.test(nextAuthUrl)) {
      problem("NEXTAUTH_URL must start with https:// (check for quotes or spaces).");
    } else if (production && !nextAuthUrl.startsWith("https://")) {
      problem("NEXTAUTH_URL must use https:// in production.");
    }
  }

  const blobToken = get("BLOB_READ_WRITE_TOKEN");
  if (production && blobToken && !blobToken.startsWith("vercel_blob_rw_")) {
    report.errors.push("BLOB_READ_WRITE_TOKEN must start with vercel_blob_rw_ in production.");
  }

  const razorpayKeyId = get("RAZORPAY_KEY_ID");
  if (razorpayKeyId && !/^rzp_(live|test)_/.test(razorpayKeyId)) {
    problem("RAZORPAY_KEY_ID must start with rzp_live_ or rzp_test_.");
  }
  if (production && razorpayKeyId.startsWith("rzp_test_")) {
    report.warnings.push("RAZORPAY_KEY_ID is a test-mode key, so no real payments will be taken.");
  }
  const publicRazorpayKeyId = get("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  if (publicRazorpayKeyId && razorpayKeyId && publicRazorpayKeyId !== razorpayKeyId) {
    problem("NEXT_PUBLIC_RAZORPAY_KEY_ID does not match RAZORPAY_KEY_ID, so checkout will fail.");
  }

  // Placeholder values. Names only, never values.
  const placeholders = (keys: readonly string[], options?: { localhost?: boolean }) =>
    keys.filter((key) => get(key) && isPlaceholder(get(key), options));

  const smtpKeys = placeholders(["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]);
  if (smtpKeys.length > 0) {
    problem(
      `${smtpKeys.join(", ")} look like placeholders, so emails will not be delivered. Set the real values.`
    );
  }
  const otherKeys = placeholders([...SECRET_KEYS, "BLOB_READ_WRITE_TOKEN", "REDIS_URL"]);
  if (otherKeys.length > 0) {
    problem(`${otherKeys.join(", ")} look like placeholders. Set the real values.`);
  }

  // Social sign-in is optional. Say what is hidden, so it isn't a surprise.
  for (const [name, idKey, secretKey] of [
    ["GitHub", "GITHUB_ID", "GITHUB_SECRET"],
    ["Google", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  ] as const) {
    const idSet = get(idKey) !== "";
    const secretSet = get(secretKey) !== "";
    if (idSet !== secretSet) {
      report.warnings.push(`${name} sign-in is off: set both ${idKey} and ${secretKey}.`);
    } else if (
      idSet &&
      (isPlaceholder(get(idKey), { localhost: true }) || isPlaceholder(get(secretKey)))
    ) {
      report.warnings.push(
        `${name} sign-in is off: its ${idKey} or ${secretKey} is a placeholder.`
      );
    }
  }

  return report;
}
