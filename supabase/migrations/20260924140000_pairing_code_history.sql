-- Every pairing code ever issued is kept: who created it, for which borne, when it expires, and whether it was used.
-- (kiosks.pairing_code only holds the code while it is waiting to be used, and is cleared at pairing.)
create table public.kiosk_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- The borne can be deleted later: keep the code's history with the borne's name at the time.
  kiosk_id uuid references public.kiosks (id) on delete set null,
  kiosk_name text not null,
  code text not null check (code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  expires_at timestamptz not null,
  used_at timestamptz,
  -- Set when a newer code was issued for the same borne, or the borne was deleted before using it.
  replaced_at timestamptz
);
create index kiosk_pairing_codes_org_idx on public.kiosk_pairing_codes (organization_id, created_at desc);
create index kiosk_pairing_codes_kiosk_idx on public.kiosk_pairing_codes (kiosk_id);

alter table public.kiosk_pairing_codes enable row level security;
-- New tables get default grants: take them away, then give staff read access only. Codes are written by the functions below.
revoke all on public.kiosk_pairing_codes from anon, authenticated;
grant select on public.kiosk_pairing_codes to authenticated;
create policy kiosk_pairing_codes_select on public.kiosk_pairing_codes for select to authenticated using (public.is_member(organization_id));

-- Records the code a borne is created with.
create or replace function public.record_pairing_code() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.pairing_code is not null then
    insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, created_by, created_by_name, expires_at)
    values (
      new.organization_id, new.id, new.name, new.pairing_code, auth.uid(),
      (select m.full_name from public.members m where m.organization_id = new.organization_id and m.user_id = auth.uid() limit 1),
      coalesce(new.pairing_expires_at, now() + interval '48 hours')
    );
  end if;
  return new;
end;
$$;
create trigger kiosks_record_code after insert on public.kiosks for each row execute function public.record_pairing_code();

-- A borne deleted before it was paired cancels its waiting code.
create or replace function public.cancel_pairing_codes() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.kiosk_pairing_codes set replaced_at = now() where kiosk_id = old.id and used_at is null and replaced_at is null;
  return old;
end;
$$;
create trigger kiosks_cancel_codes before delete on public.kiosks for each row execute function public.cancel_pairing_codes();

-- A new code replaces the previous one (which is kept, marked replaced).
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

  for i in 1..5 loop
    v_code := public.new_pairing_code();
    begin
      update public.kiosks set pairing_code = v_code, pairing_expires_at = now() + interval '48 hours' where id = p_kiosk_id;
      update public.kiosk_pairing_codes set replaced_at = now() where kiosk_id = p_kiosk_id and used_at is null and replaced_at is null;
      insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, created_by, created_by_name, expires_at)
      values (
        v_kiosk.organization_id, p_kiosk_id, v_kiosk.name, v_code, auth.uid(),
        (select m.full_name from public.members m where m.organization_id = v_kiosk.organization_id and m.user_id = auth.uid() limit 1),
        now() + interval '48 hours'
      );
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

-- Pairing marks the code as used.
create or replace function public.pair_kiosk(p_code text)
returns table (token text, kiosk_name text, school_name text, school_type text, help_desk text, idle_seconds integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks;
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_code text := upper(regexp_replace(btrim(coalesce(p_code, '')), '^#', ''));
begin
  if (select count(*) from public.kiosk_pairing_attempts where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.kiosk_pairing_attempts default values;
  delete from public.kiosk_pairing_attempts where created_at < now() - interval '1 day';

  select * into v_kiosk from public.kiosks
   where pairing_code = v_code and paired_at is null and pairing_expires_at > now()
   for update;
  if not found then
    raise exception 'invalid_code' using errcode = '28000';
  end if;

  update public.kiosks
     set token_hash = encode(digest(v_token, 'sha256'), 'hex'),
         paired_at = now(), last_seen_at = now(), pairing_code = null, pairing_expires_at = null
   where id = v_kiosk.id;
  update public.kiosk_pairing_codes set used_at = now()
   where kiosk_id = v_kiosk.id and code = v_code and used_at is null and replaced_at is null;

  perform public.log_audit(v_kiosk.organization_id, 'kiosk.pair', 'Borne appairée : ' || v_kiosk.name, v_kiosk.name);

  return query
    select v_token, v_kiosk.name, o.name, o.type, o.help_desk, o.idle_seconds
      from public.organizations o where o.id = v_kiosk.organization_id;
end;
$$;
revoke all on function public.pair_kiosk(text) from public;
grant execute on function public.pair_kiosk(text) to anon, authenticated;

-- Codes that already exist at the time of this migration.
insert into public.kiosk_pairing_codes (organization_id, kiosk_id, kiosk_name, code, created_at, expires_at)
select k.organization_id, k.id, k.name, k.pairing_code, k.created_at, coalesce(k.pairing_expires_at, k.created_at + interval '48 hours')
from public.kiosks k where k.pairing_code is not null;
