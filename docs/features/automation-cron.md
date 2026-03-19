**Automation (Cron + Edge Function)**

**Scope**
- Automated release checks on a schedule

**Current State**
- `pg_cron` runs every 3 days.
- Edge Function `release-check`:
  - pulls all `user_mangas`
  - checks Jikan/AniList/Google Books
  - stores new `manga_releases`
  - flags `needs_notification`

**Key Files**
- `supabase/functions/release-check/index.ts`
- `supabase/cron/release_check.sql`

**Limitations**
- API coverage for per-volume dates is incomplete.
- Some APIs have rate limits.

**Next Steps**
- Add monitoring/logging for failed scans.
- Make scan interval user-configurable (optional).
