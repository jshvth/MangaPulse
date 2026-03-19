**Deployment**

This project is designed for Vercel (frontend) + Supabase (backend).

**Related Feature Docs**
- `docs/features/README.md`

**Vercel**
- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

**Vercel Environment Variables**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- No API key required for the OpenStreetMap bookstore search
- `VITE_SITE_URL` (your Vercel URL, used for auth email redirects)

After setting variables, trigger a new deploy.

**Supabase**
- Migrations live in `supabase/migrations/`
- Edge function lives in `supabase/functions/release-check/`
- Cron schedule SQL in `supabase/cron/release_check.sql`
- Data sources: Jikan + AniList
- Optional: `GOOGLE_BOOKS_API_KEY` (release date lookup)
 - Auth: add your Vercel URL to **Redirect URLs** in Supabase Auth settings

**Notes**
- The frontend expects Supabase auth to be enabled.
- Release scans run on the cron schedule and populate `manga_releases`.
- The function enforces `MIN_DAYS_BETWEEN_CHECKS` to avoid accidental re-runs.
