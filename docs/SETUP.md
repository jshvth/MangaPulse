**Setup**

This doc covers local development for the frontend and Supabase resources.

**Prerequisites**
- Node.js 18+
- npm
- Supabase project (cloud)
- Optional: Supabase CLI

**Frontend**
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
3. Run dev server
```bash
npm run dev
```

**Supabase (cloud)**
1. Apply migrations
```bash
supabase db push
```
2. Deploy edge function
```bash
supabase functions deploy release-check
```
3. Run cron schedule SQL
```bash
psql "<your-connection-string>" -f supabase/cron/release_check.sql
```

**MCP Server (optional)**
1. Install deps
```bash
cd mcp-server
npm install
```
2. Build and run
```bash
npm run build
node dist/index.js
```
