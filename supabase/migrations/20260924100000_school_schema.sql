-- Objely École: the database shared by the borne (kiosk) and the school admin portal.
--
-- One establishment = one organization. Every table carries organization_id and sits behind
-- row-level security: staff only ever see their own establishment, kiosks only reach the
-- database through the security-definer functions at the bottom (never through tables), and
-- the restitution register can only be written by restitute_object().

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  type text not null default 'lycee' check (type in ('ecole', 'college', 'lycee', 'universite')),
  city text check (city is null or char_length(city) between 1 and 80),
  address text check (address is null or char_length(address) <= 200),
  phone text check (phone is null or char_length(phone) <= 30),
  contact_email text check (contact_email is null or char_length(contact_email) between 3 and 160),
  -- Days an object is kept before it can be donated.
  retention_days integer not null default 60 check (retention_days between 1 and 730),
  -- Seconds without a touch before a borne wipes its form.
  idle_seconds integer not null default 90 check (idle_seconds between 20 and 600),
  -- Shown on the borne as the help-desk number.
  help_desk text check (help_desk is null or char_length(help_desk) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- members: staff of an establishment, linked to a Supabase Auth user at first sign-in
-- ---------------------------------------------------------------------------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null check (char_length(email) between 3 and 160),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  role text not null default 'vie_scolaire' check (role in ('admin', 'vie_scolaire', 'lecture')),
  active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index members_org_email_key on public.members (organization_id, lower(email));
create unique index members_org_user_key on public.members (organization_id, user_id) where user_id is not null;
create index members_user_idx on public.members (user_id) where user_id is not null;

-- ---------------------------------------------------------------------------
-- kiosks
-- ---------------------------------------------------------------------------
create or replace function public.new_pairing_code()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text, 6, '0')
$$;

create table public.kiosks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  location text check (location is null or char_length(location) <= 80),
  version text not null default '2.4',
  -- The borne's secret is only stored hashed; the clear token is shown once, at pairing.
  token_hash text,
  pairing_code text default public.new_pairing_code(),
  pairing_expires_at timestamptz default now() + interval '48 hours',
  paired_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index kiosks_pairing_code_key on public.kiosks (pairing_code) where pairing_code is not null;
create unique index kiosks_token_hash_key on public.kiosks (token_hash) where token_hash is not null;
create index kiosks_org_idx on public.kiosks (organization_id);

-- ---------------------------------------------------------------------------
-- per-establishment reference counters (OBJ-1001, DEC-1001, RST-0001)
-- ---------------------------------------------------------------------------
create table public.org_counters (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('object', 'declaration', 'restitution')),
  value integer not null,
  primary key (organization_id, kind)
);

create or replace function public.next_ref(p_org uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start integer := case p_kind when 'restitution' then 1 else 1001 end;
  v_value integer;
begin
  insert into public.org_counters (organization_id, kind, value)
  values (p_org, p_kind, v_start)
  on conflict (organization_id, kind) do update set value = public.org_counters.value + 1
  returning value into v_value;

  return case p_kind
    when 'object' then 'OBJ-' || v_value
    when 'declaration' then 'DEC-' || v_value
    else 'RST-' || lpad(v_value::text, 4, '0')
  end;
end;
$$;
revoke all on function public.next_ref(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- objects: handed in to the vie scolaire
-- ---------------------------------------------------------------------------
create table public.objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ref text not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null check (category in ('telephone', 'sac', 'cles', 'vetement', 'scolaire', 'autre')),
  description text not null default '' check (char_length(description) <= 250),
  found_at text check (found_at is null or char_length(found_at) <= 80),
  found_on date not null default current_date,
  deposited_at timestamptz not null default now(),
  storage_place text not null check (char_length(btrim(storage_place)) between 1 and 80),
  -- Full photo lives in the object-photos bucket; a small data-URL thumbnail is kept for lists and the borne.
  photo_path text,
  thumb text check (thumb is null or (char_length(thumb) <= 80000 and thumb like 'data:image/%')),
  status text not null default 'en_stock' check (status in ('en_stock', 'restitue', 'a_donner')),
  restitution_id uuid,
  from_declaration_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, ref)
);
create index objects_org_status_idx on public.objects (organization_id, status, deposited_at desc);

create or replace function public.objects_set_ref()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.ref := public.next_ref(new.organization_id, 'object');
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end;
$$;
create trigger objects_set_ref before insert on public.objects for each row execute function public.objects_set_ref();

-- ---------------------------------------------------------------------------
-- declarations: what people declare on a borne. Holds names and phone numbers, so staff-only.
-- ---------------------------------------------------------------------------
create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ref text not null,
  kind text not null check (kind in ('perdu', 'trouve')),
  nom text not null check (char_length(btrim(nom)) between 1 and 80),
  prenom text not null check (char_length(btrim(prenom)) between 1 and 80),
  classe text not null check (char_length(btrim(classe)) between 1 and 80),
  telephone text check (telephone is null or telephone ~ '^[0-9 +().-]{6,20}$'),
  object_name text not null check (char_length(btrim(object_name)) between 1 and 80),
  category text not null check (category in ('telephone', 'sac', 'cles', 'vetement', 'scolaire', 'autre')),
  description text not null default '' check (char_length(description) <= 250),
  location text check (location is null or char_length(location) <= 80),
  kiosk_id uuid references public.kiosks (id) on delete set null,
  status text not null default 'ouverte' check (status in ('ouverte', 'correspondance', 'cloturee')),
  object_id uuid references public.objects (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, ref)
);
create index declarations_org_status_idx on public.declarations (organization_id, status, created_at desc);

create table public.declaration_photos (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references public.declarations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sort_order smallint not null default 0 check (sort_order between 0 and 2),
  data text not null check (char_length(data) <= 400000 and data like 'data:image/%')
);
create index declaration_photos_decl_idx on public.declaration_photos (declaration_id);

-- ---------------------------------------------------------------------------
-- restitutions: the register of objects given back. Written only by restitute_object().
-- ---------------------------------------------------------------------------
create table public.restitutions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ref text not null,
  object_id uuid references public.objects (id) on delete set null,
  object_ref text not null,
  object_name text not null,
  nom text not null check (char_length(btrim(nom)) between 1 and 80),
  prenom text not null check (char_length(btrim(prenom)) between 1 and 80),
  classe text not null check (char_length(btrim(classe)) between 1 and 80),
  id_checked boolean not null,
  note text not null default '' check (char_length(note) <= 250),
  done_at timestamptz not null default now(),
  done_by uuid references public.members (id) on delete set null,
  done_by_name text not null,
  declaration_id uuid references public.declarations (id) on delete set null,
  unique (organization_id, ref)
);
create index restitutions_org_idx on public.restitutions (organization_id, done_at desc);

alter table public.objects
  add constraint objects_restitution_fk foreign key (restitution_id) references public.restitutions (id) on delete set null,
  add constraint objects_declaration_fk foreign key (from_declaration_id) references public.declarations (id) on delete set null;

-- ---------------------------------------------------------------------------
-- audit log: append-only, written by triggers and functions
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_name text not null,
  action text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- permission helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_member_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.members m
  where m.organization_id = p_org and m.user_id = auth.uid() and m.active
  limit 1
$$;

create or replace function public.is_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_member_role(p_org) is not null $$;

create or replace function public.can_write(p_org uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_member_role(p_org) in ('admin', 'vie_scolaire'), false) $$;

create or replace function public.is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_member_role(p_org) = 'admin', false) $$;

revoke all on function public.current_member_role(uuid), public.is_member(uuid), public.can_write(uuid), public.is_org_admin(uuid) from public, anon;
grant execute on function public.current_member_role(uuid), public.is_member(uuid), public.can_write(uuid), public.is_org_admin(uuid) to authenticated;

create or replace function public.log_audit(p_org uuid, p_action text, p_message text, p_actor text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- When an establishment is deleted, its members cascade here after it is already gone.
  if not exists (select 1 from public.organizations where id = p_org) then
    return;
  end if;
  insert into public.audit_log (organization_id, actor_user_id, actor_name, action, message)
  values (
    p_org,
    auth.uid(),
    coalesce(
      p_actor,
      (select m.full_name from public.members m where m.organization_id = p_org and m.user_id = auth.uid() limit 1),
      'Système'
    ),
    p_action,
    left(p_message, 300)
  );
end;
$$;
revoke all on function public.log_audit(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.objects_guard_status() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and (new.status = 'restitue' or old.status = 'restitue')
     and coalesce(current_setting('app.restituting', true), '') <> 'on' then
    raise exception 'use_restitute_object' using errcode = '42501',
      hint = 'Un objet ne passe à « rendu » que par la fonction restitute_object().';
  end if;
  return new;
end;
$$;
create trigger objects_guard_status before update on public.objects for each row execute function public.objects_guard_status();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger objects_touch before update on public.objects for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- audit triggers (so no client can forget to log, or forge, an action)
-- ---------------------------------------------------------------------------
create or replace function public.audit_objects() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit(new.organization_id, 'object.create', 'Objet enregistré : ' || new.ref || ' (' || new.name || ')');
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.status <> 'restitue' then
      perform public.log_audit(new.organization_id, 'object.status',
        case new.status when 'a_donner' then 'Objet ' || new.ref || ' marqué à donner' else 'Objet ' || new.ref || ' remis en stock' end);
    elsif new.status = old.status and (new.name, new.description, new.category, new.storage_place, new.found_at, new.found_on)
          is distinct from (old.name, old.description, old.category, old.storage_place, old.found_at, old.found_on) then
      perform public.log_audit(new.organization_id, 'object.update', 'Objet modifié : ' || new.ref);
    end if;
  else
    perform public.log_audit(old.organization_id, 'object.delete', 'Objet supprimé : ' || old.ref || ' (' || old.name || ')');
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger objects_audit after insert or update or delete on public.objects for each row execute function public.audit_objects();

create or replace function public.audit_declarations() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.log_audit(new.organization_id, 'declaration.status',
      'Déclaration ' || new.ref || ' : ' || case new.status when 'cloturee' then 'clôturée' when 'correspondance' then 'correspondance trouvée' else 'rouverte' end);
  elsif tg_op = 'DELETE' then
    perform public.log_audit(old.organization_id, 'declaration.delete', 'Déclaration supprimée : ' || old.ref);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger declarations_audit after update or delete on public.declarations for each row execute function public.audit_declarations();

create or replace function public.audit_members() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit(new.organization_id, 'staff.create', 'Accès créé pour ' || new.full_name);
  elsif tg_op = 'UPDATE' and (new.role, new.active, new.full_name, new.email) is distinct from (old.role, old.active, old.full_name, old.email) then
    perform public.log_audit(new.organization_id, 'staff.update', 'Accès modifié : ' || new.full_name);
  elsif tg_op = 'DELETE' then
    perform public.log_audit(old.organization_id, 'staff.delete', 'Accès supprimé : ' || old.full_name);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger members_audit after insert or update or delete on public.members for each row execute function public.audit_members();

-- An establishment must always keep one active administrator.
create or replace function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Deleting the whole establishment cascades here: let it through.
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if old.role = 'admin' and old.active and (tg_op = 'DELETE' or new.role <> 'admin' or not new.active) then
    if not exists (
      select 1 from public.members m
      where m.organization_id = old.organization_id and m.id <> old.id and m.role = 'admin' and m.active
    ) then
      raise exception 'last_admin' using errcode = 'P0001', hint = 'Il doit rester au moins un administrateur actif.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger members_keep_one_admin before update or delete on public.members for each row execute function public.keep_one_admin();

create or replace function public.audit_kiosks() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit(new.organization_id, 'kiosk.create', 'Borne ajoutée : ' || new.name);
  elsif tg_op = 'UPDATE' and (new.name, new.location) is distinct from (old.name, old.location) then
    perform public.log_audit(new.organization_id, 'kiosk.update', 'Borne modifiée : ' || new.name);
  elsif tg_op = 'DELETE' then
    perform public.log_audit(old.organization_id, 'kiosk.delete', 'Borne supprimée : ' || old.name);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger kiosks_audit after insert or update or delete on public.kiosks for each row execute function public.audit_kiosks();

create or replace function public.audit_organizations() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.log_audit(new.id, 'settings.update', 'Paramètres de l''établissement enregistrés');
  return new;
end;
$$;
create trigger organizations_audit after update on public.organizations for each row execute function public.audit_organizations();

-- ---------------------------------------------------------------------------
-- row-level security
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.members enable row level security;
alter table public.kiosks enable row level security;
alter table public.org_counters enable row level security;
alter table public.objects enable row level security;
alter table public.declarations enable row level security;
alter table public.declaration_photos enable row level security;
alter table public.restitutions enable row level security;
alter table public.audit_log enable row level security;

-- organizations: members read, admins edit. Created by the platform (service role) via bootstrap_organization().
create policy organizations_select on public.organizations for select to authenticated using (public.is_member(id));
create policy organizations_update on public.organizations for update to authenticated using (public.is_org_admin(id)) with check (public.is_org_admin(id));

-- members: everyone in the establishment sees the team, only admins manage it.
create policy members_select on public.members for select to authenticated using (public.is_member(organization_id));
create policy members_insert on public.members for insert to authenticated with check (public.is_org_admin(organization_id));
create policy members_update on public.members for update to authenticated using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy members_delete on public.members for delete to authenticated using (public.is_org_admin(organization_id));

-- kiosks: admins only. The token hash is not readable, and only a few columns are writable.
create policy kiosks_select on public.kiosks for select to authenticated using (public.is_member(organization_id));
create policy kiosks_insert on public.kiosks for insert to authenticated with check (public.is_org_admin(organization_id));
create policy kiosks_update on public.kiosks for update to authenticated using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy kiosks_delete on public.kiosks for delete to authenticated using (public.is_org_admin(organization_id));

-- objects: members read, staff write, admins delete.
create policy objects_select on public.objects for select to authenticated using (public.is_member(organization_id));
create policy objects_insert on public.objects for insert to authenticated with check (public.can_write(organization_id));
create policy objects_update on public.objects for update to authenticated using (public.can_write(organization_id)) with check (public.can_write(organization_id));
create policy objects_delete on public.objects for delete to authenticated using (public.is_org_admin(organization_id));

-- declarations: only the kiosk functions create them; staff read, update status, admins delete.
create policy declarations_select on public.declarations for select to authenticated using (public.is_member(organization_id));
create policy declarations_update on public.declarations for update to authenticated using (public.can_write(organization_id)) with check (public.can_write(organization_id));
create policy declarations_delete on public.declarations for delete to authenticated using (public.is_org_admin(organization_id));
create policy declaration_photos_select on public.declaration_photos for select to authenticated using (public.is_member(organization_id));

-- restitutions and audit_log: read-only for staff; written by functions.
create policy restitutions_select on public.restitutions for select to authenticated using (public.is_member(organization_id));
create policy audit_log_select on public.audit_log for select to authenticated using (public.is_member(organization_id));

-- Column-level grants: nothing sensitive is exposed, nothing immutable is writable.
revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.organizations to authenticated;
revoke update on public.organizations from authenticated;
grant update (name, type, city, address, phone, contact_email, retention_days, idle_seconds, help_desk) on public.organizations to authenticated;
grant select on public.members to authenticated;
grant insert (organization_id, email, full_name, role, active) on public.members to authenticated;
grant update (email, full_name, role, active) on public.members to authenticated;
grant delete on public.members to authenticated;
grant select (id, organization_id, name, location, version, pairing_code, pairing_expires_at, paired_at, last_seen_at, created_at) on public.kiosks to authenticated;
grant insert (organization_id, name, location) on public.kiosks to authenticated;
grant update (name, location) on public.kiosks to authenticated;
grant delete on public.kiosks to authenticated;
grant select on public.objects to authenticated;
grant insert (organization_id, name, category, description, found_at, found_on, storage_place, photo_path, thumb, from_declaration_id) on public.objects to authenticated;
grant update (name, category, description, found_at, found_on, storage_place, photo_path, thumb, status) on public.objects to authenticated;
grant delete on public.objects to authenticated;
grant select on public.declarations to authenticated;
grant update (status, object_id) on public.declarations to authenticated;
grant delete on public.declarations to authenticated;
grant select on public.declaration_photos to authenticated;
grant select on public.restitutions to authenticated;
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- staff functions
-- ---------------------------------------------------------------------------

-- Links the signed-in Supabase Auth user to the membership created for their e-mail.
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
  returning m.organization_id, m.id, m.role;
end;
$$;
revoke all on function public.claim_membership() from public, anon;
grant execute on function public.claim_membership() to authenticated;

-- Hands an object back: one transaction that records the restitution and closes the loop.
create or replace function public.restitute_object(
  p_object_id uuid,
  p_nom text,
  p_prenom text,
  p_classe text,
  p_id_checked boolean,
  p_note text default '',
  p_declaration_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_object public.objects%rowtype;
  v_member public.members%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_object from public.objects where id = p_object_id for update;
  if not found then
    raise exception 'object_not_found' using errcode = 'P0002';
  end if;
  if not public.can_write(v_object.organization_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_object.status = 'restitue' then
    raise exception 'already_restituted' using errcode = 'P0001';
  end if;
  if p_id_checked is not true then
    raise exception 'id_not_checked' using errcode = '22023';
  end if;
  if nullif(btrim(p_nom), '') is null or nullif(btrim(p_prenom), '') is null or nullif(btrim(p_classe), '') is null then
    raise exception 'missing_fields' using errcode = '22023';
  end if;

  select * into v_member from public.members
   where organization_id = v_object.organization_id and user_id = auth.uid() and active
   limit 1;

  insert into public.restitutions (id, organization_id, ref, object_id, object_ref, object_name, nom, prenom, classe, id_checked, note, done_by, done_by_name, declaration_id)
  values (
    v_id, v_object.organization_id, public.next_ref(v_object.organization_id, 'restitution'),
    v_object.id, v_object.ref, v_object.name,
    btrim(p_nom), btrim(p_prenom), btrim(p_classe), true, left(coalesce(p_note, ''), 250),
    v_member.id, v_member.full_name,
    case when exists (select 1 from public.declarations d where d.id = p_declaration_id and d.organization_id = v_object.organization_id) then p_declaration_id end
  );

  perform set_config('app.restituting', 'on', true);
  update public.objects set status = 'restitue', restitution_id = v_id where id = v_object.id;
  perform set_config('app.restituting', 'off', true);

  update public.declarations
     set status = 'cloturee', object_id = v_object.id
   where id = p_declaration_id and organization_id = v_object.organization_id;

  perform public.log_audit(v_object.organization_id, 'restitution.create',
    'Objet ' || v_object.ref || ' rendu à ' || btrim(p_prenom) || ' ' || btrim(p_nom));

  return v_id;
end;
$$;
revoke all on function public.restitute_object(uuid, text, text, text, boolean, text, uuid) from public, anon;
grant execute on function public.restitute_object(uuid, text, text, text, boolean, text, uuid) to authenticated;

-- Platform operator only (service role): registers an establishment and its first administrator.
create or replace function public.bootstrap_organization(
  p_name text,
  p_type text,
  p_admin_email text,
  p_admin_name text,
  p_city text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  insert into public.organizations (name, type, city, contact_email)
  values (btrim(p_name), p_type, nullif(btrim(p_city), ''), lower(btrim(p_admin_email)))
  returning id into v_org;

  insert into public.members (organization_id, email, full_name, role)
  values (v_org, lower(btrim(p_admin_email)), btrim(p_admin_name), 'admin');

  return v_org;
end;
$$;
revoke all on function public.bootstrap_organization(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_organization(text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- kiosk functions: the only door the borne has into the database
-- ---------------------------------------------------------------------------
create table public.kiosk_pairing_attempts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);
alter table public.kiosk_pairing_attempts enable row level security;
revoke all on public.kiosk_pairing_attempts from anon, authenticated;

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
  if v_kiosk.last_seen_at is null or v_kiosk.last_seen_at < now() - interval '1 minute' then
    update public.kiosks set last_seen_at = now() where id = v_kiosk.id;
  end if;
  return v_kiosk;
end;
$$;
revoke all on function public.kiosk_lookup(text) from public, anon, authenticated;

-- Exchanges the 6-digit code shown in the admin portal for the borne's long-lived token.
create or replace function public.pair_kiosk(p_code text)
returns table (token text, kiosk_name text, school_name text, school_type text, help_desk text, idle_seconds integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks;
  v_token text := encode(gen_random_bytes(24), 'hex');
begin
  -- 6 digits is guessable: cap attempts across the whole platform.
  if (select count(*) from public.kiosk_pairing_attempts where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.kiosk_pairing_attempts default values;
  delete from public.kiosk_pairing_attempts where created_at < now() - interval '1 day';

  select * into v_kiosk from public.kiosks
   where pairing_code = btrim(p_code) and paired_at is null and pairing_expires_at > now()
   for update;
  if not found then
    raise exception 'invalid_code' using errcode = '28000';
  end if;

  update public.kiosks
     set token_hash = encode(digest(v_token, 'sha256'), 'hex'),
         paired_at = now(), last_seen_at = now(), pairing_code = null, pairing_expires_at = null
   where id = v_kiosk.id;

  perform public.log_audit(v_kiosk.organization_id, 'kiosk.pair', 'Borne appairée : ' || v_kiosk.name, v_kiosk.name);

  return query
    select v_token, v_kiosk.name, o.name, o.type, o.help_desk, o.idle_seconds
      from public.organizations o where o.id = v_kiosk.organization_id;
end;
$$;
revoke all on function public.pair_kiosk(text) from public;
grant execute on function public.pair_kiosk(text) to anon, authenticated;

create or replace function public.kiosk_config(p_token text)
returns table (kiosk_name text, school_name text, school_type text, help_desk text, idle_seconds integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
begin
  return query
    select v_kiosk.name, o.name, o.type, o.help_desk, o.idle_seconds
      from public.organizations o where o.id = v_kiosk.organization_id;
end;
$$;
revoke all on function public.kiosk_config(text) from public;
grant execute on function public.kiosk_config(text) to anon, authenticated;

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

  v_ref := public.next_ref(v_kiosk.organization_id, 'declaration');
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

-- What the borne's "Rechercher" page shows: objects handed in and restitutable. No names, no phone numbers.
create or replace function public.kiosk_list_objects(p_token text)
returns table (id uuid, name text, category text, description text, found_at text, deposited_at timestamptz, thumb text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_kiosk public.kiosks := public.kiosk_lookup(p_token);
begin
  return query
    select o.id, o.name, o.category, o.description, o.found_at, o.deposited_at, o.thumb
      from public.objects o
     where o.organization_id = v_kiosk.organization_id and o.status = 'en_stock'
     order by o.deposited_at desc
     limit 200;
end;
$$;
revoke all on function public.kiosk_list_objects(text) from public;
grant execute on function public.kiosk_list_objects(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- storage: object photos, one folder per establishment
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('object-photos', 'object-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy object_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'object-photos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy object_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'object-photos' and public.can_write(((storage.foldername(name))[1])::uuid));
create policy object_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'object-photos' and public.can_write(((storage.foldername(name))[1])::uuid));
create policy object_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'object-photos' and public.is_org_admin(((storage.foldername(name))[1])::uuid));

-- New declarations show up live in the admin portal (row-level security still applies).
alter publication supabase_realtime add table public.declarations;
