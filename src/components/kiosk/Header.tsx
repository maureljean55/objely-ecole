"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { KIOSK } from "@/lib/kiosk";
import { LogoMark } from "./LogoMark";

const NAV = [
  { href: "/", label: "Déclarer un objet", match: (p: string) => p === "/" || p.startsWith("/declarer") },
  { href: "/rechercher", label: "Rechercher", match: (p: string) => p.startsWith("/rechercher") },
  { href: "/assistance", label: "Assistance", match: (p: string) => p.startsWith("/assistance") },
];

// Read after mount only: the server can't know the visitor's time.
function useNow() {
  const [now, setNow] = useState<{ time: string; date: string } | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({
        time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
      });
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Header({ variant }: { variant: "home" | "wizard" }) {
  const pathname = usePathname();
  const now = useNow();

  return (
    <header
      className="relative z-20 flex h-[84px] shrink-0 items-stretch justify-between gap-6 border-b-2 border-line px-8"
      // Same soft cyan/violet glow as the Objely app's header, kept faint so text stays crisp.
      style={{
        background:
          "radial-gradient(circle 420px at 50% -70px, rgba(56, 211, 255, 0.22) 0%, transparent 70%), radial-gradient(circle 360px at 100% 10px, rgba(145, 115, 255, 0.16) 0%, transparent 70%), #ffffff",
      }}
    >
      {/* Brand + establishment */}
      <div className="flex items-center gap-3.5">
        <LogoMark height={48} priority />
        <span className="font-display text-[32px] font-extrabold leading-none tracking-tight text-ink">Objely</span>
        <span aria-hidden="true" className="mx-1.5 h-9 w-0.5 rounded-full bg-line-strong" />
        <div className="leading-none">
          <p className="text-label-sm font-semibold uppercase tracking-[0.16em] text-slate">{KIOSK.schoolType}</p>
          <p className="mt-1 font-display text-[22px] font-bold tracking-tight text-ink">{KIOSK.schoolName}</p>
        </div>
      </div>

      {variant === "wizard" && (
        <nav aria-label="Navigation de la borne" className="flex items-stretch">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center px-5 text-label-lg ${active ? "text-ink" : "text-slate hover:text-ink"}`}
              >
                {item.label}
                {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-0.5 h-1 rounded-t-sm bg-accent" />}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Borne + clock, like a station board */}
      <div className="flex flex-col items-end justify-center gap-1 text-right">
        <p className="flex items-baseline gap-3">
          <span className="inline-block text-label-sm font-medium text-slate first-letter:uppercase">{now?.date ?? " "}</span>
          <span className="font-mono text-[30px] font-semibold leading-none tabular-nums text-ink">{now?.time ?? "--:--"}</span>
        </p>
        <p className="text-label-sm font-medium text-slate">{KIOSK.station}</p>
      </div>
    </header>
  );
}
