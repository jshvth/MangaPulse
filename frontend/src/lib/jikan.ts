import type { SearchResult } from "./types";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export async function searchJikan(query: string, limit = 6): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `${JIKAN_BASE_URL}/manga?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Jikan request failed");
  }
  const body = await res.json();
  const data = Array.isArray(body?.data) ? body.data : [];
  return data.map((item: any) => ({
    source: "jikan",
    sourceId: String(item.mal_id),
    malId: item.mal_id ?? null,
    title: item.title,
    image:
      item.images?.webp?.image_url ?? item.images?.jpg?.image_url ?? null,
    url: item.url ?? null,
    totalVolumes: item.volumes ?? null,
  }));
}
