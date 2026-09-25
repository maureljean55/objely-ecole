-- The borne reacts at once when it is paused / resumed by its establishment, or when Objely suspends / reactivates the
-- establishment: the database sends a Realtime broadcast "check" on the topic kiosk:<kiosk id>, and the borne re-reads
-- its state through kiosk_config right away (instead of waiting for its next check, at most a minute later).
--
-- The broadcast carries no decision, only "check now": the borne always asks the database what its state is. A forged
-- broadcast can therefore do nothing but trigger a useless check. The kiosk id is not a secret (it is not the token).

-- Which topic a borne listens to. Works even while paused or suspended, so a borne reloaded in that state still hears
-- when it is resumed.
create or replace function public.kiosk_channel(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_token is null or char_length(p_token) < 20 then
    raise exception 'invalid_kiosk' using errcode = '28000';
  end if;
  select id into v_id from public.kiosks where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if v_id is null then
    raise exception 'invalid_kiosk' using errcode = '28000';
  end if;
  return v_id;
end;
$$;
revoke all on function public.kiosk_channel(text) from public;
grant execute on function public.kiosk_channel(text) to anon, authenticated;

-- Never lets a Realtime problem block the pause / suspension itself.
create or replace function public.nudge_kiosk(p_kiosk uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(jsonb_build_object('at', now()), 'check', 'kiosk:' || p_kiosk::text, false);
exception when others then
  null;
end;
$$;
revoke all on function public.nudge_kiosk(uuid) from public, anon, authenticated;

create or replace function public.kiosks_nudge_on_pause() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.paused_at is distinct from old.paused_at then
    perform public.nudge_kiosk(new.id);
  end if;
  return new;
end;
$$;
create trigger kiosks_nudge_on_pause after update of paused_at on public.kiosks
  for each row execute function public.kiosks_nudge_on_pause();

create or replace function public.organizations_nudge_on_suspension() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_kiosk uuid;
begin
  if new.suspended_at is distinct from old.suspended_at then
    for v_kiosk in select id from public.kiosks where organization_id = new.id loop
      perform public.nudge_kiosk(v_kiosk);
    end loop;
  end if;
  return new;
end;
$$;
create trigger organizations_nudge_on_suspension after update of suspended_at on public.organizations
  for each row execute function public.organizations_nudge_on_suspension();
