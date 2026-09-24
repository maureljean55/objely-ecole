"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useIdleTouch } from "@/components/kiosk/IdleGuard";
import { useKioskToken } from "@/components/kiosk/KioskProvider";
import { LogoMark } from "../kiosk/LogoMark";
import { createPhotoSession, fetchSessionPhoto, sessionStatus } from "@/lib/photoSession";

const STEPS = [
  "Scannez le QR code avec l'appareil photo de votre téléphone.",
  "Prenez ou choisissez la photo.",
  "Elle arrive ici toute seule.",
];

const POLL_MS = 2000;

type Session = { id: string; qr: string };

/**
 * Left panel of the photo step: a QR code that opens a page on the visitor's own phone, where they send photos straight
 * to this borne. The borne checks for new photos every 2 s while there is room for them, and hands each one to `onPhoto`.
 */
export function PhoneSync({ full, onPhoto }: { full: boolean; onPhoto: (dataUrl: string) => void }) {
  const token = useKioskToken();
  const idleTouch = useIdleTouch();
  const [session, setSession] = useState<Session | null>(null);
  const [failed, setFailed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [received, setReceived] = useState(0);
  // Photos already taken from the session: a photo the visitor removes on the borne must not come back.
  const imported = useRef(new Set<string>());
  const latest = useRef({ full, onPhoto, idleTouch });
  useEffect(() => {
    latest.current = { full, onPhoto, idleTouch };
  });

  // One session per visit to this step. Generated after mount: the id comes from the database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await createPhotoSession(token);
      if (cancelled) return;
      if (!id) return setFailed(true);
      // The phone must reach this site: a borne running on localhost needs NEXT_PUBLIC_SITE_URL (its LAN or public address).
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || window.location.origin;
      const qr = await QRCode.toDataURL(`${origin}/depot/${id}`, {
        errorCorrectionLevel: "M",
        margin: 0,
        width: 320,
        color: { dark: "#101a36", light: "#ffffff" },
      });
      if (!cancelled) setSession({ id, qr });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Collect what the phone sends.
  useEffect(() => {
    if (!session) return;
    let stopped = false;
    let wasOpened = false;
    const tick = async () => {
      const status = await sessionStatus(token, session.id);
      if (stopped || !status) return;
      // The visitor is busy on their phone, not idle: keep the form alive.
      if (status.opened && !wasOpened) latest.current.idleTouch();
      wasOpened = status.opened;
      setConnected(status.opened);
      if (latest.current.full) return;
      for (const id of status.photoIds) {
        if (imported.current.has(id)) continue;
        if (latest.current.full) break;
        const data = await fetchSessionPhoto(token, id);
        if (stopped || !data) return;
        imported.current.add(id);
        latest.current.onPhoto(data);
        latest.current.idleTouch();
        setReceived((n) => n + 1);
      }
    };
    void tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [session, token]);

  const status = failed
    ? "Le code QR n'a pas pu être créé. Utilisez la caméra de la borne."
    : received > 0
      ? `${received} photo${received > 1 ? "s" : ""} reçue${received > 1 ? "s" : ""} du téléphone`
      : connected
        ? "Téléphone connecté. Envoyez votre photo."
        : "En attente du téléphone…";

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border-2 border-line p-4">
      <p className="font-mono text-label-sm font-semibold uppercase tracking-wider text-accent">Avec votre téléphone</p>

      <div className="my-auto flex items-center gap-5">
        <div className="shrink-0">
          <div className="relative size-[144px] rounded-lg border-2 border-line-strong bg-white p-2">
            {session ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.qr} alt="QR code à scanner avec votre téléphone" className="size-full" />
            ) : (
              <div className={`size-full bg-line ${failed ? "" : "animate-pulse"}`} />
            )}
            {session && (
              <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white">
                <LogoMark height={26} />
              </span>
            )}
          </div>
          <p className="mt-2 text-center font-mono text-label-sm tabular-nums text-slate">Session {session ? session.id.slice(0, 4).toUpperCase() : "····"}</p>
        </div>

        <ol className="flex flex-1 flex-col gap-3 text-body-md text-ink">
          {STEPS.map((text, i) => (
            <li key={text} className="flex gap-3">
              <span className="w-4 shrink-0 font-mono font-semibold text-accent">{i + 1}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      <p role="status" className={`border-t-2 border-line pt-3 text-label-sm font-medium ${received > 0 ? "text-ok" : failed ? "text-danger" : "text-slate"}`}>
        {status}
      </p>
    </div>
  );
}
