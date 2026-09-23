"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Icon } from "../kiosk/Icon";
import { LogoMark } from "../kiosk/LogoMark";

const STEPS = [
  "Scannez le QR avec l'appareil photo du smartphone",
  "Choisissez ou prenez la photo sur votre mobile",
  "Synchronisation instantanée sur cette borne",
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
      color: { dark: "#102653", light: "#ffffff" },
    }).then((qr) => {
      if (!cancelled) setSession({ code, qr });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-line">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-signature px-3.5 py-1.5 text-label-sm text-white">
        <Icon name="bolt" fill size={16} />
        Recommandé pour borne tactile
      </span>

      <div className="my-auto flex items-center gap-5">
        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-rest ring-1 ring-line">
          <div className="relative size-[132px]">
            {session ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.qr} alt="QR code à scanner avec votre smartphone" className="size-full" />
            ) : (
              <div className="size-full animate-pulse rounded-lg bg-line" />
            )}
            {session && (
              <span className="absolute left-1/2 top-1/2 flex size-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white">
                <LogoMark height={24} />
              </span>
            )}
          </div>
          <p className="mt-2 text-center text-label-sm uppercase tracking-wide text-slate">
            Session #{session?.code ?? "····"}
          </p>
        </div>

        <ol className="flex flex-1 flex-col gap-2">
          {STEPS.map((text, i) => (
            <li key={text} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-label-sm font-medium text-ink">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-selected text-label-sm text-blue-ink">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      <p className="flex items-center justify-center gap-2 rounded-xl bg-selected px-3 py-2.5 text-label-sm text-blue-ink">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-blue" />
        </span>
        En attente de connexion du smartphone…
      </p>
    </div>
  );
}
