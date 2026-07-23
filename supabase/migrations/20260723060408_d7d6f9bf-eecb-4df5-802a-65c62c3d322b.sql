
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove previous schedule if any, then schedule hourly reminder run
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
    url := 'https://project--7291a697-8c62-442f-9390-faaaeffe7611.lovable.app/api/public/hooks/reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
