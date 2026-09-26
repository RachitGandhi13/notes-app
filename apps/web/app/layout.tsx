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
  description:
    "Video courses, structured notes and quizzes for AWS, DevOps and Cloud — with progress tracking and certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
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
              email="vcgatate@gmail.com"
              wordmark="CloudVidya Academy"
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
