
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.send_birthday_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member RECORD;
  admin_user RECORD;
  days_until INT;
  next_bday DATE;
  notif_title TEXT;
  notif_link TEXT;
BEGIN
  FOR member IN
    SELECT id, full_name, username, birthday FROM public.profiles WHERE birthday IS NOT NULL
  LOOP
    next_bday := make_date(
      EXTRACT(YEAR FROM CURRENT_DATE)::INT,
      EXTRACT(MONTH FROM member.birthday)::INT,
      EXTRACT(DAY FROM member.birthday)::INT
    );
    IF next_bday < CURRENT_DATE THEN
      next_bday := next_bday + INTERVAL '1 year';
    END IF;
    days_until := (next_bday - CURRENT_DATE);

    IF days_until BETWEEN 0 AND 7 THEN
      notif_title := COALESCE(member.full_name, member.username) ||
        CASE WHEN days_until = 0 THEN ' has a birthday today!' 
             WHEN days_until = 1 THEN ' has a birthday tomorrow' 
             ELSE ' has a birthday in ' || days_until || ' days' END;
      notif_link := '/app/admin';

      FOR admin_user IN
        SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
      LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.notifications
          WHERE user_id = admin_user.user_id
            AND kind = 'birthday'
            AND title = notif_title
            AND created_at::date = CURRENT_DATE
        ) THEN
          INSERT INTO public.notifications (user_id, kind, title, body, link)
          VALUES (admin_user.user_id, 'birthday', notif_title,
                  'Upcoming birthday reminder', notif_link);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Schedule daily at 08:00 UTC
SELECT cron.unschedule('birthday-reminders-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'birthday-reminders-daily'
);

SELECT cron.schedule(
  'birthday-reminders-daily',
  '0 8 * * *',
  $$ SELECT public.send_birthday_reminders(); $$
);
