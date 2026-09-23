import { KIOSK } from "@/lib/kiosk";

export function Footer({ variant }: { variant: "home" | "wizard" }) {
  return (
    <footer className="flex h-16 shrink-0 items-center justify-between border-t-2 border-line bg-white px-8 text-label-sm font-medium text-slate">
      {variant === "home" ? (
        <>
          <span>Touchez un bouton pour commencer</span>
          <span>
            Un souci ? Vie scolaire, <span className="font-mono text-ink">{KIOSK.helpDesk.toLowerCase()}</span>
          </span>
        </>
      ) : (
        <>
          <span className="font-mono">
            Objely Kiosk v{KIOSK.version} · {KIOSK.school} · {KIOSK.station}
          </span>
          <span>Vos données restent au lycée (RGPD)</span>
        </>
      )}
    </footer>
  );
}
