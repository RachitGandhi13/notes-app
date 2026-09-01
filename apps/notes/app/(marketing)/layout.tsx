import { Navbar } from "@repo/ui";
import NextTopLoader from "nextjs-toploader";
import { getTracks } from "@/lib/actions";
import { SearchDialog } from "@/components/SearchDialog";

const NAV_LINKS = [
  { label: "Tracks", href: "/" },
  { label: "Profile", href: "/profile" },
];

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const tracks = await getTracks();

  return (
    <>
      <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
      <Navbar brand="Notes" brandHref="/" links={NAV_LINKS} />
      {/* SearchDialog is a client component — receives track data from server */}
      <SearchDialog tracks={tracks} />
      <main className="container py-8">{children}</main>
    </>
  );
}
