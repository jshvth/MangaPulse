**Architecture**

MangaPulse uses a React frontend, Supabase for auth + storage, and a scheduled Edge Function for release checks.

**Data Model**
- `user_mangas` stores the user library
- `manga_releases` stores detected releases
- `notification_queue` stores pending notifications

**Release Flow**
1. Cron triggers `release-check` every 5 days
2. Function reads all `user_mangas`
3. Jikan + AniList are queried and merged
4. New releases are inserted into `manga_releases`
5. `needs_notification` is set when a new volume is found

**Frontend Flow**
- Collection page loads from `user_mangas`
- Detail page pulls recent `manga_releases`
- Auth handled via Supabase Auth

**Directories**
- `frontend/` UI and client logic
- `supabase/` migrations and edge functions
- `mcp-server/` local tools for DB + API workflows
