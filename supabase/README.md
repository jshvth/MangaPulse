# Supabase Setup

## Voraussetzungen

1. Supabase Account + neues Projekt anlegen.
2. Projekt-Infos notieren:
   - Project URL (z.B. https://PROJECT_REF.supabase.co)
   - Anon Key
   - Service Role Key
   - Database URL (Postgres Connection String)

## CLI (lokal)

```bash
# 1) Supabase CLI installieren (falls noch nicht vorhanden)
# https://supabase.com/docs/guides/cli

# 2) Projekt verlinken
supabase link --project-ref PROJECT_REF

# 3) Migrationen pushen
supabase db push

# 4) Edge Function deployen
supabase functions deploy release-check

# 5) Secrets fuer Edge Function setzen
supabase secrets set \
  MP_SUPABASE_URL=https://PROJECT_REF.supabase.co \
  MP_SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Optional (E-Mail Notifications via Resend)
supabase secrets set \
  RESEND_API_KEY=YOUR_RESEND_KEY \
  RESEND_FROM_EMAIL='MangaPulse <noreply@deinedomain.de>'
```

## Cron Job (alle 5 Tage)

1. Stelle sicher, dass in der Datenbank die Extensions aktiviert sind:
   - `pg_cron`
   - `pg_net`
   - `supabase_vault`

2. Fuehre das SQL aus `supabase/cron/release_check.sql` aus und ersetze die Platzhalter.

