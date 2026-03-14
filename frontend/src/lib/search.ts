import type { SearchResult } from "./types";
import { searchJikan } from "./jikan";
import { searchAniList } from "./anilist";

function uniqueKey(item: SearchResult) {
  if (item.malId) return `mal-${item.malId}`;
  return `src-${item.source}-${item.sourceId}`;
}

export async function searchManga(query: string): Promise<SearchResult[]> {
  let primary: SearchResult[] = [];
  let fallback: SearchResult[] = [];

  try {
    primary = await searchJikan(query, 6);
  } catch {
    primary = [];
  }

  if (primary.length < 3) {
    try {
      fallback = await searchAniList(query, 6);
    } catch {
      fallback = [];
    }
  }

  if (primary.length === 0 && fallback.length > 0) {
    return fallback;
  }

  const combined = [...primary, ...fallback];
  const map = new Map<string, SearchResult>();
  for (const item of combined) {
    const key = uniqueKey(item);
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values()).slice(0, 8);
}
