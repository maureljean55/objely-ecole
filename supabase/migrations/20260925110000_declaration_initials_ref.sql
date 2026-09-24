-- Declaration references become "#" + initial of the last name + initial of the first name + 3 random digits:
-- Léa Dupont → #DL482. Easier to remember than DEC-1042, and not sequential any more.
-- References already issued (DEC-…) are kept as they are and can still be tracked.

create or replace function public.new_declaration_ref(p_org uuid, p_nom text, p_prenom text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_initials text := coalesce(nullif(left(public.fold_name(p_nom), 1), ''), 'x') || coalesce(nullif(left(public.fold_name(p_prenom), 1), ''), 'x');
  v_bytes bytea;
  v_ref text;
begin
  v_initials := upper(v_initials);
  -- 1 000 combinations per pair of initials in an establishment: retry on a collision, and only in the (very unlikely)
  -- case where they are all taken, fall back to 4 digits rather than fail the declaration.
  for i in 1..40 loop
    v_bytes := gen_random_bytes(2);
    v_ref := '#' || v_initials || case
      when i <= 30 then lpad((((get_byte(v_bytes, 0) << 8) | get_byte(v_bytes, 1)) % 1000)::text, 3, '0')
      else lpad((((get_byte(v_bytes, 0) << 8) | get_byte(v_bytes, 1)) % 10000)::text, 4, '0')
    end;
    if not exists (select 1 from public.declarations d where d.organization_id = p_org and d.ref = v_ref) then
      return v_ref;
    end if;
  end loop;
  raise exception 'ref_unavailable' using errcode = 'P0001';
end;
$$;
revoke all on function public.new_declaration_ref(uuid, text, text) from public, anon, authenticated;

create or replace function public.kiosk_submit_declaration(
  p_token text,
  p_kind text,
  p_nom text,
  p_prenom text,
  p_classe text,
  p_telephone text,
  p_object_name text,
  p_category text,
  p_description text,
  p_location text,
  p_photos text[] default '{}'
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_phone text := nullif(btrim(coalesce(p_telephone, '')), '');
  v_id uuid := gen_random_uuid();
  v_ref text;
  v_photo text;
  v_pos smallint := 0;
begin
  if p_kind not in ('perdu', 'trouve') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  if nullif(btrim(p_nom), '') is null or nullif(btrim(p_prenom), '') is null or nullif(btrim(p_classe), '') is null
     or nullif(btrim(p_object_name), '') is null then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if p_category not in ('telephone', 'sac', 'cles', 'vetement', 'scolaire', 'autre') then
    raise exception 'invalid_category' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9 +().-]{6,20}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if coalesce(array_length(p_photos, 1), 0) > 3 then
    raise exception 'too_many_photos' using errcode = '22023';
  end if;
  -- Light anti-abuse: one borne cannot flood the register.
  if (select count(*) from public.declarations where kiosk_id = v_kiosk.id and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  v_ref := public.new_declaration_ref(v_kiosk.organization_id, p_nom, p_prenom);
  insert into public.declarations (id, organization_id, ref, kind, nom, prenom, classe, telephone, object_name, category, description, location, kiosk_id)
  values (
    v_id, v_kiosk.organization_id, v_ref, p_kind,
    btrim(p_nom), btrim(p_prenom), btrim(p_classe), v_phone,
    btrim(p_object_name), p_category, left(coalesce(p_description, ''), 250), nullif(left(btrim(coalesce(p_location, '')), 80), ''),
    v_kiosk.id
  );

  foreach v_photo in array coalesce(p_photos, '{}') loop
    insert into public.declaration_photos (declaration_id, organization_id, sort_order, data)
    values (v_id, v_kiosk.organization_id, v_pos, v_photo);
    v_pos := v_pos + 1;
  end loop;

  perform public.log_audit(
    v_kiosk.organization_id, 'declaration.create',
    'Déclaration ' || v_ref || ' reçue (' || case p_kind when 'perdu' then 'perdu' else 'trouvé' end || ' : ' || btrim(p_object_name) || ')',
    v_kiosk.name
  );

  return v_ref;
end;
$$;
revoke all on function public.kiosk_submit_declaration(text, text, text, text, text, text, text, text, text, text, text[]) from public;
grant execute on function public.kiosk_submit_declaration(text, text, text, text, text, text, text, text, text, text, text[]) to anon, authenticated;

-- "Suivre ma déclaration" accepts both formats: #DL482 (typed with or without "#", any case) and the older DEC-1042.
create or replace function public.normalize_declaration_ref(p_ref text)
returns text
language sql
immutable
as $$
  select case
    when v ~ '^DEC[0-9]+$' then 'DEC-' || substr(v, 4)
    when v ~ '^[0-9]+$' then 'DEC-' || v
    else '#' || v
  end
  from (select upper(regexp_replace(coalesce(p_ref, ''), '[^A-Za-z0-9]', '', 'g')) as v) s
$$;

create or replace function public.kiosk_track_declaration(p_token text, p_ref text, p_last_name text)
returns table (ref text, kind text, object_name text, stage text, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_ref text := public.normalize_declaration_ref(p_ref);
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
