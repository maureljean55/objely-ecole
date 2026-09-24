-- A student gets 7 minutes (instead of 1 min 30) without touching the borne before it wipes the form.
-- New establishments start at 7 minutes; existing ones still on the old default move to 7 minutes too. An
-- establishment that chose its own value in its settings keeps it.
alter table public.organizations alter column idle_seconds set default 420;
update public.organizations set idle_seconds = 420 where idle_seconds = 90;
