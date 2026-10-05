// Detects configuration values that are obviously not real: empty strings, the word
// "dummy" or "placeholder" as a segment, template text like "your-secret", and the
// reserved .invalid and .example hostnames. Real secrets never look like this.
const PLACEHOLDER_SEGMENT =
  /(^|[-._:/])(dummy|placeholder|changeme|change-me|your|example|todo|xxx)([-._:/]|$)/i;

export function isPlaceholder(
  value: string | null | undefined,
  options: { localhost?: boolean } = {}
): boolean {
  const v = (value ?? "").trim();
  if (!v) return true;
  if (PLACEHOLDER_SEGMENT.test(v)) return true;
  if (/^<.*>$/.test(v)) return true;
  if (/\.(invalid|example)$/i.test(v) || /^example\.(com|org|net)$/i.test(v)) return true;
  if (options.localhost && /^(localhost|127\.0\.0\.1)$/i.test(v)) return true;
  return false;
}

/**
 * Which social sign-in buttons should be shown. A provider counts as enabled only when
 * both its ID and its secret are real values.
 */
export function enabledOAuthProviders(env: NodeJS.ProcessEnv = process.env): {
  github: boolean;
  google: boolean;
} {
  return {
    github: !isPlaceholder(env.GITHUB_ID, { localhost: true }) && !isPlaceholder(env.GITHUB_SECRET),
    google:
      !isPlaceholder(env.GOOGLE_CLIENT_ID, { localhost: true }) &&
      !isPlaceholder(env.GOOGLE_CLIENT_SECRET),
  };
}
