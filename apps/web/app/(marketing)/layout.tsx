// Each section of the home page manages its own width, so the hero and the
// banners can run edge to edge.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
