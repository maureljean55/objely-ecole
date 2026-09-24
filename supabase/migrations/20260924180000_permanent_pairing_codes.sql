-- Pairing codes become permanent: each borne keeps one code (#A7K9Q2) that never expires and stays valid after
-- pairing, so a borne that was reset can be paired again with the same code. An administrator can change it at any
-- time, either to a new random code or to a code of their choice.
--
-- Pairing again with the code gives the borne a new token: the tablet previously paired with it is sent back to its
-- code screen. Guessing stays impractical: 36^6 combinations and 30 attempts per 10 minutes across the platform.

alter table public.kiosks alter column pairing_expires_at drop default;
update public.kiosks set pairing_expires_at = null;

alter table public.kiosk_pairing_codes alter column expires_at drop not null;
update public.kiosk_pairing_codes set expires_at = null where replaced_at is null;

-- Bornes paired before this change had their code cleared at pairing: give them back their last code, or a new one
-- if another borne has taken it since.
do $$
declare
  k record;
  v_code text;
begin
  for k in select * from public.kiosks where pairing_code is null loop
    select c.code into v_code
      from public.kiosk_pairing_codes c
     where c.kiosk_id = k.id
       and not exists (select 1 from public.kiosks o where o.pairing_code = c.code)
     order by c.created_at desc
     limit 1;
    if v_code is null then
      loop
        v_code := public.new_pairing_code();
        exit when not exists (select 1 from public.kiosks o where o.pairing_code = v_code);
      end loop;
      insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, expires_at)
      values (k.organization_id, k.id, k.name, v_code, null);
    else
      update public.kiosk_pairing_codes set expires_at = null, replaced_at = null where kiosk_id = k.id and code = v_code;
    end if;
    update public.kiosks set pairing_code = v_code where id = k.id;
    v_code := null;
  end loop;
end;
$$;

-- The code a borne is created with: no expiry any more.
create or replace function public.record_pairing_code() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.pairing_code is not null then
    insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, created_by, created_by_name, expires_at)
    values (
      new.organization_id, new.id, new.name, new.pairing_code, auth.uid(),
      (select m.full_name from public.members m where m.organization_id = new.organization_id and m.user_id = auth.uid() limit 1),
      null
    );
  end if;
  return new;
end;
$$;

-- Replaces the borne's code (the old one stops working and is kept in the history, marked replaced).
create or replace function public.replace_kiosk_pairing_code(v_kiosk public.kiosks, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.kiosks set pairing_code = p_code, pairing_expires_at = null where id = v_kiosk.id;
  update public.kiosk_pairing_codes set replaced_at = now() where kiosk_id = v_kiosk.id and replaced_at is null;
  insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, created_by, created_by_name, expires_at)
  values (
    v_kiosk.organization_id, v_kiosk.id, v_kiosk.name, p_code, auth.uid(),
    (select m.full_name from public.members m where m.organization_id = v_kiosk.organization_id and m.user_id = auth.uid() limit 1),
    null
  );
  perform public.log_audit(v_kiosk.organization_id, 'kiosk.code', 'Code d''appairage modifié : ' || v_kiosk.name);
  return p_code;
end;
$$;
revoke all on function public.replace_kiosk_pairing_code(public.kiosks, text) from public, anon, authenticated;

-- A new random code. Allowed on a paired borne too now.
create or replace function public.regenerate_kiosk_pairing_code(p_kiosk_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
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
  for i in 1..5 loop
    begin
      return public.replace_kiosk_pairing_code(v_kiosk, public.new_pairing_code());
    exception when unique_violation then
      null;
    end;
  end loop;
  raise exception 'code_unavailable' using errcode = 'P0001';
end;
$$;
revoke all on function public.regenerate_kiosk_pairing_code(uuid) from public, anon;
grant execute on function public.regenerate_kiosk_pairing_code(uuid) to authenticated;

-- A code chosen by the administrator: 6 letters or digits, typed with or without the "#", any case.
create or replace function public.set_kiosk_pairing_code(p_kiosk_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosk public.kiosks;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[\s#]', '', 'g'));
begin
  if v_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'invalid_code_format' using errcode = '22023';
  end if;
  select * into v_kiosk from public.kiosks where id = p_kiosk_id for update;
  if not found then
    raise exception 'kiosk_not_found' using errcode = 'P0002';
  end if;
  if not public.is_org_admin(v_kiosk.organization_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_kiosk.pairing_code = v_code then
    return v_code;
  end if;
  begin
    return public.replace_kiosk_pairing_code(v_kiosk, v_code);
  exception when unique_violation then
    raise exception 'code_taken' using errcode = 'P0001';
  end;
end;
$$;
revoke all on function public.set_kiosk_pairing_code(uuid, text) from public, anon;
grant execute on function public.set_kiosk_pairing_code(uuid, text) to authenticated;

-- Pairing no longer consumes the code nor checks an expiry.
create or replace function public.pair_kiosk(p_code text)
returns table (token text, kiosk_name text, school_name text, school_type text, help_desk text, idle_seconds integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks;
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[\s#]', '', 'g'));
begin
  if (select count(*) from public.kiosk_pairing_attempts where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.kiosk_pairing_attempts default values;
  delete from public.kiosk_pairing_attempts where created_at < now() - interval '1 day';

  select * into v_kiosk from public.kiosks where pairing_code = v_code for update;
  if not found then
    raise exception 'invalid_code' using errcode = '28000';
  end if;

  update public.kiosks
     set token_hash = encode(digest(v_token, 'sha256'), 'hex'), paired_at = now(), last_seen_at = now()
   where id = v_kiosk.id;
  update public.kiosk_pairing_codes set used_at = coalesce(used_at, now())
   where kiosk_id = v_kiosk.id and code = v_code and replaced_at is null;

  perform public.log_audit(
    v_kiosk.organization_id, 'kiosk.pair',
    case when v_kiosk.paired_at is null then 'Borne appairée : ' else 'Borne appairée à nouveau : ' end || v_kiosk.name,
    v_kiosk.name
  );

  return query
    select v_token, v_kiosk.name, o.name, o.type, o.help_desk, o.idle_seconds
      from public.organizations o where o.id = v_kiosk.organization_id;
end;
$$;
revoke all on function public.pair_kiosk(text) from public;
grant execute on function public.pair_kiosk(text) to anon, authenticated;
