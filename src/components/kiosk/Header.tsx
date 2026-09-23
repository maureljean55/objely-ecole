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

function useClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Header({ variant }: { variant: "home" | "wizard" }) {
  const pathname = usePathname();
  const time = useClock();

  return (
    <header className="relative z-20 flex h-[84px] shrink-0 items-stretch justify-between border-b-2 border-line bg-white px-8">
      <div className="flex items-center gap-3">
        <LogoMark height={38} priority />
        <span className="font-display text-[26px] font-extrabold tracking-tight text-ink">Objely</span>
        <span aria-hidden="true" className="mx-1 h-6 w-0.5 bg-line" />
        <span className="text-body-lg text-slate">{KIOSK.school}</span>
      </div>

      {variant === "wizard" && (
        <nav aria-label="Navigation de la borne" className="flex items-stretch gap-1">
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
                {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-0.5 h-1 bg-accent" />}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-3 text-body-md text-slate">
        <span>{KIOSK.station}</span>
        <span className="min-w-[56px] font-mono text-label-lg tabular-nums text-ink">{time ?? " "}</span>
      </div>
    </header>
  );
}
