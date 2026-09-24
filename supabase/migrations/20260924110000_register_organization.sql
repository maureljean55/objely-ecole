-- Registering an establishment from the Objely platform admin portal.
--
-- The portal (service role) first creates the establishment's Supabase Auth user with a generated password,
-- then calls register_organization() with that user's id: one transaction that creates the establishment
-- and its administrator membership. The administrator can then sign in to the school admin right away.

-- Same name in two different cities is fine; the exact same name + city is a duplicate.
create unique index organizations_name_city_key
  on public.organizations (lower(btrim(name)), lower(coalesce(city, '')));

create or replace function public.register_organization(
  p_name text,
  p_type text,
  p_city text,
  p_address text,
  p_phone text,
  p_contact_email text,
  p_retention_days integer,
  p_help_desk text,
  p_admin_name text,
  p_admin_email text,
  p_admin_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_email text := lower(btrim(p_admin_email));
begin
  if nullif(btrim(p_name), '') is null or nullif(btrim(p_admin_name), '') is null or nullif(v_email, '') is null then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if p_admin_user_id is null then
    raise exception 'missing_admin_user' using errcode = '22023';
  end if;

  insert into public.organizations (name, type, city, address, phone, contact_email, retention_days, help_desk)
  values (
    btrim(p_name),
    p_type,
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(lower(btrim(coalesce(p_contact_email, ''))), ''),
    coalesce(p_retention_days, 60),
    nullif(btrim(coalesce(p_help_desk, '')), '')
  )
  returning id into v_org;

  -- user_id is set right away: the account already exists, no claim_membership() step is needed.
  insert into public.members (organization_id, user_id, email, full_name, role)
  values (v_org, p_admin_user_id, v_email, btrim(p_admin_name), 'admin');

  return v_org;
end;
$$;
revoke all on function public.register_organization(text, text, text, text, text, text, integer, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.register_organization(text, text, text, text, text, text, integer, text, text, text, uuid) to service_role;
