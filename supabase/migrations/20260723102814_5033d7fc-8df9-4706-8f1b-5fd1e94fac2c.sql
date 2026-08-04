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
    url := coalesce(current_setting('app.reminders_hook_url', true), ''),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
