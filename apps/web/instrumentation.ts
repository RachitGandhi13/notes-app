// Runs once when the Node.js server starts (not during `next build`). A missing
// production variable stops the server here, before it takes traffic.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertProductionEnv } = await import("./lib/env");
  assertProductionEnv();
}
