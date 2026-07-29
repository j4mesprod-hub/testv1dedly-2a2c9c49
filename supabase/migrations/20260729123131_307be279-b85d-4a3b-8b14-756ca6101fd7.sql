ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS summary_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS summary_hour integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS summary_minute integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS summary_last_sent_on date;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_summary_hour_check,
  DROP CONSTRAINT IF EXISTS profiles_summary_minute_check,
  DROP CONSTRAINT IF EXISTS profiles_language_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_summary_hour_check CHECK (summary_hour >= 0 AND summary_hour <= 23),
  ADD CONSTRAINT profiles_summary_minute_check CHECK (summary_minute >= 0 AND summary_minute <= 59),
  ADD CONSTRAINT profiles_language_check CHECK (language IN ('fr','en'));