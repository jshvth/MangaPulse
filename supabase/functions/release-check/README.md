# release-check

Edge Function fuer den 5-Tage-Release-Check.

## Env Variablen

Pflicht:
- `MP_SUPABASE_URL`
- `MP_SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `JIKAN_BASE_URL` (Default: https://api.jikan.moe/v4)
- `JIKAN_DELAY_MS` (Default: 500)
- `RESEND_API_KEY` (aktiviert E-Mail Versand)
- `RESEND_FROM_EMAIL` (z.B. "MangaPulse <noreply@deinedomain.de>")
- `RESEND_BASE_URL` (Default: https://api.resend.com)
- `NOTIFICATION_BATCH_LIMIT` (Default: 200)

## Ablauf

1. Titel aus `user_mangas` laden.
2. Jikan API abfragen (mal_id oder Title Search).
3. Neue Baende in `manga_releases` speichern.
4. Eintraege in `notification_queue` erzeugen.
5. Optional: E-Mails via Resend senden.
