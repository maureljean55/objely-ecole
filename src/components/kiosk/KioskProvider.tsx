"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { KioskConfig } from "@/lib/kiosk";
import { fetchConfig, fetchKioskChannel, pairKiosk, readPaired, savePaired, type PairResult } from "@/lib/pairing";
import { getSupabase } from "@/lib/supabase";
import { Icon } from "./Icon";
import { LogoMark } from "./LogoMark";

// Heartbeat: every borne call updates its "last seen" time, which the administration shows as online/offline.
// A pause or suspension normally reaches the borne at once (Realtime "check" nudge from the database); this regular
// check is the fallback if that message is missed.
const HEARTBEAT_MS = 60_000;

// Rechercher / Suivre / Assistance: back to the home screen after this long without a touch, so the borne never stays
// on a page someone left (the declaration steps have their own countdown, see IdleGuard).
const BROWSE_IDLE_MS = 2 * 60_000;
const BROWSE_PAGES = ["/rechercher", "/suivi", "/assistance"];

// The build this page was loaded with; /api/version answers with the build currently online.
const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

type Status = "checking" | "unpaired" | "ready" | "suspended" | "paused";
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

  // On start: use the saved pairing right away (a borne must open even if the network is down).
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
  }, []);

  // While paired: check the borne's state now, every minute, and whenever the database nudges it.
  useEffect(() => {
    if (!token) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      clearTimeout(timer);
      const result = await fetchConfig(token);
      if (stopped) return;
      timer = setTimeout(check, HEARTBEAT_MS);
      if (result.ok) {
        setConfig(result.config);
        setStatus("ready");
        savePaired({ token, config: result.config });
      } else if (result.reason === "suspended" || result.reason === "paused") {
        setStatus(result.reason);
      } else if (result.reason === "revoked") {
        // The borne was removed in the administration: back to the code screen.
        savePaired(null);
        setConfig(null);
        setToken(null);
        setStatus("unpaired");
      }
    };
    void check();

    // Realtime nudge: the database says "check now" on this borne's topic when it is paused / resumed or when the
    // establishment is suspended / reactivated. The message is only a trigger: the state always comes from check().
    const db = getSupabase();
    let channel: ReturnType<NonNullable<typeof db>["channel"]> | null = null;
    void fetchKioskChannel(token).then((id) => {
      if (stopped || !id || !db) return;
      channel = db.channel(`kiosk:${id}`).on("broadcast", { event: "check" }, () => void check()).subscribe();
    });
    // Coming back to a tab that was asleep: check at once.
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel && db) void db.removeChannel(channel);
    };
  }, [token]);

  const browsing = status === "ready" && BROWSE_PAGES.some((p) => pathname.startsWith(p));
  useEffect(() => {
    if (!browsing) return;
    let timer = setTimeout(() => router.replace("/"), BROWSE_IDLE_MS);
    const touch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.replace("/"), BROWSE_IDLE_MS);
    };
    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [browsing, pathname, router]);

  // A borne stays open for days: when a new version is online, reload — only on the home or code screen, never in the
  // middle of someone's declaration.
  const idleScreen = pathname === "/" || pathname === "/connexion";
  useEffect(() => {
    if (!BUILD || !idleScreen) return;
    let stopped = false;
    const look = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { build } = (await res.json()) as { build?: string };
        if (!stopped && build && build !== BUILD) window.location.reload();
      } catch {
        // Offline: try again at the next round.
      }
    };
    void look();
    const id = setInterval(look, 5 * 60_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [idleScreen]);

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

  if ((status === "suspended" || status === "paused") && !onPhone) {
    return <SuspendedScreen schoolName={config?.school} paused={status === "paused"} />;
  }

  return <KioskContext.Provider value={{ config, token, pair }}>{visible ? children : null}</KioskContext.Provider>;
}

// Shown instead of the borne while Objely has suspended the establishment, or the establishment has paused this borne.
// Nothing is lost: the borne keeps its pairing and goes back to the home screen by itself once reactivated.
function SuspendedScreen({ schoolName, paused }: { schoolName?: string; paused: boolean }) {
  return (
    <main className="flex size-full flex-col items-center justify-center gap-6 px-16 text-center">
      <LogoMark height={48} priority />
      <span className={`flex size-20 items-center justify-center rounded-full ${paused ? "bg-accent-tint text-accent" : "bg-danger-tint text-danger"}`}>
        {paused ? <Icon name="pause_circle" size={40} /> : <Icon name="block" size={40} />}
      </span>
      <div className="max-w-[640px]">
        <h1 className="text-h-xl text-ink">{paused ? "Borne en pause" : "Borne momentanément indisponible"}</h1>
        <p className="mt-3 text-body-xl text-slate">
          {paused
            ? "Cette borne a été mise en pause par l'établissement. "
            : schoolName
              ? `Les déclarations sont suspendues pour ${schoolName}. `
              : "Les déclarations sont suspendues pour cet établissement. "}
          Pour déclarer un objet perdu ou trouvé, adressez-vous à la vie scolaire.
        </p>
      </div>
    </main>
  );
}
