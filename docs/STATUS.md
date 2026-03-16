**Project Status**

This document summarizes what is implemented, what is not fully working yet (and why), plus the alternatives currently in place.

**Working (Implemented)**
- Auth with Supabase (sign up, sign in, sign out)
- Persistent user collection stored in `user_mangas`
- Search via Jikan + AniList fallback
- Manga detail page with progress, status, and Amazon link
- Release history view (last 10 entries from `manga_releases`)
- 3-day cron release scan (`pg_cron` + Edge Function)
- Automated notifications in-app via **Pulse** badge + dropdown
- New release flags via `needs_notification`
- Manual upcoming release entry (volume + date)
- Automated release date discovery via Google Books (optional)
- Location search UI (Google Places integration ready)

**Not Fully Working Yet (and Why)**
- **Email notifications**
  - Why: Resend requires a verified domain for reliable sending.
  - Current status: API integration exists in the Edge Function, but we are not using it without a verified domain.
- **Automatic volume release dates from anime/manga APIs**
  - Why: Jikan/AniList do not provide consistent **per-volume release dates**.
  - Current status: We use Google Books as an optional alternative and allow manual entry.
- **Google Places live search**
  - Why: Requires a Google Maps API key with billing enabled.
  - Current status: Feature is implemented, but won’t work until `VITE_GOOGLE_PLACES_KEY` is set.

**Alternatives Implemented**
- **Email → In-app notifications**
  - Instead of email, the UI shows a “Pulse” badge + notification panel.
  - Fully automated: cron scan sets `needs_notification` and the UI displays it.
- **Missing release dates → Google Books + manual entry**
  - Google Books is used to infer release dates (optional API key).
  - Manual entry on the detail page lets us cover missing data.
- **Location feature blocked by key → fallback link**
  - If key is missing, the UI still offers a Google Maps search link.

**Current Automation Pipeline (End-to-End)**
1. Cron runs every 3 days.
2. Edge Function scans `user_mangas`.
3. Jikan + AniList update volumes.
4. Google Books checks for upcoming release dates (optional).
5. New releases update `manga_releases`.
6. `needs_notification` is set.
7. Pulse shows notifications in the UI.
8. When release date is due, `needs_notification` is set again.

**Known Limitations**
- Google Books matching is heuristic and may miss or mis-match some volumes.
- Release dates can be incomplete or only month/year; we convert to a full date.
- Without Google Places key, the “Use my location” button cannot query stores.

**Next Steps (If Needed)**
- Verify a domain to enable Resend email delivery.
- Add smarter Google Books matching (ISBN or exact volume naming).
- Add a dedicated “Upcoming Releases” section in the Collection page.
- Add “Mark as read” / “Clear notifications” for Pulse.
