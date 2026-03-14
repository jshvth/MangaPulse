import type { SearchResult } from "./types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: MANGA, sort: [SEARCH_MATCH]) {
        id
        idMal
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        siteUrl
        volumes
      }
    }
  }
`;

export async function searchAniList(query: string, limit = 6): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, perPage: limit },
    }),
  });

  if (!res.ok) {
    throw new Error("AniList request failed");
  }

  const body = await res.json();
  const media = body?.data?.Page?.media ?? [];
  return media.map((item: any) => ({
    source: "anilist",
    sourceId: String(item.id),
    malId: item.idMal ?? null,
    title: item.title?.english ?? item.title?.romaji ?? "Untitled",
    image: item.coverImage?.large ?? null,
    url: item.siteUrl ?? null,
    totalVolumes: item.volumes ?? null,
  }));
}
