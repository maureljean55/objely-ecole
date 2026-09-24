"use client";

import { useEffect, useState } from "react";
import { useKioskToken } from "@/components/kiosk/KioskProvider";
import { Button } from "@/components/kiosk/Button";
import { listObjects, type ListedObject } from "@/lib/objects";
import { ObjectBrowser } from "./ObjectBrowser";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; objects: ListedObject[] };

// Loads the objects in stock from the database each time the page opens: what a visitor sees is what is in the drawer now.
export function SearchPage() {
  const token = useKioskToken();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listObjects(token).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: "ready", objects: result.objects } : { status: "error", message: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  if (state.status === "ready") return <ObjectBrowser objects={state.objects} />;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-10 text-center">
      {state.status === "loading" ? (
        <p className="text-h-md text-slate">Chargement des objets…</p>
      ) : (
        <>
          <p className="max-w-[560px] text-h-md text-ink">{state.message}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Réessayer
          </Button>
        </>
      )}
    </div>
  );
}
