import type { MetadataRoute } from "next";

// Next.js App Router convention — auto-served at /manifest.webmanifest with
// the right content type and <link rel="manifest"> tag, no manual <head>
// edit needed. Values ported from the brand package's site.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CloudVidya Academy",
    short_name: "CloudVidya",
    theme_color: "#09090B",
    background_color: "#18181B",
    display: "standalone",
    icons: [
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
