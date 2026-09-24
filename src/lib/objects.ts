import { getSupabase } from "./supabase";
import type { CategoryId } from "@/lib/declaration";

// An object that has been handed in to the vie scolaire and can be given back to its owner.
// Objects only reported as found (not yet deposited) are never listed: they can't be restituted.
export type ListedObject = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  /** Where it was found. */
  foundAt: string;
  /** ISO date it was handed in. */
  depositedAt: string;
  /** Optional small photo (data URL); without one the card shows the category icon. */
  photoUrl?: string;
};

type Row = { id: string; name: string; category: CategoryId; description: string; found_at: string | null; deposited_at: string; thumb: string | null };

export type ListResult = { ok: true; objects: ListedObject[] } | { ok: false; error: string };

/**
 * The objects in stock at this borne's establishment, newest first. The list is public on the screen: the database
 * function only returns what is safe to show (no names, no phone numbers, nothing about who found or claimed an object).
 */
export async function listObjects(token: string): Promise<ListResult> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "La borne n'est pas configurée." };
  const { data, error } = await db.rpc("kiosk_list_objects", { p_token: token });
  if (error) {
    return { ok: false, error: /invalid_kiosk/.test(error.message) ? "Cette borne n'est plus reconnue. Redémarrez-la." : "La liste n'a pas pu être chargée. Vérifiez le réseau de la borne." };
  }
  return {
    ok: true,
    objects: ((data ?? []) as Row[]).map((r) => ({
      id: r.id, name: r.name, category: r.category, description: r.description, foundAt: r.found_at ?? "", depositedAt: r.deposited_at, photoUrl: r.thumb ?? undefined,
    })),
  };
}
