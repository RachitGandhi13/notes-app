import { GoogleGenerativeAI } from "@google/generative-ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import type { ExtendedRecordMap } from "notion-types";

// ── Singletons ─────────────────────────────────────────────────────────────────

const COLLECTION_NAME = "notes_platform";
const VECTOR_SIZE = Number(process.env.VECTOR_SIZE ?? 768);

function getQdrant() {
  return new QdrantClient({
    url: process.env.QDRANT_URL ?? "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
  });
}

function getEmbeddingModel() {
  const genai = new GoogleGenerativeAI(process.env.GOOGLEAI_API_KEY!);
  return genai.getGenerativeModel({ model: "embedding-001" });
}

// ── Collection bootstrap ───────────────────────────────────────────────────────

export async function ensureCollection() {
  const qdrant = getQdrant();
  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: "Dot" },
    });
  }
}

// ── Text extraction from Notion record map ────────────────────────────────────

const TEXT_BLOCK_TYPES = new Set([
  "heading_1",
  "heading_2",
  "heading_3",
  "sub_header",
  "sub_sub_header",
  "text",
  "bulleted_list_item",
  "numbered_list_item",
  "quote",
  "callout",
]);

export function extractTextFromRecordMap(recordMap: ExtendedRecordMap): string {
  const lines: string[] = [];

  for (const blockId of Object.keys(recordMap.block)) {
    const block = recordMap.block[blockId]?.value;
    if (!block || !TEXT_BLOCK_TYPES.has(block.type)) continue;

    const titleProp = block.properties?.title as [string, unknown[]][] | undefined;
    if (!titleProp) continue;

    // Each element is [text, ...annotations] — we only want the text part
    const text = titleProp.map((t) => t[0]).join("").trim();
    if (text) lines.push(text);
  }

  return lines.join("\n");
}

// ── Embedding helper ───────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  const values = result.embedding.values;
  // Slice to VECTOR_SIZE in case the model returns more dimensions
  return values.slice(0, VECTOR_SIZE);
}

// ── Indexing ───────────────────────────────────────────────────────────────────

export interface IndexPayload {
  trackId: string;
  trackTitle: string;
  image: string;
  problemTitle: string;
  problemId: string;
}

/**
 * Index all problems of a track into Qdrant.
 * Called by the admin after creating or updating a track.
 */
export async function insertData(
  trackId: string,
  trackTitle: string,
  image: string,
  problems: { id: string; title: string; notionDocId: string }[]
) {
  await ensureCollection();
  const qdrant = getQdrant();

  // Import notion lazily — only needed server-side during indexing
  const { getNotionPage } = await import("./notion");

  const points: {
    id: string;
    vector: number[];
    payload: IndexPayload;
  }[] = [];

  for (const problem of problems) {
    try {
      const recordMap = await getNotionPage(problem.notionDocId);
      const rawText = extractTextFromRecordMap(recordMap);

      // Combine title + body text for richer embedding signal
      const textToEmbed = `${problem.title}\n\n${rawText}`.trim();
      if (!textToEmbed) continue;

      const vector = await embed(textToEmbed);

      points.push({
        id: problem.id, // UUID — Qdrant accepts UUID string IDs
        vector,
        payload: {
          trackId,
          trackTitle,
          image,
          problemTitle: problem.title,
          problemId: problem.id,
        },
      });
    } catch (err) {
      console.error(`[search] Failed to index problem ${problem.id}:`, err);
    }
  }

  if (points.length > 0) {
    await qdrant.upsert(COLLECTION_NAME, { points, wait: true });
  }

  return points.length;
}

// ── Search ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  score: number;
  payload: IndexPayload;
}

/**
 * Embed a user query and return the top-5 nearest Qdrant matches.
 */
export async function getSearchResults(query: string): Promise<SearchResult[]> {
  await ensureCollection();
  const qdrant = getQdrant();

  const vector = await embed(query);

  const results = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit: 5,
    with_payload: true,
  });

  return results.map((r) => ({
    score: r.score,
    payload: r.payload as IndexPayload,
  }));
}
