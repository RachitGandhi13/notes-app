import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Navbar, Footer, ThemedLogo, GlowCanvas } from "@repo/ui";
import { Providers } from "./providers";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/seo";
import "./globals.css";

// Ascend design system's type stack. --font-sans replaces the previous
// system-font stack sitewide (see tailwind.config.ts); --font-display and
// --font-mono are scoped to the new display heading / eyebrow usages only.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
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
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
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
                  <ThemedLogo layout="inline" height={28} title="" className="hidden sm:block" />
                  <ThemedLogo layout="mark" height={28} title="" className="sm:hidden" />
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
              logo={<ThemedLogo layout="horizontal" height={88} />}
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
