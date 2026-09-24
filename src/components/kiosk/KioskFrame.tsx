"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { isPhonePage } from "./KioskProvider";
import { FRAME } from "@/lib/kiosk";

// Every screen is laid out for one fixed 1194×834 tablet frame. Rather than
// reflowing, the frame is scaled to fit whatever screen it runs on, so the
// borne looks identical on the iPad and in a desktop browser.
export function KioskFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / FRAME.width, window.innerHeight / FRAME.height));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // A phone page is laid out for the phone itself, not scaled down from the tablet frame.
  if (isPhonePage(pathname)) return <>{children}</>;

  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas">
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-canvas"
        style={{
          width: FRAME.width,
          height: FRAME.height,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}
