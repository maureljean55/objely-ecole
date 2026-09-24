-- "Suivre ma déclaration" on the borne: a student types the reference on their ticket (DEC-1042) and their last name,
-- and sees where their declaration stands.
--
-- References are sequential, so the last name is asked too: without it, anyone could read through DEC-1001, 1002…
-- Even then, nothing personal is returned (no first name, class, phone): only the object, the stage and dates.
-- Attempts are capped per borne to keep guessing impractical.
create table public.declaration_lookup_attempts (
  id bigint generated always as identity primary key,
  kiosk_id uuid not null references public.kiosks (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index declaration_lookup_attempts_kiosk_idx on public.declaration_lookup_attempts (kiosk_id, created_at desc);
alter table public.declaration_lookup_attempts enable row level security;
revoke all on public.declaration_lookup_attempts from anon, authenticated;

-- Case- and accent-insensitive comparison of names ("Élodie" = "elodie").
create or replace function public.fold_name(p text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(lower(btrim(coalesce(p, ''))), 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa'),
    '[^a-z0-9]', '', 'g'
  )
$$;

-- stage:
--   perdu  : searching (recherche en cours) · match (un objet correspond) · returned (objet rendu) · closed
--   trouve : to_deposit (à déposer) · deposited (enregistré à la vie scolaire) · returned (rendu à son propriétaire)
--            · donated (donné après le délai) · closed
create or replace function public.kiosk_track_declaration(p_token text, p_ref text, p_last_name text)
returns table (ref text, kind text, object_name text, stage text, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_ref text := 'DEC-' || regexp_replace(upper(coalesce(p_ref, '')), '[^0-9]', '', 'g');
  v_decl public.declarations;
  v_object public.objects;
  v_returned_at timestamptz;
  v_stage text;
begin
  if (select count(*) from public.declaration_lookup_attempts a
       where a.kiosk_id = v_kiosk.id and a.created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.declaration_lookup_attempts (kiosk_id) values (v_kiosk.id);
  delete from public.declaration_lookup_attempts a where a.created_at < now() - interval '1 day';

  select * into v_decl from public.declarations d
   where d.organization_id = v_kiosk.organization_id
     and d.ref = v_ref
     and public.fold_name(d.nom) = public.fold_name(p_last_name)
     and public.fold_name(p_last_name) <> '';
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if v_decl.object_id is not null then
    select * into v_object from public.objects o where o.id = v_decl.object_id;
  end if;
  select max(r.done_at) into v_returned_at from public.restitutions r
   where r.declaration_id = v_decl.id or (v_object.id is not null and r.object_id = v_object.id);

  if v_decl.kind = 'perdu' then
    v_stage := case
      when v_returned_at is not null then 'returned'
      when v_decl.status = 'correspondance' then 'match'
      when v_decl.status = 'ouverte' then 'searching'
      else 'closed'
    end;
  else
    v_stage := case
      when v_returned_at is not null or v_object.status = 'restitue' then 'returned'
      when v_object.status = 'a_donner' then 'donated'
      when v_object.status = 'en_stock' then 'deposited'
      when v_decl.status = 'ouverte' then 'to_deposit'
      when v_decl.status = 'correspondance' then 'deposited'
      else 'closed'
    end;
  end if;

  return query select v_decl.ref, v_decl.kind, v_decl.object_name, v_stage, v_decl.created_at,
    coalesce(v_returned_at, v_object.updated_at, v_decl.created_at);
end;
$$;
revoke all on function public.kiosk_track_declaration(text, text, text) from public;
grant execute on function public.kiosk_track_declaration(text, text, text) to anon, authenticated;
