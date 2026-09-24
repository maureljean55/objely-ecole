"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { KioskConfig } from "@/lib/kiosk";
import { fetchConfig, pairKiosk, readPaired, savePaired, type PairResult } from "@/lib/pairing";

// Heartbeat: every borne call updates its "last seen" time, which the administration shows as online/offline.
const HEARTBEAT_MS = 4 * 60_000;

type Status = "checking" | "unpaired" | "ready";
type Ctx = { config: KioskConfig | null; pair: (code: string) => Promise<PairResult> };

const KioskContext = createContext<Ctx>({ config: null, pair: async () => ({ ok: false, reason: "network" }) });

/** This borne's settings. Only available once paired: every page except /connexion is behind that. */
export function useKiosk(): KioskConfig {
  const { config } = useContext(KioskContext);
  if (!config) throw new Error("useKiosk must be used on a page shown after pairing");
  return config;
}
export const usePairing = () => useContext(KioskContext).pair;

export function KioskProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("checking");
  const [config, setConfig] = useState<KioskConfig | null>(null);

  // On start: use the saved pairing right away (a borne must open even if the network is down), then check it.
  useEffect(() => {
    // localStorage does not exist on the server, so the saved pairing can only be read after mount.
    const saved = readPaired();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!saved) {
      setStatus("unpaired");
      return;
    }
    setConfig(saved.config);
    setStatus("ready");
    /* eslint-enable react-hooks/set-state-in-effect */

    let stopped = false;
    const check = async () => {
      const result = await fetchConfig(saved.token);
      if (stopped) return;
      if (result.ok) {
        setConfig(result.config);
        savePaired({ token: saved.token, config: result.config });
      } else if (result.reason === "revoked") {
        // The borne was removed in the administration: back to the code screen.
        savePaired(null);
        setConfig(null);
        setStatus("unpaired");
      }
    };
    void check();
    const id = setInterval(check, HEARTBEAT_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  const pair = useCallback(async (code: string) => {
    const result = await pairKiosk(code);
    if (result.ok) {
      setConfig(result.paired.config);
      setStatus("ready");
    }
    return result;
  }, []);

  const onCode = pathname === "/connexion";
  useEffect(() => {
    if (status === "unpaired" && !onCode) router.replace("/connexion");
    if (status === "ready" && onCode) router.replace("/");
  }, [status, onCode, router]);

  // Nothing of the borne is shown before it is paired (and no flash of the wrong screen while redirecting).
  const visible = status === "unpaired" ? onCode : status === "ready" ? !onCode : false;

  return <KioskContext.Provider value={{ config, pair }}>{visible ? children : null}</KioskContext.Provider>;
}
