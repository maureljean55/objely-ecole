-- Lets a staff member of a suspended establishment learn *why* they are locked out, so objely-ecole-admin can say
-- "Établissement suspendu" instead of "account not attached to any establishment" or an empty dashboard.
-- A suspended member can read nothing else (current_member_role is null), so this only returns the establishment's
-- name and the suspension date, for the caller's own active memberships.
create or replace function public.my_organization_suspension()
returns table (organization_name text, suspended_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, o.suspended_at
    from public.members m
    join public.organizations o on o.id = m.organization_id
   where m.active
     and o.suspended_at is not null
     and (m.user_id = auth.uid() or (m.user_id is null and lower(m.email) = lower(auth.jwt() ->> 'email')))
   order by o.suspended_at desc
   limit 1
$$;
revoke all on function public.my_organization_suspension() from public, anon;
grant execute on function public.my_organization_suspension() to authenticated;
