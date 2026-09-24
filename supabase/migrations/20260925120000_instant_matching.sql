-- Instant matching on the borne, right after a declaration is sent.
--
-- Lost object: the borne looks for objects already handed in to the vie scolaire, and for "found" declarations not yet
-- deposited, that look like it. If the student recognises one and confirms it is theirs, their declaration is marked
-- "correspondance" and linked to it: they then go to the vie scolaire with their code and a proof it is theirs.
-- Found object: the borne looks for open "lost" declarations that look like it. If the finder confirms, both are
-- linked and the owner's declaration is marked "correspondance". Either way the finder deposits the object.
--
-- A confirmation is a claim, not a proof: the object is only given back at the vie scolaire, after an identity check.
-- Only the borne that sent the declaration, within 30 minutes, can search or confirm with it. Nothing personal about
-- the other side is returned (no name, class or phone), and the photos of a lost-object declaration are never shown.

alter table public.declarations
  add column matched_declaration_id uuid references public.declarations (id) on delete set null;

-- ---------------------------------------------------------------------------
-- scoring: same rule as objely-ecole-admin (src/lib/matching.ts)
-- ---------------------------------------------------------------------------
create or replace function public.fold_text(p text)
returns text
language sql
immutable
as $$
  select translate(lower(btrim(coalesce(p, ''))), 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa')
$$;

create or replace function public.match_tokens(p text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct t), '{}')
    from regexp_split_to_table(public.fold_text(p), '[^a-z0-9]+') t
   where length(t) > 2
     and t <> all (array['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'en', 'au', 'aux', 'avec', 'sans', 'sur', 'dans', 'pour', 'mon', 'ma', 'mes'])
$$;

-- 0-100. 60 and above is shown as a possible match.
create or replace function public.match_score(a_category text, a_text text, a_location text, b_category text, b_text text, b_location text)
returns integer
language plpgsql
immutable
as $$
declare
  v_shared integer;
  v_score integer := 0;
begin
  select count(*) into v_shared from unnest(public.match_tokens(a_text)) t where t = any (public.match_tokens(b_text));
  if a_category = b_category then
    v_score := v_score + case when a_category = 'autre' then 20 else 45 end;
  end if;
  if v_shared > 0 then
    v_score := v_score + least(45, v_shared * 15);
  else
    v_score := least(v_score, 40);
  end if;
  if v_shared > 0 and public.fold_text(a_location) <> '' and public.fold_text(a_location) = public.fold_text(b_location) then
    v_score := v_score + 10;
  end if;
  return least(95, v_score);
end;
$$;

-- The declaration the borne just sent, if it may still search with it.
create or replace function public.kiosk_recent_declaration(v_kiosk public.kiosks, p_ref text)
returns public.declarations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decl public.declarations;
begin
  select * into v_decl from public.declarations d
   where d.organization_id = v_kiosk.organization_id and d.ref = p_ref
     and d.kiosk_id = v_kiosk.id and d.created_at > now() - interval '30 minutes';
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return v_decl;
end;
$$;
revoke all on function public.kiosk_recent_declaration(public.kiosks, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- search
-- ---------------------------------------------------------------------------
create or replace function public.kiosk_find_matches(p_token text, p_ref text)
returns table (candidate_id uuid, source text, name text, category text, description text, location text, seen_at timestamptz, photo text, score integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_decl public.declarations := public.kiosk_recent_declaration(v_kiosk, p_ref);
  v_text text := v_decl.object_name || ' ' || v_decl.description;
begin
  if v_decl.kind = 'perdu' then
    return query
      select c.id, c.source, c.name, c.category, c.description, c.location, c.seen_at, c.photo, c.score
        from (
          -- objects handed in to the vie scolaire
          select o.id, 'object'::text as source, o.name, o.category, o.description, o.found_at as location, o.deposited_at as seen_at, o.thumb as photo,
                 public.match_score(v_decl.category, v_text, v_decl.location, o.category, o.name || ' ' || o.description, o.found_at) as score
            from public.objects o
           where o.organization_id = v_decl.organization_id and o.status = 'en_stock'
          union all
          -- found objects declared at a borne but not deposited yet
          select d.id, 'declaration', d.object_name, d.category, d.description, d.location, d.created_at,
                 (select p.data from public.declaration_photos p where p.declaration_id = d.id order by p.sort_order limit 1),
                 public.match_score(v_decl.category, v_text, v_decl.location, d.category, d.object_name || ' ' || d.description, d.location)
            from public.declarations d
           where d.organization_id = v_decl.organization_id and d.kind = 'trouve' and d.status = 'ouverte' and d.object_id is null
             and d.created_at > now() - interval '90 days'
        ) c
       where c.score >= 60
       order by c.score desc, c.seen_at desc
       limit 3;
  else
    -- open lost-object declarations. No photo: they are the owner's own pictures.
    return query
      select d.id, 'declaration'::text, d.object_name, d.category, d.description, d.location, d.created_at, null::text,
             public.match_score(v_decl.category, v_text, v_decl.location, d.category, d.object_name || ' ' || d.description, d.location) as score
        from public.declarations d
       where d.organization_id = v_decl.organization_id and d.kind = 'perdu' and d.status <> 'cloturee'
         and d.created_at > now() - interval '90 days'
         and public.match_score(v_decl.category, v_text, v_decl.location, d.category, d.object_name || ' ' || d.description, d.location) >= 60
       order by 9 desc, d.created_at desc
       limit 3;
  end if;
end;
$$;
revoke all on function public.kiosk_find_matches(text, text) from public;
grant execute on function public.kiosk_find_matches(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- confirmation
-- ---------------------------------------------------------------------------
create or replace function public.kiosk_confirm_match(p_token text, p_ref text, p_source text, p_candidate uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
  v_decl public.declarations := public.kiosk_recent_declaration(v_kiosk, p_ref);
  v_other public.declarations;
  v_object public.objects;
begin
  if v_decl.kind = 'perdu' and p_source = 'object' then
    select * into v_object from public.objects o
     where o.id = p_candidate and o.organization_id = v_decl.organization_id and o.status = 'en_stock';
    if not found then
      raise exception 'candidate_gone' using errcode = 'P0002';
    end if;
    update public.declarations set status = 'correspondance', object_id = v_object.id where id = v_decl.id;
    perform public.log_audit(v_decl.organization_id, 'declaration.claim',
      'Déclaration ' || v_decl.ref || ' : l''élève reconnaît l''objet ' || v_object.ref || ' (' || v_object.name || ')', v_kiosk.name);
    return;
  end if;

  if p_source <> 'declaration' then
    raise exception 'candidate_gone' using errcode = 'P0002';
  end if;
  select * into v_other from public.declarations d
   where d.id = p_candidate and d.organization_id = v_decl.organization_id and d.id <> v_decl.id
     and d.kind <> v_decl.kind and d.status <> 'cloturee';
  if not found then
    raise exception 'candidate_gone' using errcode = 'P0002';
  end if;

  -- Link both ways; the lost-object side becomes a "correspondance". The found side keeps its status: it still has
  -- to be deposited.
  update public.declarations set matched_declaration_id = v_other.id where id = v_decl.id;
  update public.declarations set matched_declaration_id = v_decl.id where id = v_other.id;
  update public.declarations set status = 'correspondance'
   where id = case when v_decl.kind = 'perdu' then v_decl.id else v_other.id end;

  perform public.log_audit(v_decl.organization_id, 'declaration.claim',
    case when v_decl.kind = 'perdu'
      then 'Déclaration ' || v_decl.ref || ' : l''élève reconnaît l''objet trouvé déclaré ' || v_other.ref || ' (pas encore déposé)'
      else 'Déclaration ' || v_decl.ref || ' : l''objet trouvé correspond à la perte déclarée ' || v_other.ref
    end, v_kiosk.name);
end;
$$;
revoke all on function public.kiosk_confirm_match(text, text, text, uuid) from public;
grant execute on function public.kiosk_confirm_match(text, text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- tracking: two new stages
--   perdu  · match_pending : a matching found object was declared but is not at the vie scolaire yet
--   trouve · owner_found   : the finder recognised a lost-object declaration; the object still has to be deposited
-- ---------------------------------------------------------------------------
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
  v_other public.declarations;
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
  if v_decl.matched_declaration_id is not null then
    select * into v_other from public.declarations d where d.id = v_decl.matched_declaration_id;
  end if;
  select max(r.done_at) into v_returned_at from public.restitutions r
   where r.declaration_id = v_decl.id or (v_object.id is not null and r.object_id = v_object.id);

  if v_decl.kind = 'perdu' then
    v_stage := case
      when v_returned_at is not null then 'returned'
      when v_decl.status = 'correspondance' and v_object.id is null and v_other.id is not null and v_other.object_id is null then 'match_pending'
      when v_decl.status = 'correspondance' then 'match'
      when v_decl.status = 'ouverte' then 'searching'
      else 'closed'
    end;
  else
    v_stage := case
      when v_returned_at is not null or v_object.status = 'restitue' then 'returned'
      when v_object.status = 'a_donner' then 'donated'
      when v_object.status = 'en_stock' then 'deposited'
      when v_decl.status = 'ouverte' and v_other.id is not null then 'owner_found'
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
