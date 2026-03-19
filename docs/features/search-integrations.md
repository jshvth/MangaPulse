**Search & Integrations**

**Scope**
- Search and enrich manga data
- Provide reliable fallback sources

**Current State**
- Primary search via **Jikan** (MyAnimeList).
- Fallback via **AniList** for missing results.
- Optional enrichment via **Google Books** for volume release dates.

**Key UI**
- Add manga flow in Collection uses Jikan/AniList.
- Detail page shows MAL stats (score, popularity) when available.

**APIs**
- Jikan API
- AniList GraphQL
- Google Books API (optional)

**Limitations**
- No API provides reliable per-volume release dates for all series.
- Matching can be imperfect for uncommon titles.

**Next Steps**
- Add ISBN matching where available.
- Improve fuzzy matching with language/region hints.
