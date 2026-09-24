"use client";

import { useKiosk } from "@/components/kiosk/KioskProvider";
import { VERSION } from "@/lib/kiosk";

export function Footer({ variant }: { variant: "home" | "wizard" }) {
  const kiosk = useKiosk();
  return (
    <footer className="flex h-16 shrink-0 items-center justify-between border-t-2 border-line bg-white px-8 text-label-sm font-medium text-slate">
      {variant === "home" ? (
        <>
          <span>Touchez un bouton pour commencer</span>
          <span>
            {kiosk.helpDesk ? (
              <>Un souci ? Vie scolaire, <span className="font-mono text-ink">{kiosk.helpDesk.toLowerCase()}</span></>
            ) : (
              "Un souci ? Adressez-vous à la vie scolaire"
            )}
          </span>
        </>
      ) : (
        <>
          <span className="font-mono">
            Objely Kiosk v{VERSION} · {kiosk.school} · {kiosk.station}
          </span>
          <span>Vos données restent au lycée (RGPD)</span>
        </>
      )}
    </footer>
  );
}
