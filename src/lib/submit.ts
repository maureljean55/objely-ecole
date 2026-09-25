import type { Declaration, Kind } from "@/lib/declaration";
import { getSupabase } from "./supabase";

export type SubmitResult = { ok: true; reference: string } | { ok: false; error: string };

const MESSAGES: [RegExp, string][] = [
  [/invalid_kiosk/, "Cette borne n'est plus reconnue. Prévenez la vie scolaire."],
  [/kiosk_paused/, "Cette borne a été mise en pause par la vie scolaire. Adressez-vous à elle."],
  [/organization_suspended/, "Les déclarations sont suspendues pour cet établissement. Adressez-vous à la vie scolaire."],
  [/rate_limited/, "Trop de déclarations envoyées en peu de temps. Réessayez dans quelques minutes."],
  [/invalid_phone/, "Le numéro de téléphone n'est pas valide. Revenez à la première étape pour le corriger."],
  [/missing_fields|invalid_category|invalid_kind/, "Une information obligatoire manque. Revenez aux étapes précédentes."],
];

/** Sends the declaration to the establishment's database. The reference on the ticket (#DL482: initials + 3 random digits) comes from the database. */
export async function submitDeclaration(token: string, kind: Kind, d: Declaration): Promise<SubmitResult> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "La borne n'est pas configurée." };

  const { data, error } = await db.rpc("kiosk_submit_declaration", {
    p_token: token,
    p_kind: kind,
    p_nom: d.nom,
    p_prenom: d.prenom,
    p_classe: d.classe,
    p_telephone: d.telephone || null,
    p_object_name: d.objectName,
    p_category: d.category,
    p_description: d.description,
    p_location: d.location || null,
    p_photos: d.photos.filter((p): p is string => Boolean(p)),
  });

  if (error) {
    const known = MESSAGES.find(([re]) => re.test(error.message));
    return { ok: false, error: known?.[1] ?? "La déclaration n'a pas pu être envoyée. Vérifiez le réseau de la borne et réessayez." };
  }
  return { ok: true, reference: data as string };
}
