"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useKiosk } from "@/components/kiosk/KioskProvider";
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
  const kiosk = useKiosk();

  return (
    <header className="glass-bar absolute inset-x-8 top-2 z-20 flex h-[68px] items-center justify-between gap-6 rounded-[34px] px-6">
      {/* Brand + establishment */}
      <div className="flex items-center gap-3">
        <LogoMark height={42} priority />
        <span
          className="font-display text-[30px] font-extrabold leading-none tracking-tight"
          style={{
            backgroundImage: "linear-gradient(90deg, #087be8, #735af4, #a34ee9)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Objely
        </span>
        <span aria-hidden="true" className="mx-1 h-8 w-0.5 rounded-full bg-ink/20" />
        <div className="leading-none">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate">{kiosk.schoolType}</p>
          <p className="mt-1 font-display text-[20px] font-bold tracking-tight text-ink">{kiosk.schoolName}</p>
        </div>
      </div>

      {variant === "wizard" && (
        <nav aria-label="Navigation de la borne" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press flex h-[52px] items-center rounded-full px-5 text-label-lg ${
                  active ? "glass-tab-active text-accent" : "text-slate hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Borne + clock, like a station board */}
      <div className="flex flex-col items-end justify-center gap-1 text-right">
        <p className="flex items-baseline gap-3">
          <span className="inline-block text-label-sm font-medium text-slate first-letter:uppercase">{now?.date ?? " "}</span>
          <span className="font-mono text-[28px] font-semibold leading-none tabular-nums text-ink">{now?.time ?? "--:--"}</span>
        </p>
        <p className="text-[13px] font-medium leading-none text-slate">{kiosk.station}</p>
      </div>
    </header>
  );
}
