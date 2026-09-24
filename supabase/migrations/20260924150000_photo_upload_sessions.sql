-- Photos from a visitor's phone to the borne they are standing at.
--
-- The borne opens a "photo session" (20 minutes) and shows its id in a QR code. The visitor's phone opens the link,
-- with no account, and uploads up to 3 photos into that session; the borne collects them while the visitor is still in front of it.
-- The id is a random UUID (128 bits): possessing it is the permission, like a private share link, and it dies with the session.
-- Only a borne with a valid token can open a session, so the number of sessions (and of photos) is bounded by the bornes.
create table public.photo_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kiosk_id uuid not null references public.kiosks (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '20 minutes',
  -- Set when the phone first opens the link: the borne can then say "phone connected".
  opened_at timestamptz
);
create index photo_upload_sessions_kiosk_idx on public.photo_upload_sessions (kiosk_id, created_at desc);

create table public.photo_upload_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.photo_upload_sessions (id) on delete cascade,
  position smallint not null check (position between 0 and 2),
  -- Same limits as declaration photos. No SVG: an image data URL must never be able to carry a script.
  data text not null check (char_length(data) <= 400000 and data ~ '^data:image/(jpeg|png|webp);base64,'),
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

alter table public.photo_upload_sessions enable row level security;
alter table public.photo_upload_items enable row level security;
revoke all on public.photo_upload_sessions, public.photo_upload_items from anon, authenticated;
-- No policies on purpose: everything goes through the functions below.

-- ---------------------------------------------------------------------------
-- borne side
-- ---------------------------------------------------------------------------
create or replace function public.kiosk_create_photo_session(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_id uuid;
begin
  if (select count(*) from public.photo_upload_sessions where kiosk_id = v_kiosk.id and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  -- Housekeeping: old sessions (and their photos) are not kept.
  delete from public.photo_upload_sessions where kiosk_id = v_kiosk.id and expires_at < now() - interval '1 hour';

  insert into public.photo_upload_sessions (organization_id, kiosk_id) values (v_kiosk.organization_id, v_kiosk.id) returning id into v_id;
  return v_id;
end;
$$;

-- What the borne polls: has the phone connected, and which photos have arrived (ids only: they are large).
create or replace function public.kiosk_photo_session_status(p_token text, p_session uuid)
returns table (opened boolean, photo_ids uuid[])
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_session public.photo_upload_sessions;
begin
  select * into v_session from public.photo_upload_sessions where id = p_session and kiosk_id = v_kiosk.id and expires_at > now();
  if not found then
    raise exception 'invalid_session' using errcode = '28000';
  end if;
  return query
    select v_session.opened_at is not null,
           coalesce((select array_agg(i.id order by i.position) from public.photo_upload_items i where i.session_id = v_session.id), '{}');
end;
$$;

create or replace function public.kiosk_session_photo(p_token text, p_item uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_data text;
begin
  select i.data into v_data
    from public.photo_upload_items i
    join public.photo_upload_sessions s on s.id = i.session_id
   where i.id = p_item and s.kiosk_id = v_kiosk.id and s.expires_at > now();
  if v_data is null then
    raise exception 'invalid_session' using errcode = '28000';
  end if;
  return v_data;
end;
$$;

-- ---------------------------------------------------------------------------
-- phone side (anonymous: the session id is the permission)
-- ---------------------------------------------------------------------------
create or replace function public.phone_session_info(p_session uuid)
returns table (school_name text, station text, photo_count integer, max_photos integer, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.photo_upload_sessions s set opened_at = coalesce(s.opened_at, now()) where s.id = p_session and s.expires_at > now();
  if not found then
    raise exception 'invalid_session' using errcode = '28000';
  end if;
  return query
    select o.name, k.name,
           (select count(*)::int from public.photo_upload_items i where i.session_id = s.id),
           3, s.expires_at
      from public.photo_upload_sessions s
      join public.organizations o on o.id = s.organization_id
      join public.kiosks k on k.id = s.kiosk_id
     where s.id = p_session;
end;
$$;

create or replace function public.phone_upload_photo(p_session uuid, p_data text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.photo_upload_sessions;
  v_count integer;
begin
  if p_data is null or char_length(p_data) > 400000 or p_data !~ '^data:image/(jpeg|png|webp);base64,' then
    raise exception 'invalid_photo' using errcode = '22023';
  end if;

  select * into v_session from public.photo_upload_sessions where id = p_session and expires_at > now() for update;
  if not found then
    raise exception 'invalid_session' using errcode = '28000';
  end if;

  select count(*) into v_count from public.photo_upload_items where session_id = p_session;
  if v_count >= 3 then
    raise exception 'too_many_photos' using errcode = 'P0001';
  end if;

  insert into public.photo_upload_items (session_id, position, data) values (p_session, v_count, p_data);
  update public.photo_upload_sessions set opened_at = coalesce(opened_at, now()) where id = p_session;
  return v_count + 1;
end;
$$;

revoke all on function public.kiosk_create_photo_session(text), public.kiosk_photo_session_status(text, uuid), public.kiosk_session_photo(text, uuid),
                       public.phone_session_info(uuid), public.phone_upload_photo(uuid, text) from public;
grant execute on function public.kiosk_create_photo_session(text), public.kiosk_photo_session_status(text, uuid), public.kiosk_session_photo(text, uuid),
                          public.phone_session_info(uuid), public.phone_upload_photo(uuid, text) to anon, authenticated;
