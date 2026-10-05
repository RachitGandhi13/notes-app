/** @type {import('next').NextConfig} */

// Content-Security-Policy. Next.js injects inline scripts for hydration, so
// 'unsafe-inline' is kept for scripts until nonces are added. Every other host
// is one the app actually loads from: Razorpay Checkout (script and frames) and
// the Microsoft Office viewer used to show uploaded slides.
// Next.js development mode evaluates code from strings (fast refresh and source maps),
// which needs 'unsafe-eval'. Production builds don't, so it is added only in development.
const devEval = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://view.officeapps.live.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // Browsers only honour HSTS over HTTPS. No `preload`: that is a long-term
  // commitment to make after the domain is settled.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // `payment` is left unrestricted: Razorpay Checkout uses the Payment Request API for wallet buttons.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  // Standalone output: a self-contained server bundle for the Docker image.
  output: "standalone",
  // Don't advertise the framework in the X-Powered-By header.
  poweredByHeader: false,
  experimental: {
    // Runs lib/env checks at server start (see instrumentation.ts).
    instrumentationHook: true,
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/store",
    "@repo/auth",
    "@repo/db",
    "@repo/cache",
    "@repo/storage",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
