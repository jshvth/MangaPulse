# MangaPulse

MangaPulse is a KI-native web app for tracking manga collections and surfacing new releases on a 5-day cadence. It combines Jikan + AniList data, stores your library in Supabase, and surfaces new-volume signals in the UI.

**Docs**
- `docs/SETUP.md`
- `docs/DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`

**Features**
- Collection dashboard with progress tracking
- Search powered by Jikan + AniList
- Release history and notification flags
- Supabase Auth + Postgres persistence
- Edge Function release scan (cron)

**Data Sources**
- Jikan (MyAnimeList data)
- AniList GraphQL

**Tech Stack**
- Frontend: React (Vite) + TypeScript + Tailwind
- Backend: Supabase (Postgres + Auth)
- Automation: Supabase Edge Functions + pg_cron
- MCP: Local MCP server for DB + API tools

**Repo Structure**
- `frontend/` Vite React app
- `supabase/` migrations, functions, cron SQL
- `mcp-server/` local MCP server
- `docs/` project docs

**Quickstart**
1. Install deps
```bash
cd frontend
npm install
```
2. Create `frontend/.env.local`
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
3. Run the app
```bash
npm run dev
```

**Deploy**
See `docs/DEPLOYMENT.md` for Vercel + Supabase settings.
