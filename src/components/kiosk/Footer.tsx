import { KIOSK } from "@/lib/kiosk";
import { Icon } from "./Icon";

export function Footer({ variant }: { variant: "home" | "wizard" }) {
  return (
    <footer className="flex h-16 shrink-0 items-center justify-between border-t border-line bg-white/60 px-8 text-label-sm font-medium text-slate">
      {variant === "home" ? (
        <>
          <span className="flex items-center gap-2">
            <Icon name="touch_app" size={20} />
            Touchez un bouton pour commencer
          </span>
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Icon name="lock" size={18} />
              Données conformes RGPD
            </span>
            <span aria-hidden="true">·</span>
            <span>Aide vie scolaire : {KIOSK.helpDesk}</span>
          </span>
        </>
      ) : (
        <>
          <span>
            Objely Kiosk v{KIOSK.version} · {KIOSK.school} · {KIOSK.station}
          </span>
          <span className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Icon name="touch_app" size={18} />
              Interface tactile optimisée
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="shield" size={18} />
              Données protégées RGPD
            </span>
          </span>
        </>
      )}
    </footer>
  );
}
