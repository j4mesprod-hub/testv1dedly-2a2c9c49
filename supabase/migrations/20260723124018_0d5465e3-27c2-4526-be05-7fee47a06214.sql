
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  code TEXT NOT NULL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  telegram_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes')
);
GRANT ALL ON public.telegram_link_codes TO service_role;
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
-- No policies: service_role only (used by server-side code and webhook).
