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
    const tick = () =>
      setTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
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
    <header className="glass relative z-20 flex h-[84px] shrink-0 items-center justify-between border-b border-line px-8">
      <div className="flex items-center gap-3.5">
        <LogoMark height={40} priority />
        <span className="text-h-md font-bold tracking-tight text-ink">Objely</span>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-line-strong" />
        <span className="text-body-lg text-slate">{KIOSK.school}</span>
      </div>

      {variant === "wizard" && (
        <nav aria-label="Navigation de la borne" className="flex items-center gap-2">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press flex h-[52px] items-center rounded-xl px-5 text-label-lg ${
                  active ? "bg-selected text-blue-ink" : "text-slate hover:bg-canvas hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-2.5 rounded-full bg-canvas px-4 py-2 ring-1 ring-line">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-blue" />
        </span>
        <span className="text-label-md text-ink">{variant === "home" ? KIOSK.station : "Borne active"}</span>
        {variant === "home" && (
          <span className="min-w-[52px] rounded-md bg-white px-1.5 py-0.5 text-center text-label-sm tabular-nums text-slate">
            {time ?? " "}
          </span>
        )}
      </div>
    </header>
  );
}
