import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Navbar, Footer } from "@repo/ui";
import { Providers } from "./providers";
import { NavSearchTrigger } from "@/components/NavSearchTrigger";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CloudVidya Academy — Notes",
  description: "Structured learning tracks with Notion-backed notes and quizzes.",
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
              search={<NavSearchTrigger />}
            />
            <div className="flex-1">{children}</div>
            <Footer
              brand="CloudVidya"
              brandLogo="/cloudvidya.png"
              description="Structured notes and quizzes to go with CloudVidya Academy's video courses."
              linkColumns={[
                {
                  title: "Explore",
                  links: [
                    { label: "Home", href: "/" },
                    { label: "Browse tracks", href: "/#browse" },
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
