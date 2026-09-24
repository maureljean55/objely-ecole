import type { CategoryId } from "@/lib/declaration";
import { getSupabase } from "./supabase";

// Right after a declaration: objects (or declarations) that look like it, and the student's confirmation.
// See supabase/migrations/…_instant_matching.sql.

export type Candidate = {
  id: string;
  /** "object": already at the vie scolaire. "declaration": declared at a borne (for a lost object: found but not deposited yet). */
  source: "object" | "declaration";
  name: string;
  category: CategoryId;
  description: string;
  location: string;
  seenAt: string;
  photo: string | null;
};

type Row = { candidate_id: string; source: Candidate["source"]; name: string; category: CategoryId; description: string; location: string | null; seen_at: string; photo: string | null };

/** Possible matches, best first (at most 3). An empty list when nothing matches or the search failed. */
export async function findMatches(token: string, reference: string): Promise<Candidate[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.rpc("kiosk_find_matches", { p_token: token, p_ref: reference });
  if (error || !Array.isArray(data)) return [];
  return (data as Row[]).map((r) => ({
    id: r.candidate_id,
    source: r.source,
    name: r.name,
    category: r.category,
    description: r.description,
    location: r.location ?? "",
    seenAt: r.seen_at,
    photo: r.photo,
  }));
}

export async function confirmMatch(token: string, reference: string, candidate: Candidate): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.rpc("kiosk_confirm_match", { p_token: token, p_ref: reference, p_source: candidate.source, p_candidate: candidate.id });
  return !error;
}
