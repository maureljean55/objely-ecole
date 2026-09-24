import { getSupabase } from "./supabase";

// Photos from a visitor's phone to the borne. The borne opens a session and shows its id as a QR code; the phone
// uploads into it; the borne polls and collects. See supabase/migrations/…_photo_upload_sessions.sql.

export const MAX_PHONE_PHOTOS = 3;

// ---------------------------------------------------------------- borne side

export async function createPhotoSession(token: string): Promise<string | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.rpc("kiosk_create_photo_session", { p_token: token });
  return error ? null : (data as string);
}

export type SessionStatus = { opened: boolean; photoIds: string[] };

export async function sessionStatus(token: string, session: string): Promise<SessionStatus | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.rpc("kiosk_photo_session_status", { p_token: token, p_session: session });
  if (error) return null;
  const row = (data as { opened: boolean; photo_ids: string[] }[] | null)?.[0];
  return row ? { opened: row.opened, photoIds: row.photo_ids ?? [] } : null;
}

export async function fetchSessionPhoto(token: string, item: string): Promise<string | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.rpc("kiosk_session_photo", { p_token: token, p_item: item });
  return error ? null : (data as string);
}

// ---------------------------------------------------------------- phone side

export type PhoneSession = { school: string; station: string; count: number; max: number; expiresAt: string };
export type PhoneResult<T> = { ok: true; value: T } | { ok: false; reason: "invalid_session" | "network" };

export async function phoneSessionInfo(session: string): Promise<PhoneResult<PhoneSession>> {
  const db = getSupabase();
  if (!db) return { ok: false, reason: "network" };
  const { data, error } = await db.rpc("phone_session_info", { p_session: session });
  if (error) return { ok: false, reason: /invalid_session/.test(error.message) || error.code === "28000" ? "invalid_session" : "network" };
  const row = (data as { school_name: string; station: string; photo_count: number; max_photos: number; expires_at: string }[] | null)?.[0];
  if (!row) return { ok: false, reason: "invalid_session" };
  return { ok: true, value: { school: row.school_name, station: row.station, count: row.photo_count, max: row.max_photos, expiresAt: row.expires_at } };
}

export type UploadResult = { ok: true; count: number } | { ok: false; reason: "invalid_session" | "too_many_photos" | "invalid_photo" | "network" };

export async function uploadPhoto(session: string, data: string): Promise<UploadResult> {
  const db = getSupabase();
  if (!db) return { ok: false, reason: "network" };
  const { data: count, error } = await db.rpc("phone_upload_photo", { p_session: session, p_data: data });
  if (error) {
    if (/too_many_photos/.test(error.message)) return { ok: false, reason: "too_many_photos" };
    if (/invalid_photo/.test(error.message)) return { ok: false, reason: "invalid_photo" };
    if (/invalid_session/.test(error.message) || error.code === "28000") return { ok: false, reason: "invalid_session" };
    return { ok: false, reason: "network" };
  }
  return { ok: true, count: count as number };
}
