# MangaPulse

MangaPulse is a KI-native web app for tracking manga collections and surfacing new releases on a 3‑day cadence. It blends Jikan + AniList data, stores your library in Supabase, and highlights new-volume signals directly in the UI.

**Quick Links**
- `docs/SETUP.md` (local setup)
- `docs/DEPLOYMENT.md` (Vercel + Supabase)
- `docs/ARCHITECTURE.md` (system overview)
- `docs/STATUS.md` (what’s done, blockers, alternatives)
- `docs/features/README.md` (feature index)

**Core Features**
- Collection dashboard with progress tracking and status
- Jikan + AniList search with fallback logic
- Release history, upcoming entries, and Pulse notifications
- Supabase Auth + Postgres persistence
- Edge Function release scan (cron)
- Community profiles + follow system
- Public profile view with read‑only collection preview (signed‑in users)
- OpenStreetMap + Overpass bookstore lookup (no paid API key)

**Data Sources**
- Jikan (MyAnimeList data)
- AniList GraphQL
- Google Books (optional release dates)
- OpenStreetMap + Overpass (bookstores)

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
VITE_SITE_URL=http://localhost:5173
```
3. Run the app
```bash
npm run dev
```

**Test Emails (Ethereal)**
```bash
cd mcp-server
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
npm run send:ethereal
```

**Deploy**
See `docs/DEPLOYMENT.md` for Vercel + Supabase settings.

**Hosting**
- Vercel (frontend)
