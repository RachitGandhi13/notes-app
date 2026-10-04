// Hosts that next/image may optimise. Keep in step with `images.remotePatterns`
// in next.config.js. An image from any other host is still shown, but unoptimised,
// so one stray external URL in the data can't break the page it appears on.
const ALLOWED_HOSTS: RegExp[] = [
  /\.amazonaws\.com$/,
  /\.public\.blob\.vercel-storage\.com$/,
  /^lh3\.googleusercontent\.com$/,
  /^avatars\.githubusercontent\.com$/,
];

/** True when `src` is an absolute URL on a host next/image isn't configured for. */
export function needsUnoptimized(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false; // relative paths are served from public/
  try {
    const host = new URL(src).hostname;
    return !ALLOWED_HOSTS.some((re) => re.test(host));
  } catch {
    return true;
  }
}
