import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Navbar, Footer, ThemedLogo, GlowCanvas } from "@repo/ui";
import { Providers } from "./providers";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/seo";
import "./globals.css";

// Ascend design system's type stack. --font-sans replaces the previous
// system-font stack sitewide (see tailwind.config.ts); --font-display,
// --font-serif and --font-mono are scoped to specific accent usages.
//
// Inter Tight 700 is preloaded (the hero h1 — the LCP element — is set in
// that weight); Inter 400 is preloaded too (the default body-text weight,
// visible immediately). A split, per-weight preload (only 700 of Inter
// Tight's 600/700 pair, only 400 of Inter's 400/500 pair) was tried first
// via a second, dummy-variable-only font instantiation per family, but
// next/font only emits a <link rel=preload> for a variable it can see
// referenced by actual rendered CSS — an unused variable's preload was
// silently dropped, confirmed by inspecting the built page's <head> (zero
// font preloads, worse than this combined form). JetBrains Mono and
// Instrument Serif stay on preload: false (accent-only, below the fold).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  display: "swap",
  preload: false,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#09090B",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CloudVidya Academy - Master Cloud & DevOps",
    template: "%s | CloudVidya Academy",
  },
  description: "Master Cloud Computing, DevOps, and Software Engineering.",
  openGraph: {
    siteName: "CloudVidya Academy",
    title: "CloudVidya Academy",
    description: "Master Cloud Computing, DevOps, and Software Engineering.",
    url: SITE_URL,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        <GlowCanvas />
        {/* Tells search engines the official site name, which Google uses for the result's name. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CloudVidya Academy",
              alternateName: "CloudVidya",
              url: SITE_URL,
            }),
          }}
        />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
            <Navbar
              brand="CloudVidya Academy"
              brandHref="/"
              logo={
                <>
                  <ThemedLogo layout="inline" height={26} title="" className="hidden sm:block" />
                  <ThemedLogo layout="mark" height={26} title="" className="sm:hidden" />
                </>
              }
              links={[
                { label: "Courses", href: "/#browse" },
                { label: "Notes", href: "/notes" },
                { label: "Internships", href: "/internships", glow: true },
              ]}
              search={<CourseSearchBar compact />}
            />
            <div className="flex-1">{children}</div>
            <Footer
              brand="CloudVidya Academy"
              logo={<ThemedLogo layout="inline" height={28} title="" />}
              wordmarkLogo={
                <ThemedLogo layout="horizontal" height={88} title="" className="h-auto w-full" />
              }
              description="Learn AWS, DevOps, and Cloud through hands-on, project-based courses and mentorship from Dr. Veeranna Gatate."
              linkColumns={[
                {
                  title: "Explore",
                  links: [
                    { label: "Home", href: "/" },
                    { label: "Browse courses", href: "/#browse" },
                    { label: "Notes", href: "/notes" },
                  ],
                },
                {
                  title: "Account",
                  links: [
                    { label: "Sign in", href: "/auth" },
                    { label: "Register", href: "/auth?tab=register" },
                    { label: "Profile", href: "/profile" },
                  ],
                },
              ]}
              linkedinUrl="https://linkedin.com/in/drveerannagatate"
              email="admin@cloudvidyaacademy.com"
              wordmark="CloudVidya Academy"
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
