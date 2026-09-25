-- Staff read kiosks column by column (token_hash stays hidden): the paused_at column added by
-- 20260925150000_kiosk_pause.sql was missing from that list, so reading the bornes failed with "permission denied".
grant select (paused_at) on public.kiosks to authenticated;
