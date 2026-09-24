"use client";

import { useKiosk } from "@/components/kiosk/KioskProvider";
import { VERSION } from "@/lib/kiosk";
import { Icon } from "./Icon";

// The header's twin: the same floating glass bar, same side margins (32px), pinned to the bottom. It sits in the 64px
// band the screens are laid out for (a 52px bar with page colour around it), so no screen has to move.
export function Footer({ variant }: { variant: "home" | "wizard" }) {
  const kiosk = useKiosk();

  return (
    <footer className="flex h-16 shrink-0 items-center px-8 pb-1.5 pt-1">
      <div className="glass-bar relative flex h-[52px] w-full items-center justify-between gap-6 rounded-full pl-1.5 pr-6">
        {variant === "home" ? (
          <p className="flex min-w-0 items-center gap-3 whitespace-nowrap text-label-md text-ink">
            <Chip>
              <Icon name="touch_app" size={20} />
            </Chip>
            <span>Touchez un bouton pour commencer</span>
          </p>
        ) : (
          <p className="flex min-w-0 items-center gap-3 whitespace-nowrap text-label-md text-ink">
            <Chip>
              <Icon name="verified_user" size={20} />
            </Chip>
            <span>
              Vos données restent dans l&apos;établissement <span className="text-slate">· conforme RGPD</span>
            </span>
          </p>
        )}

        <div className="flex shrink-0 items-center gap-4 whitespace-nowrap">
          <p className="flex items-center gap-2 text-label-md text-slate">
            <Icon name="support_agent" size={20} className="text-ink" />
            <span>
              Besoin d&apos;aide ? <span className="font-semibold text-ink">Vie scolaire</span>
            </span>
            {kiosk.helpDesk && (
              <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-label-sm font-semibold tabular-nums text-ink shadow-[inset_0_0_0_1px_rgba(16,26,54,0.08)]">
                {kiosk.helpDesk}
              </span>
            )}
          </p>
          <span aria-hidden="true" className="h-6 w-0.5 rounded-full bg-ink/15" />
          <p className="font-mono text-label-sm font-medium uppercase tracking-[0.12em] text-slate">Objely Kiosk v{VERSION}</p>
        </div>
      </div>
    </footer>
  );
}

// A round, brighter piece of glass holding an icon, like the header's active tab.
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="glass-tab-active flex size-10 items-center justify-center rounded-full text-accent">{children}</span>;
}
