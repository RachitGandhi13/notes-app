import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Navbar, Footer } from "@repo/ui";
import { Providers } from "./providers";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
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
              brandLogo="/cloudvidya.png"
              links={[
                { label: "Courses", href: "/#browse" },
                { label: "Notes", href: "/notes" },
              ]}
              search={<CourseSearchBar compact />}
            />
            <div className="flex-1">{children}</div>
            <Footer
              brand="CloudVidya Academy"
              brandLogo="/cloudvidya.png"
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
              email="veeranna@cloudvidyaacademy.com"
              wordmark="CloudVidya Academy"
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
