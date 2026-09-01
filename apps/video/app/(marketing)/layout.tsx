import { Navbar } from "@repo/ui";
import NextTopLoader from "nextjs-toploader";

const NAV_LINKS = [
  { label: "Courses", href: "/" },
  { label: "Profile", href: "/profile" },
  { label: "Admin", href: "/admin" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
      <Navbar brand="Learn" brandHref="/" links={NAV_LINKS} />
      <main className="container py-8">{children}</main>
    </>
  );
}
