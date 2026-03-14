-- Schedule the release-check Edge Function every 5 days.
-- Replace placeholders before running.

-- 1) Store secrets in Vault (you can also do this via the Dashboard UI)
select vault.create_secret('https://PROJECT_REF.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');

-- 2) Schedule the job (runs at 09:00 UTC every 5 days)
select
  cron.schedule(
    'release-check-every-5-days',
    '0 9 */5 * *',
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/release-check',
          headers:=jsonb_build_object(
            'Content-type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
          ),
          body:=concat('{"invoked_at": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
