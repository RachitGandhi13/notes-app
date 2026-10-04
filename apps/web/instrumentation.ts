// Runs once when the Node.js server starts, before it accepts requests (not during `next build`).
//
// A missing production variable exits the process with the names of the missing ones. Throwing
// here is not enough: Next.js then fails every request, the health check included, so the
// container stays "running" but never becomes healthy and the cause is hard to see in the logs.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { missingProductionEnv } = await import("./lib/env");
  const missing = missingProductionEnv();
  if (missing.length > 0) {
    console.error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in the hosting environment and redeploy."
    );
    process.exit(1);
  }
}
