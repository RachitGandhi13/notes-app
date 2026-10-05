// Runs once when the Node.js server starts, before it accepts requests (not during `next build`).
//
// Problems are printed by name. In production an error exits the process: throwing here is
// not enough, because Next.js then fails every request, the health check included, so the
// container stays "running" but never becomes healthy and the cause is hard to see.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkEnvironment } = await import("./lib/env");
  const report = checkEnvironment();

  for (const warning of report.warnings) {
    console.warn(`[config] ${warning}`);
  }
  if (report.errors.length > 0) {
    for (const error of report.errors) {
      console.error(`[config] ${error}`);
    }
    console.error("[config] Fix the values in the hosting environment and redeploy.");
    process.exit(1);
  }
}
