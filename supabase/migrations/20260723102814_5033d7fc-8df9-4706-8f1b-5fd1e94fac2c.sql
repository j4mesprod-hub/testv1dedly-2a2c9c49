drop extension if exists pg_net cascade;
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule('deadly-reminders-hourly');
exception when others then null;
end $$;

select cron.schedule(
  'deadly-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://project--10c0b03e-5833-4c50-90ad-4680b5c5ae99-dev.lovable.app/api/public/hooks/reminders',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_7SsA2jDvZclvL9X61tA_RA_0-bL0eKm"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);