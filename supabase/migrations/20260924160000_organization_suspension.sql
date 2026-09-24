-- Suspending an establishment from the Objely admin portal: nothing is deleted, access is cut until it is reactivated.
--
-- While suspended_at is set:
--   * its staff can no longer sign in (claim_membership) nor read or write anything (current_member_role → null,
--     which every row-level policy goes through);
--   * its bornes are refused by kiosk_lookup with 'organization_suspended' (P0001, not 28000): a borne keeps its
--     pairing and simply works again once the establishment is reactivated.
alter table public.organizations add column suspended_at timestamptz;

create or replace function public.current_member_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.members m
  join public.organizations o on o.id = m.organization_id
  where m.organization_id = p_org and m.user_id = auth.uid() and m.active and o.suspended_at is null
  limit 1
$$;

create or replace function public.claim_membership()
returns table (organization_id uuid, member_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null or v_email is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  update public.members m
     set user_id = auth.uid(), last_seen_at = now()
   where lower(m.email) = v_email
     and m.active
     and (m.user_id is null or m.user_id = auth.uid())
     and not exists (select 1 from public.organizations o where o.id = m.organization_id and o.suspended_at is not null)
  returning m.organization_id, m.id, m.role;
end;
$$;

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
  if v_kiosk.last_seen_at is null or v_kiosk.last_seen_at < now() - interval '1 minute' then
    update public.kiosks set last_seen_at = now() where id = v_kiosk.id;
  end if;
  return v_kiosk;
end;
$$;
revoke all on function public.kiosk_lookup(text) from public, anon, authenticated;
