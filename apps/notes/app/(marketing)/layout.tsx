import { getTracks } from "@/lib/actions";
import { SearchDialog } from "@/components/SearchDialog";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const tracks = await getTracks();

  return (
    <>
      {/* SearchDialog is a client component — receives track data from server */}
      <SearchDialog tracks={tracks} />
      <main className="container py-8">{children}</main>
    </>
  );
}
