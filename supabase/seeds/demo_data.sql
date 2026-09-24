-- Realistic demo data for ONE establishment: objects at the vie scolaire, lost / found declarations, a few restitutions.
-- Built so the borne's instant search has something to find (see the "À essayer" list at the end).
--
-- Run it in the Supabase dashboard (project objely-ecole > SQL Editor). Set the establishment's name just below.
-- Every row it creates is recorded in public.demo_seed_rows, so supabase/seeds/demo_cleanup.sql removes exactly those.
-- Running it twice adds a second set: clean up first.

do $$
declare
  -- ⬇ The establishment to fill (start of its name is enough, case-insensitive).
  v_org_name constant text := 'Institut universitaire';

  v_org uuid;
  v_kiosk uuid;
  v_id uuid;
  v_rst uuid;
  o record;
  d record;
begin
  select id into v_org from public.organizations where name ilike v_org_name || '%';
  if not found then
    raise exception 'Aucun établissement dont le nom commence par « % »', v_org_name;
  end if;
  if (select count(*) from public.organizations where name ilike v_org_name || '%') > 1 then
    raise exception 'Plusieurs établissements commencent par « % » : précisez le nom', v_org_name;
  end if;
  select id into v_kiosk from public.kiosks where organization_id = v_org order by created_at limit 1;

  create table if not exists public.demo_seed_rows (table_name text not null, row_id uuid not null, created_at timestamptz not null default now());
  alter table public.demo_seed_rows enable row level security;
  revoke all on public.demo_seed_rows from anon, authenticated;

  -- ------------------------------------------------------------------ objects at the vie scolaire
  for o in select * from (values
    -- name, category, description, found at, storage, days ago, status
    ('iPhone 12 noir',              'telephone', 'Coque noire en silicone, fond d''écran avec une plage',           'Cantine / Réfectoire',  'Tiroir sécurisé A',  2,  'en_stock'),
    ('Samsung Galaxy A14 bleu',     'telephone', 'Écran légèrement fissuré en bas à droite',                         'Cour de récréation',    'Tiroir sécurisé A',  9,  'en_stock'),
    ('Sac à dos Eastpak bleu marine','sac',      'Porte-clés Tour Eiffel, cahiers de maths à l''intérieur',          'Gymnase & Vestiaires',  'Étagère 2',          4,  'en_stock'),
    ('Sacoche d''ordinateur grise', 'sac',       'Marque Dell, vide',                                                'CDI (1er étage)',       'Étagère 2',          23, 'en_stock'),
    ('Trousseau de clés avec badge','cles',      'Trois clés et un badge bleu, porte-clés Barcelone',                'Couloir / Hall',        'Boîte à clés',       1,  'en_stock'),
    ('Clé USB SanDisk 32 Go',       'cles',      'Rouge et noire, avec un cordon',                                   'Salle de cours',        'Boîte à clés',       15, 'en_stock'),
    ('Veste en jean délavé',        'vetement',  'Taille M, badge brodé sur la poche',                               'Cour de récréation',    'Portant vêtements',  6,  'en_stock'),
    ('Sweat à capuche gris Nike',   'vetement',  'Taille L, cordon manquant',                                        'Gymnase & Vestiaires',  'Portant vêtements',  38, 'en_stock'),
    ('Écharpe rouge en laine',      'vetement',  '',                                                                 'Couloir / Hall',        'Portant vêtements',  72, 'en_stock'),
    ('Calculatrice Casio fx-92',    'scolaire',  'Nom effacé au dos, couvercle bleu',                                'Salle de cours',        'Étagère 1',          3,  'en_stock'),
    ('Trousse noire Kipling',       'scolaire',  'Stylos, règle et une gomme en forme de fraise',                    'CDI (1er étage)',       'Étagère 1',          12, 'en_stock'),
    ('Livre « Le Petit Prince »',   'scolaire',  'Édition Folio, annoté au crayon',                                  'CDI (1er étage)',       'Étagère 1',          65, 'en_stock'),
    ('Gourde isotherme verte',      'autre',     'Autocollants de mangas',                                           'Gymnase & Vestiaires',  'Étagère 3',          5,  'en_stock'),
    ('Lunettes de vue écaille',     'autre',     'Dans un étui rigide marron',                                       'Cantine / Réfectoire',  'Tiroir sécurisé B',  20, 'en_stock'),
    ('Casque audio JBL blanc',      'autre',     'Bluetooth, un coussinet abîmé',                                    'Salle de cours',        'Tiroir sécurisé B',  81, 'a_donner'),
    ('Parapluie noir pliant',       'autre',     '',                                                                 'Couloir / Hall',        'Étagère 3',          90, 'a_donner')
  ) as t(name, category, description, found_at, storage, days_ago, status) loop
    insert into public.objects (organization_id, name, category, description, found_at, found_on, deposited_at, storage_place, status)
    values (v_org, o.name, o.category, o.description, o.found_at, (current_date - o.days_ago), now() - make_interval(days => o.days_ago, hours => 3), o.storage, o.status)
    returning id into v_id;
    insert into public.demo_seed_rows (table_name, row_id) values ('objects', v_id);
  end loop;

  -- ------------------------------------------------------------------ objects already given back (with their restitution)
  for o in select * from (values
    ('AirPods Pro dans leur boîtier', 'autre',     'Boîtier gravé « K.D. »',      'Cantine / Réfectoire', 'Tiroir sécurisé B', 18, 'Kouassi', 'Délali',   'L2 Droit',   'Décrit la gravure du boîtier', 14),
    ('Portefeuille marron',           'autre',     'Cuir, carte de bus à l''intérieur', 'Cour de récréation', 'Tiroir sécurisé A', 11, 'Traoré',  'Aminata',  'L1 Éco-Gestion', 'Carte de bus à son nom', 10),
    ('Montre Casio argentée',         'autre',     'Bracelet métal',              'Gymnase & Vestiaires', 'Tiroir sécurisé B', 30, 'Bamba',   'Ibrahim',  'M1 Informatique', '', 27)
  ) as t(name, category, description, found_at, storage, days_ago, nom, prenom, classe, note, returned_days_ago) loop
    insert into public.objects (organization_id, name, category, description, found_at, found_on, deposited_at, storage_place, status)
    values (v_org, o.name, o.category, o.description, o.found_at, (current_date - o.days_ago), now() - make_interval(days => o.days_ago), o.storage, 'restitue')
    returning id into v_id;
    insert into public.demo_seed_rows (table_name, row_id) values ('objects', v_id);

    insert into public.restitutions (organization_id, ref, object_id, object_ref, object_name, nom, prenom, classe, id_checked, note, done_at, done_by_name)
    select v_org, public.next_ref(v_org, 'restitution'), ob.id, ob.ref, ob.name, o.nom, o.prenom, o.classe, true, o.note,
           now() - make_interval(days => o.returned_days_ago, hours => 2), 'Vie scolaire'
      from public.objects ob where ob.id = v_id
    returning id into v_rst;
    insert into public.demo_seed_rows (table_name, row_id) values ('restitutions', v_rst);
    update public.objects set restitution_id = v_rst where id = v_id;
  end loop;

  -- ------------------------------------------------------------------ declarations made at the borne
  for d in select * from (values
    -- kind, nom, prenom, classe, phone, object, category, description, location, days ago, status
    -- lost, still searching (a found object declared at the borne below matches the first two)
    ('perdu',  'Koné',      'Awa',       'L1 Droit',        '07 08 12 34 56', 'AirPods Pro',              'autre',     'Boîtier blanc avec une coque rose',        'Cantine / Réfectoire', 1,  'ouverte'),
    ('perdu',  'Yao',       'Kevin',     'L3 Informatique', '',               'Carte étudiante',          'autre',     'Au nom de Kevin Yao, dans un porte-carte',  'Couloir / Hall',       2,  'ouverte'),
    ('perdu',  'N''Guessan','Marie-Ange','L2 Lettres',      '05 44 21 09 87', 'Veste en jean',            'vetement',  'Veste en jean délavé avec un badge brodé',  'Cour de récréation',   5,  'ouverte'),
    ('perdu',  'Diallo',    'Moussa',    'M1 Gestion',      '01 02 03 04 05', 'Chargeur d''ordinateur',   'autre',     'Chargeur HP 65 W',                          'CDI (1er étage)',      8,  'ouverte'),
    ('perdu',  'Ouattara',  'Fatou',     'L1 Éco-Gestion',  '',               'Bracelet en argent',       'autre',     'Fin, avec une breloque en forme de cœur',   'Gymnase & Vestiaires', 13, 'ouverte'),
    -- lost, already matched by the vie scolaire
    ('perdu',  'Coulibaly', 'Ismaël',    'L2 Maths',        '07 77 66 55 44', 'Calculatrice Casio',       'scolaire',  'Casio fx-92 avec un couvercle bleu',        'Salle de cours',       2,  'correspondance'),
    -- lost, closed
    ('perdu',  'Kouassi',   'Délali',    'L2 Droit',        '07 11 22 33 44', 'AirPods Pro',              'autre',     'Boîtier gravé K.D.',                        'Cantine / Réfectoire', 19, 'cloturee'),
    -- found, declared at the borne but not deposited yet
    ('trouve', 'Kacou',     'Serge',     'L3 Physique',     '',               'Écouteurs AirPods',        'autre',     'Boîtier blanc, coque rose',                 'Cantine / Réfectoire', 0,  'ouverte'),
    ('trouve', 'Touré',     'Aïcha',     'L1 Droit',        '',               'Casquette New York noire', 'vetement',  'Logo NY blanc',                             'Cour de récréation',   1,  'ouverte'),
    -- found and already deposited (closed at deposit)
    ('trouve', 'Brou',      'Emmanuel',  'M2 Finance',      '',               'Trousseau de clés',        'cles',      'Trois clés et un badge bleu',               'Couloir / Hall',       1,  'cloturee')
  ) as t(kind, nom, prenom, classe, phone, object_name, category, description, location, days_ago, status) loop
    insert into public.declarations (organization_id, ref, kind, nom, prenom, classe, telephone, object_name, category, description, location, kiosk_id, status, created_at)
    values (v_org, public.new_declaration_ref(v_org, d.nom, d.prenom), d.kind, d.nom, d.prenom, d.classe, nullif(d.phone, ''),
            d.object_name, d.category, d.description, d.location, v_kiosk, d.status, now() - make_interval(days => d.days_ago, hours => 1))
    returning id into v_id;
    insert into public.demo_seed_rows (table_name, row_id) values ('declarations', v_id);
  end loop;

  -- Link the matched / deposited declarations to their stock object, as the vie scolaire would have.
  update public.declarations dc set object_id = (
      select ob.id from public.objects ob
       where ob.organization_id = v_org and ob.name = 'Calculatrice Casio fx-92'
         and ob.id in (select row_id from public.demo_seed_rows where table_name = 'objects') limit 1)
   where dc.id in (select row_id from public.demo_seed_rows where table_name = 'declarations') and dc.nom = 'Coulibaly';
  update public.declarations dc set object_id = (
      select ob.id from public.objects ob
       where ob.organization_id = v_org and ob.name = 'Trousseau de clés avec badge'
         and ob.id in (select row_id from public.demo_seed_rows where table_name = 'objects') limit 1)
   where dc.id in (select row_id from public.demo_seed_rows where table_name = 'declarations') and dc.nom = 'Brou';

  raise notice 'Données de démo ajoutées à l''établissement %', v_org;
end;
$$;

-- À essayer sur la borne, pour voir la recherche instantanée :
--   Déclarer « perdu »  · Téléphone · « iPhone noir », lieu Cantine            → propose l'iPhone 12 noir
--   Déclarer « perdu »  · Sac & Dos · « Sac à dos Eastpak »                    → propose le sac Eastpak bleu marine
--   Déclarer « perdu »  · Clés / Badge · « Clés avec badge bleu »              → propose le trousseau de clés
--   Déclarer « perdu »  · Autre · « AirPods boîtier blanc »                    → propose les AirPods déclarés trouvés (pas encore déposés)
--   Déclarer « trouvé » · Vêtement · « Veste en jean », Cour de récréation     → propose la perte de Marie-Ange N'Guessan
--   Déclarer « trouvé » · Autre · « Carte étudiante », lieu Couloir / Hall      → propose la perte de Kevin Yao
