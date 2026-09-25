-- How many bornes an establishment may have, set by Objely from its admin portal (objely-admin).
-- null = no limit. The establishment's own staff can read it but not change it (it is not in their update grant).
-- Enforced here, not only in the interface: adding a borne beyond the limit is refused with 'kiosk_limit_reached'.
-- Lowering the limit below the current number keeps the existing bornes; it only blocks new ones.
alter table public.organizations
  add column max_kiosks integer check (max_kiosks is null or max_kiosks between 0 and 1000);

create or replace function public.enforce_kiosk_limit() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
begin
  -- Lock the establishment so two bornes added at the same time cannot both slip under the limit.
  select max_kiosks into v_max from public.organizations where id = new.organization_id for update;
  if v_max is not null and (select count(*) from public.kiosks where organization_id = new.organization_id) >= v_max then
    raise exception 'kiosk_limit_reached' using errcode = 'P0001', detail = v_max::text;
  end if;
  return new;
end;
$$;
create trigger kiosks_enforce_limit before insert on public.kiosks for each row execute function public.enforce_kiosk_limit();
