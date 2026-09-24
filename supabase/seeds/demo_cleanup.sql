-- Removes exactly the rows added by supabase/seeds/demo_data.sql (listed in public.demo_seed_rows), then that list.
-- Run it in the Supabase dashboard (project objely-ecole > SQL Editor).
do $$
begin
  if to_regclass('public.demo_seed_rows') is null then
    raise notice 'Aucune donnée de démo à supprimer.';
    return;
  end if;
  -- Restitutions first (objects point to them), then declarations, then objects.
  update public.objects set restitution_id = null where id in (select row_id from public.demo_seed_rows where table_name = 'objects');
  delete from public.restitutions where id in (select row_id from public.demo_seed_rows where table_name = 'restitutions');
  delete from public.declarations where id in (select row_id from public.demo_seed_rows where table_name = 'declarations');
  delete from public.objects where id in (select row_id from public.demo_seed_rows where table_name = 'objects');
  drop table public.demo_seed_rows;
  raise notice 'Données de démo supprimées.';
end;
$$;
