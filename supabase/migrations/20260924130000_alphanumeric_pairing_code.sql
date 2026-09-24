-- Pairing codes are now "#" + 6 characters mixing digits and letters (e.g. #A7K9Q2), stored without the "#".
-- Letters and digits that can't be mistaken for one another are used (no 0/O, 1/I/L): the code is read off a screen and
-- typed on a tablet. 31^6 is far harder to guess than 10^6, which matters because it grants access to an establishment.
-- Codes issued before this change (6 digits) stay valid until they expire.
create or replace function public.new_pairing_code()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea;
  code text;
  i int;
begin
  loop
    bytes := gen_random_bytes(6);
    code := '';
    for i in 0..5 loop
      code := code || substr(chars, (get_byte(bytes, i) % 31) + 1, 1);
    end loop;
    -- always a mix: at least one digit and one letter
    if code ~ '[0-9]' and code ~ '[A-Z]' then
      return code;
    end if;
  end loop;
end;
$$;

-- The code typed on the borne may include the "#" and any case.
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
  -- The code is guessable in principle: cap attempts across the whole platform.
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

  perform public.log_audit(v_kiosk.organization_id, 'kiosk.pair', 'Borne appairée : ' || v_kiosk.name, v_kiosk.name);

  return query
    select v_token, v_kiosk.name, o.name, o.type, o.help_desk, o.idle_seconds
      from public.organizations o where o.id = v_kiosk.organization_id;
end;
$$;
revoke all on function public.pair_kiosk(text) from public;
grant execute on function public.pair_kiosk(text) to anon, authenticated;
