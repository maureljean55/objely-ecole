"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { KioskConfig } from "@/lib/kiosk";
import { fetchConfig, pairKiosk, readPaired, savePaired, type PairResult } from "@/lib/pairing";
import { Icon } from "./Icon";
import { LogoMark } from "./LogoMark";

// Heartbeat: every borne call updates its "last seen" time, which the administration shows as online/offline.
const HEARTBEAT_MS = 4 * 60_000;
// While the establishment is suspended, check more often so the borne comes back soon after it is reactivated.
const SUSPENDED_CHECK_MS = 60_000;

type Status = "checking" | "unpaired" | "ready" | "suspended";
type Ctx = { config: KioskConfig | null; token: string | null; pair: (code: string) => Promise<PairResult> };

const KioskContext = createContext<Ctx>({ config: null, token: null, pair: async () => ({ ok: false, reason: "network" }) });

/** This borne's settings. Only available once paired: every page except /connexion is behind that. */
export function useKiosk(): KioskConfig {
  const { config } = useContext(KioskContext);
  if (!config) throw new Error("useKiosk must be used on a page shown after pairing");
  return config;
}
export const usePairing = () => useContext(KioskContext).pair;

/** The borne's own secret, used to call the database. Only on pages shown after pairing. */
export function useKioskToken(): string {
  const { token } = useContext(KioskContext);
  if (!token) throw new Error("useKioskToken must be used on a page shown after pairing");
  return token;
}

/** Pages opened on a visitor's phone rather than on the borne. */
export const isPhonePage = (pathname: string) => pathname.startsWith("/depot/");

export function KioskProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("checking");
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);

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
    setToken(saved.token);
    setStatus("ready");
    /* eslint-enable react-hooks/set-state-in-effect */

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const result = await fetchConfig(saved.token);
      if (stopped) return;
      const suspended = !result.ok && result.reason === "suspended";
      timer = setTimeout(check, suspended ? SUSPENDED_CHECK_MS : HEARTBEAT_MS);
      if (result.ok) {
        setConfig(result.config);
        setStatus("ready");
        savePaired({ token: saved.token, config: result.config });
      } else if (suspended) {
        setStatus("suspended");
      } else if (result.reason === "revoked") {
        // The borne was removed in the administration: back to the code screen.
        savePaired(null);
        setConfig(null);
        setToken(null);
        setStatus("unpaired");
      }
    };
    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  const pair = useCallback(async (code: string) => {
    const result = await pairKiosk(code);
    if (result.ok) {
      setConfig(result.paired.config);
      setToken(result.paired.token);
      setStatus("ready");
    }
    return result;
  }, []);

  const onCode = pathname === "/connexion";
  // /depot/… is opened on a visitor's own phone (from the QR code of the photo step): it is not a borne and is never paired.
  const onPhone = isPhonePage(pathname);
  useEffect(() => {
    if (onPhone) return;
    if (status === "unpaired" && !onCode) router.replace("/connexion");
    if (status === "ready" && onCode) router.replace("/");
  }, [status, onCode, onPhone, router]);

  // Nothing of the borne is shown before it is paired (and no flash of the wrong screen while redirecting).
  const visible = onPhone || (status === "unpaired" ? onCode : status === "ready" ? !onCode : false);

  if (status === "suspended" && !onPhone) return <SuspendedScreen schoolName={config?.schoolName} />;

  return <KioskContext.Provider value={{ config, token, pair }}>{visible ? children : null}</KioskContext.Provider>;
}

// Shown instead of the borne while Objely has suspended the establishment. Nothing is lost: the borne keeps its
// pairing and goes back to the home screen by itself once the establishment is reactivated.
function SuspendedScreen({ schoolName }: { schoolName?: string }) {
  return (
    <main className="flex size-full flex-col items-center justify-center gap-6 px-16 text-center">
      <LogoMark height={48} priority />
      <span className="flex size-20 items-center justify-center rounded-full bg-danger-tint text-danger">
        <Icon name="block" size={40} />
      </span>
      <div className="max-w-[640px]">
        <h1 className="text-h-xl text-ink">Borne momentanément indisponible</h1>
        <p className="mt-3 text-body-xl text-slate">
          {schoolName ? `Les déclarations sont suspendues pour ${schoolName}.` : "Les déclarations sont suspendues pour cet établissement."} Adressez-vous à la
          vie scolaire pour déclarer un objet perdu ou trouvé.
        </p>
      </div>
    </main>
  );
}
