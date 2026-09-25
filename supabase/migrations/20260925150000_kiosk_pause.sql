-- An establishment can pause one of its own bornes (and resume it), without deleting it or losing its pairing.
-- While paused the borne shows a "borne en pause" screen and every kiosk_* call is refused with 'kiosk_paused'
-- (P0001, not 28000: the borne keeps its pairing and comes back by itself once resumed).
-- Different from the establishment-wide suspension, which only Objely can set.
alter table public.kiosks add column paused_at timestamptz;

create or replace function public.kiosk_lookup(p_token text)
returns public.kiosks
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks;
begin
  if p_token is null or char_length(p_token) < 20 then
    raise exception 'invalid_kiosk' using errcode = '28000';
  end if;
  select * into v_kiosk from public.kiosks
   where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if not found then
    raise exception 'invalid_kiosk' using errcode = '28000';
  end if;
  if exists (select 1 from public.organizations where id = v_kiosk.organization_id and suspended_at is not null) then
    raise exception 'organization_suspended' using errcode = 'P0001';
  end if;
  if v_kiosk.paused_at is not null then
    raise exception 'kiosk_paused' using errcode = 'P0001';
  end if;
  if v_kiosk.last_seen_at is null or v_kiosk.last_seen_at < now() - interval '1 minute' then
    update public.kiosks set last_seen_at = now() where id = v_kiosk.id;
  end if;
  return v_kiosk;
end;
$$;
revoke all on function public.kiosk_lookup(text) from public, anon, authenticated;

-- Pause / resume, by an administrator of the establishment.
create or replace function public.set_kiosk_paused(p_kiosk_id uuid, p_paused boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosk public.kiosks;
begin
  select * into v_kiosk from public.kiosks where id = p_kiosk_id for update;
  if not found then
    raise exception 'kiosk_not_found' using errcode = 'P0002';
  end if;
  if not public.is_org_admin(v_kiosk.organization_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (v_kiosk.paused_at is not null) = p_paused then
    return;
  end if;
  update public.kiosks set paused_at = case when p_paused then now() end where id = p_kiosk_id;
  perform public.log_audit(v_kiosk.organization_id, case when p_paused then 'kiosk.pause' else 'kiosk.resume' end,
    case when p_paused then 'Borne suspendue : ' else 'Borne réactivée : ' end || v_kiosk.name);
end;
$$;
revoke all on function public.set_kiosk_paused(uuid, boolean) from public, anon;
grant execute on function public.set_kiosk_paused(uuid, boolean) to authenticated;
