ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_time TIME;