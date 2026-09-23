"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { LogoMark } from "../kiosk/LogoMark";

const STEPS = [
  "Scannez le QR code avec l'appareil photo de votre téléphone.",
  "Prenez ou choisissez la photo.",
  "Elle arrive ici toute seule.",
];

type Session = { code: string; qr: string };

// Left panel of the photo step: a one-off QR that hands the upload over to
// the visitor's own phone. The QR is real; the phone-side page and the live
// sync behind it are not built yet (they need the backend).
export function PhoneSync() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Generated after mount: a random id can't be rendered on the server.
    const id = crypto.randomUUID();
    const code = String(parseInt(id.slice(0, 4), 16) % 10000).padStart(4, "0");
    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/depot/${id}`, {
      errorCorrectionLevel: "H",
      margin: 0,
      width: 320,
      color: { dark: "#101a36", light: "#ffffff" },
    }).then((qr) => {
      if (!cancelled) setSession({ code, qr });
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
              <div className="size-full animate-pulse bg-line" />
            )}
            {session && (
              <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white">
                <LogoMark height={26} />
              </span>
            )}
          </div>
          <p className="mt-2 text-center font-mono text-label-sm tabular-nums text-slate">Session {session?.code ?? "····"}</p>
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

      <p className="border-t-2 border-line pt-3 text-label-sm font-medium text-slate">En attente du téléphone…</p>
    </div>
  );
}
