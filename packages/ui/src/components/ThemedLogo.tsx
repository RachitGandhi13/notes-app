"use client";

import { useTheme } from "next-themes";
import { CloudVidyaLogo, type CloudVidyaLogoProps } from "./CloudVidyaLogo";

// CloudVidyaLogo takes an explicit theme prop ("dark" | "light" | "mono") —
// it has no CSS-variable-driven auto-switching of its own — so this reads
// the site's actual next-themes state and picks the matching variant.
// Without it, a hardcoded theme="dark" would render white wordmark text,
// invisible on a light-mode navbar/footer (both use the theme-aware
// bg-background/bg-card tokens, not a fixed dark background).
export function ThemedLogo(props: Omit<CloudVidyaLogoProps, "theme">) {
  const { resolvedTheme } = useTheme();
  return <CloudVidyaLogo theme={resolvedTheme === "light" ? "light" : "dark"} {...props} />;
}
