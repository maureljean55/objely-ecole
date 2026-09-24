-- A pairing code is valid 48 hours. When it expires (or is lost) an administrator asks for a new one.
-- The pairing columns are not directly writable by staff, so this goes through a function.
create or replace function public.regenerate_kiosk_pairing_code(p_kiosk_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks;
  v_code text;
begin
  select * into v_kiosk from public.kiosks where id = p_kiosk_id for update;
  if not found then
    raise exception 'kiosk_not_found' using errcode = 'P0002';
  end if;
  if not public.is_org_admin(v_kiosk.organization_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_kiosk.paired_at is not null then
    raise exception 'already_paired' using errcode = 'P0001';
  end if;

  -- The code is unique across kiosks: retry on the (very unlikely) collision.
  for i in 1..5 loop
    v_code := public.new_pairing_code();
    begin
      update public.kiosks set pairing_code = v_code, pairing_expires_at = now() + interval '48 hours' where id = p_kiosk_id;
      return v_code;
    exception when unique_violation then
      null;
    end;
  end loop;
  raise exception 'code_unavailable' using errcode = 'P0001';
end;
$$;
revoke all on function public.regenerate_kiosk_pairing_code(uuid) from public, anon;
grant execute on function public.regenerate_kiosk_pairing_code(uuid) to authenticated;
