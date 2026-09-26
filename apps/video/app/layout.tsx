import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Navbar, Footer } from "@repo/ui";
import { Providers } from "./providers";
import { CourseSearchBar } from "@/components/CourseSearchBar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CloudVidya Academy",
  description: "Purchase-gated video courses with progress tracking and certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
            <Navbar
              brand="CloudVidya"
              brandHref="/"
              brandLogo="/cloudvidya.png"
              links={[
                {
                  label: "Notes",
                  href: process.env.NEXT_PUBLIC_NOTES_APP_URL ?? "http://localhost:3000",
                },
              ]}
              search={<CourseSearchBar compact />}
            />
            <div className="flex-1">{children}</div>
            <Footer
              brand="CloudVidya"
              brandLogo="/cloudvidya.png"
              description="Learn AWS, DevOps, and Cloud through hands-on, project-based courses and mentorship from Dr. Veeranna Gatate."
              linkColumns={[
                {
                  title: "Explore",
                  links: [
                    { label: "Home", href: "/" },
                    { label: "Browse courses", href: "/#browse" },
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
              email="vcgatate@gmail.com"
              wordmark="CloudVidya"
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
