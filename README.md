# MangaPulse

MangaPulse ist eine KI-native Web-App, mit der Nutzer ihre Manga-Baende verwalten und automatisch ueber neue Releases informiert werden.

## Struktur

- `frontend/` React (Vite) + TypeScript + Tailwind
- `supabase/` Edge Functions und SQL-Migrationen
- `mcp-server/` Eigener MCP-Server fuer KI-Tools

## Naechste Schritte

1. Frontend starten (`npm run dev` in `frontend/`).
2. Supabase Projekt anbinden und das Schema definieren.
3. Edge Function fuer Release-Checks implementieren.
4. MCP-Server mit Tools ausstatten.
