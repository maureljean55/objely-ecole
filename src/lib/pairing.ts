import { getSupabase } from "./supabase";
import { toConfig, type KioskConfig } from "./kiosk";

const KEY = "objely-ecole:kiosk";

export type Paired = { token: string; config: KioskConfig };

export function readPaired(): Paired | null {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Paired) : null;
    return parsed?.token && parsed.config?.school ? parsed : null;
  } catch {
    return null;
  }
}

export function savePaired(paired: Paired | null) {
  try {
    if (paired) localStorage.setItem(KEY, JSON.stringify(paired));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the borne then has to be paired again after a restart.
  }
}

export type PairResult = { ok: true; paired: Paired } | { ok: false; reason: "invalid" | "rate_limited" | "network" | "not_configured" };

type PairRow = { token: string; kiosk_name: string; school_name: string; school_type: string; help_desk: string | null; idle_seconds: number };

/** Exchanges the 6-digit code shown in the administration (Bornes page) for this borne's own token. */
export async function pairKiosk(code: string): Promise<PairResult> {
  const db = getSupabase();
  if (!db) return { ok: false, reason: "not_configured" };
  const { data, error } = await db.rpc("pair_kiosk", { p_code: code });
  if (error) {
    if (/rate_limited/.test(error.message)) return { ok: false, reason: "rate_limited" };
    if (/invalid_code/.test(error.message) || error.code === "28000") return { ok: false, reason: "invalid" };
    return { ok: false, reason: "network" };
  }
  const row = (data as PairRow[] | null)?.[0];
  if (!row) return { ok: false, reason: "invalid" };
  const paired = { token: row.token, config: toConfig(row) };
  savePaired(paired);
  return { ok: true, paired };
}

export type ConfigResult = { ok: true; config: KioskConfig } | { ok: false; reason: "revoked" | "suspended" | "paused" | "network" };

/** Checks the token is still valid (also tells the administration this borne is online) and reads the current settings. */
export async function fetchConfig(token: string): Promise<ConfigResult> {
  const db = getSupabase();
  if (!db) return { ok: false, reason: "network" };
  const { data, error } = await db.rpc("kiosk_config", { p_token: token });
  if (error) {
    if (/invalid_kiosk/.test(error.message) || error.code === "28000") return { ok: false, reason: "revoked" };
    // The establishment was suspended by Objely: the borne keeps its pairing and resumes once it is reactivated.
    if (/organization_suspended/.test(error.message)) return { ok: false, reason: "suspended" };
    // Paused by the establishment itself: same, it resumes on its own.
    if (/kiosk_paused/.test(error.message)) return { ok: false, reason: "paused" };
    return { ok: false, reason: "network" };
  }
  const row = (data as { kiosk_name: string; school_name: string; school_type: string; help_desk: string | null; idle_seconds: number }[] | null)?.[0];
  return row ? { ok: true, config: toConfig(row) } : { ok: false, reason: "revoked" };
}

/** The id this borne listens to for Realtime "check" nudges (see …_kiosk_realtime_nudge.sql). null if unavailable. */
export async function fetchKioskChannel(token: string): Promise<string | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.rpc("kiosk_channel", { p_token: token });
  return error ? null : (data as string);
}
