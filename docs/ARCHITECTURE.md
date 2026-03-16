**Architecture**

MangaPulse uses a React frontend, Supabase for auth + storage, and a scheduled Edge Function for release checks.

**Data Model**
- `user_mangas` stores the user library
- `manga_releases` stores detected releases
- `notification_queue` stores pending notifications

**Data Sources**
- Jikan API (MyAnimeList) for volumes + MAL IDs
- AniList GraphQL for fallback volumes + metadata

**Release Flow**
1. Cron triggers `release-check` every 3 days
2. Function reads all `user_mangas`
3. Jikan + AniList are queried and merged
4. New releases are inserted into `manga_releases`
5. `needs_notification` is set when a new volume is found

**Cron Logic**
- `pg_cron` runs at `0 9 */3 * *` (09:00 UTC every 3 days)
- The Edge Function also enforces `MIN_DAYS_BETWEEN_CHECKS` to prevent accidental re-runs
- `last_checked_at` is updated per manga after each scan

**Frontend Flow**
- Collection page loads from `user_mangas`
- Detail page pulls recent `manga_releases`
- Auth handled via Supabase Auth

**Directories**
- `frontend/` UI and client logic
- `supabase/` migrations and edge functions
- `mcp-server/` local tools for DB + API workflows
