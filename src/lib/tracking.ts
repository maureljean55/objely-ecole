import type { Kind } from "@/lib/declaration";
import { getSupabase } from "./supabase";

// "Suivre ma déclaration": where a declaration stands, from its reference and the declarant's last name.
// See supabase/migrations/…_declaration_tracking.sql for what each stage means.

export type Stage = "searching" | "match" | "returned" | "closed" | "to_deposit" | "deposited" | "donated";

export type Tracked = { reference: string; kind: Kind; objectName: string; stage: Stage; createdAt: string; updatedAt: string };

export type TrackResult = { ok: true; tracked: Tracked } | { ok: false; reason: "not_found" | "rate_limited" | "network" };

export async function trackDeclaration(token: string, reference: string, lastName: string): Promise<TrackResult> {
  const db = getSupabase();
  if (!db) return { ok: false, reason: "network" };
  const { data, error } = await db.rpc("kiosk_track_declaration", { p_token: token, p_ref: reference, p_last_name: lastName });
  if (error) {
    if (/not_found/.test(error.message)) return { ok: false, reason: "not_found" };
    if (/rate_limited/.test(error.message)) return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "network" };
  }
  const row = (data as { ref: string; kind: Kind; object_name: string; stage: Stage; created_at: string; updated_at: string }[] | null)?.[0];
  if (!row) return { ok: false, reason: "not_found" };
  return {
    ok: true,
    tracked: { reference: row.ref, kind: row.kind, objectName: row.object_name, stage: row.stage, createdAt: row.created_at, updatedAt: row.updated_at },
  };
}
