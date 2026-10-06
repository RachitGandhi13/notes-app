import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Admin, API and account pages are private, so search engines are asked not to crawl them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
