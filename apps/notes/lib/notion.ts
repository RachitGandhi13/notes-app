import { NotionAPI } from "notion-client";

// Singleton — reused across requests in the same server process
export const notion = new NotionAPI({
  // Optionally set an auth token for private Notion pages:
  // authToken: process.env.NOTION_TOKEN,
});

/**
 * Fetch a Notion page record map by page ID.
 * The page ID can be a plain UUID or a Notion URL slug.
 */
export async function getNotionPage(pageId: string) {
  return notion.getPage(pageId);
}

/**
 * Fetch the top-level block children of a Notion page.
 * Used by the AddTracks API to extract child page IDs.
 */
export async function getNotionPageBlocks(pageId: string) {
  const recordMap = await notion.getPage(pageId);
  const block = recordMap.block[pageId]?.value;
  if (!block) return [];

  const contentIds: string[] = block.content ?? [];
  return contentIds.map((id) => {
    const child = recordMap.block[id]?.value;
    return {
      notionDocId: id,
      title: child?.properties?.title?.[0]?.[0] ?? "Untitled",
      type: child?.type ?? "page",
    };
  });
}
