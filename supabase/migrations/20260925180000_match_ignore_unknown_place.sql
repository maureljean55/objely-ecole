-- "Je ne sais pas" is not a place: declarations saved with it before the borne stopped sending it must not count as
-- found "at the same place" when matching. Same scoring otherwise (see 20260925120000_instant_matching.sql).
create or replace function public.match_score(a_category text, a_text text, a_location text, b_category text, b_text text, b_location text)
returns integer
language plpgsql
immutable
as $$
declare
  v_shared integer;
  v_score integer := 0;
  v_a text := public.fold_text(a_location);
  v_b text := public.fold_text(b_location);
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
  if v_shared > 0 and v_a <> '' and v_a <> 'je ne sais pas' and v_a = v_b then
    v_score := v_score + 10;
  end if;
  return least(95, v_score);
end;
$$;
