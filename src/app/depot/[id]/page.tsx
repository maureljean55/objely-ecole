"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/kiosk/Icon";
import { LogoMark } from "@/components/kiosk/LogoMark";
import { phoneSessionInfo, uploadPhoto, type PhoneSession } from "@/lib/photoSession";

// The database refuses photos over 400 000 characters of data URL: shrink until it fits.
const MAX_DATA_URL = 390_000;
const SIZES = [1280, 1024, 800, 640];
const QUALITIES = [0.8, 0.7, 0.6];

async function toJpeg(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  for (const size of SIZES) {
    const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_DATA_URL) return data;
    }
  }
  return null;
}

type Phase = "loading" | "ready" | "invalid" | "offline";

/** Opened on the visitor's own phone from the QR code of the borne's photo step. No account: the session id is the permission. */
export default function DepotPage() {
  const { id } = useParams<{ id: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<PhoneSession | null>(null);
  // Photos taken or picked on the phone, waiting for "Envoyer"; then those the borne has received.
  const [pending, setPending] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const result = await phoneSessionInfo(id);
    if (result.ok) {
      setSession(result.value);
      setPhase("ready");
    } else {
      setPhase(result.reason === "invalid_session" ? "invalid" : "offline");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const received = (session?.count ?? 0) + sent.length;
  const max = session?.max ?? 3;
  const room = max - received - pending.length;
  const busy = preparing || sending;

  // Picking only prepares the photos: nothing leaves the phone before "Envoyer".
  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, Math.max(room, 0));
    e.target.value = "";
    if (files.length === 0) return;
    setPreparing(true);
    setError(null);
    setJustSent(0);
    for (const file of files) {
      const data = await toJpeg(file);
      if (data) setPending((prev) => [...prev, data]);
      else setError("Cette image n'a pas pu être lue. Essayez une autre photo.");
    }
    setPreparing(false);
  };

  const send = async () => {
    if (pending.length === 0) return;
    setSending(true);
    setError(null);
    let delivered = 0;
    for (const data of pending) {
      const result = await uploadPhoto(id, data);
      if (!result.ok) {
        if (result.reason === "invalid_session") setPhase("invalid");
        else if (result.reason === "too_many_photos") setError(`La borne a déjà reçu ${max} photos.`);
        else if (result.reason === "invalid_photo") setError("Une image n'est pas acceptée. Retirez-la et réessayez.");
        else setError("L'envoi n'a pas abouti. Vérifiez votre connexion et appuyez de nouveau sur Envoyer.");
        break;
      }
      delivered++;
      setSent((prev) => [...prev, data]);
      setPending((prev) => prev.slice(1));
    }
    setJustSent(delivered);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-canvas">
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 pb-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <header className="flex items-center gap-3">
          <LogoMark height={32} priority />
          <div className="min-w-0">
            <p className="font-display text-h-md text-ink">Objely École</p>
            {session && (
              <p className="truncate text-label-sm text-slate">
                {session.school} · {session.station}
              </p>
            )}
          </div>
        </header>

        {phase === "loading" && <div className="h-40 animate-pulse rounded-xl bg-line" />}

        {(phase === "invalid" || phase === "offline") && (
          <section className="flex flex-col items-center gap-4 rounded-xl border-2 border-line bg-white p-6 text-center">
            {phase === "invalid" ? (
              <Icon name="timer_off" size={40} className="text-slate" />
            ) : (
              <Icon name="wifi_off" size={40} className="text-slate" />
            )}
            <h1 className="text-h-md text-ink">{phase === "invalid" ? "Ce lien a expiré" : "Pas de connexion"}</h1>
            <p className="text-body-md text-slate">
              {phase === "invalid"
                ? "Scannez à nouveau le QR code affiché sur la borne."
                : "Vérifiez que votre téléphone est connecté à Internet."}
            </p>
            {phase === "offline" && (
              <button type="button" onClick={() => void load()} className="press h-12 rounded-xl border-2 border-ink/80 px-5 text-label-lg text-ink">
                Réessayer
              </button>
            )}
          </section>
        )}

        {phase === "ready" && (
          <>
            <div>
              <h1 className="text-h-lg text-ink">Photos pour la borne</h1>
              <p className="mt-1 text-body-md text-slate">
                Prenez ou choisissez vos photos, vérifiez-les, puis appuyez sur Envoyer : elles arrivent sur le formulaire de la borne.
              </p>
            </div>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFiles} />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

            <div className="flex gap-3">
              <button
                type="button"
                disabled={room <= 0 || busy}
                onClick={() => cameraRef.current?.click()}
                className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink/80 bg-white text-label-lg text-ink disabled:opacity-40"
              >
                <Icon name="photo_camera" size={22} />
                Prendre
              </button>
              <button
                type="button"
                disabled={room <= 0 || busy}
                onClick={() => galleryRef.current?.click()}
                className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink/80 bg-white text-label-lg text-ink disabled:opacity-40"
              >
                <Icon name="photo_library" size={22} />
                Galerie
              </button>
            </div>

            {(pending.length > 0 || preparing) && (
              <section className="flex flex-col gap-3">
                <p className="text-label-md font-semibold text-ink">À envoyer</p>
                <div className="grid grid-cols-3 gap-3">
                  {pending.map((src, i) => (
                    <div key={`${i}-${src.length}`} className="relative aspect-square overflow-hidden rounded-xl border-2 border-accent">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1} à envoyer`} className="size-full object-cover" />
                      <button
                        type="button"
                        disabled={sending}
                        aria-label={`Retirer la photo ${i + 1}`}
                        onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                        className="press absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-ink/75 text-white"
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  ))}
                  {preparing && <div className="aspect-square animate-pulse rounded-xl bg-line" />}
                </div>
              </section>
            )}

            <button
              type="button"
              disabled={pending.length === 0 || busy}
              onClick={() => void send()}
              className="press flex h-14 items-center justify-center gap-3 rounded-xl bg-accent text-label-lg text-white disabled:opacity-40"
            >
              <Icon name="send" size={22} />
              {sending
                ? "Envoi…"
                : pending.length > 0
                  ? `Envoyer ${pending.length > 1 ? `les ${pending.length} photos` : "la photo"} à la borne`
                  : "Envoyer à la borne"}
            </button>

            <p role="status" className={`text-label-md font-medium ${justSent > 0 ? "text-ok" : "text-slate"}`}>
              {justSent > 0
                ? `Envoyé ! ${justSent > 1 ? `Les ${justSent} photos sont` : "La photo est"} sur le formulaire de la borne.`
                : received >= max
                  ? `La borne a reçu ses ${max} photos. Retournez-y pour valider.`
                  : `${received} / ${max} photos reçues par la borne`}
            </p>
            {error && <p role="alert" className="text-label-md text-danger">{error}</p>}

            {sent.length > 0 && (
              <section className="flex flex-col gap-3">
                <p className="text-label-md font-semibold text-ink">Envoyées</p>
                <div className="grid grid-cols-3 gap-3">
                  {sent.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-xl border-2 border-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1} envoyée`} className="size-full object-cover" />
                      <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-ok text-white">
                        <Icon name="check" size={16} />
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="text-label-sm text-slate">
              Seule la vie scolaire voit vos photos. Évitez les visages et les documents personnels.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
