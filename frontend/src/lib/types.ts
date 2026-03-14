export type MangaEntry = {
  id: string;
  malId: number | null;
  source: "jikan" | "anilist";
  sourceId: string;
  title: string;
  image: string | null;
  url: string | null;
  totalVolumes: number | null;
  ownedVolumes: number;
  needsNotification: boolean;
  status: "reading" | "completed" | "paused" | "planned";
  lastUpdated: string;
};

export type SearchResult = {
  source: "jikan" | "anilist";
  sourceId: string;
  malId: number | null;
  title: string;
  image: string | null;
  url: string | null;
  totalVolumes: number | null;
};
