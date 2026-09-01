"use client";

import dynamic from "next/dynamic";
import type { ExtendedRecordMap } from "notion-types";
import "react-notion-x/src/styles.css";

// Dynamically import heavy Notion block renderers to reduce initial bundle
const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code)
);
const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then((m) => m.Collection)
);
const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
);
const Modal = dynamic(() =>
  import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
  { ssr: false }
);

// The main renderer — must be client-side only
const NotionRendererBase = dynamic(
  () => import("react-notion-x").then((m) => m.NotionRenderer),
  { ssr: false }
);

interface NotionRendererProps {
  recordMap: ExtendedRecordMap;
}

export function NotionRenderer({ recordMap }: NotionRendererProps) {
  return (
    <NotionRendererBase
      recordMap={recordMap}
      fullPage={false}
      darkMode={false}
      components={{
        Code,
        Collection,
        Equation,
        Modal,
      }}
      // Open Notion links in a new tab
      mapPageUrl={(pageId) => `https://notion.so/${pageId.replace(/-/g, "")}`}
    />
  );
}
