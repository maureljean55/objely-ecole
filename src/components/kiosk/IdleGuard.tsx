"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useKiosk } from "@/components/kiosk/KioskProvider";
import { IDLE_WARNING_SECONDS } from "@/lib/kiosk";
import { useDeclaration } from "@/lib/declaration";
import { Button } from "./Button";

const IdleContext = createContext<number>(90);

/** Seconds left before the borne wipes the form and returns to the home screen. */
export function useIdleRemaining() {
  return useContext(IdleContext);
}

// A borne is shared: whoever walks away mid-form must not leave their
// details on screen for the next student.
export function IdleGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { reset } = useDeclaration();
  const { idleSeconds } = useKiosk();
  const lastTouch = useRef(0);
  const [remaining, setRemaining] = useState<number>(idleSeconds);

  const touch = useCallback(() => {
    lastTouch.current = Date.now();
    setRemaining(idleSeconds);
  }, [idleSeconds]);

  useEffect(() => {
    lastTouch.current = Date.now();
    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const id = setInterval(() => {
      const left = idleSeconds - Math.floor((Date.now() - lastTouch.current) / 1000);
      setRemaining(Math.max(left, 0));
      if (left <= 0) {
        reset();
        router.replace("/");
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(id);
    };
  }, [touch, reset, router, idleSeconds]);

  return (
    <IdleContext.Provider value={remaining}>
      {children}
      {remaining <= IDLE_WARNING_SECONDS && remaining > 0 && (
        <div
          role="alertdialog"
          aria-labelledby="idle-title"
          className="absolute inset-0 z-50 flex items-center justify-center bg-ink/60"
        >
          <div className="flex w-[520px] flex-col gap-5 rounded-card border-2 border-ink bg-white p-8 shadow-sheet">
            <div>
              <h2 id="idle-title" className="text-h-lg text-ink">
                Vous êtes toujours là ?
              </h2>
              <p className="mt-2 text-body-lg text-slate">
                Sans réponse, la borne efface votre saisie dans{" "}
                <strong className="whitespace-nowrap font-mono tabular-nums text-ink">{remaining} s</strong>.
              </p>
            </div>
            <Button onClick={touch} className="w-full">
              Je continue
            </Button>
          </div>
        </div>
      )}
    </IdleContext.Provider>
  );
}
