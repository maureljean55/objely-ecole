"use client";

import { useRef, useState } from "react";
import { LogoMark } from "@/components/kiosk/LogoMark";
import { usePairing } from "@/components/kiosk/KioskProvider";

const CODE_LENGTH = 6;

const MESSAGES = {
  invalid: "Ce code ne correspond à aucune borne. Vérifiez-le auprès de la vie scolaire.",
  rate_limited: "Trop d'essais. Patientez quelques minutes.",
  network: "Connexion impossible. Vérifiez le réseau de la borne.",
  not_configured: "La borne n'est pas configurée.",
} as const;

// The only thing a borne needs before it can be used: the code (#A7K9Q2) shown in the administration when it was added.
export default function ConnexionPage() {
  const pair = usePairing();
  const [code, setCode] = useState("");
  // Show the "#" as soon as it is typed, even before the first character.
  const [hash, setHash] = useState(false);
  const [error, setError] = useState<keyof typeof MESSAGES | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(value: string) {
    setBusy(true);
    setError(null);
    const result = await pair(value);
    if (result.ok) return; // the provider now moves on to the home screen
    setBusy(false);
    setError(result.reason);
    setCode("");
    setHash(false);
    inputRef.current?.focus();
  }

  function change(raw: string) {
    // The code is "#" + 6 letters/digits (#A7K9Q2). Whatever is typed or pasted ("#a7k9q2", "A7K 9Q2", "a7k9q2"…) is
    // reduced to its 6 characters, in capitals, and shown with its "#" — including a lone "#" typed first.
    const chars = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, CODE_LENGTH);
    setCode(chars);
    setHash(chars.length > 0 || raw.includes("#"));
    setError(null);
  }

  const complete = code.length === CODE_LENGTH;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 bg-canvas px-10">
      <div className="flex items-center gap-4">
        <LogoMark height={64} priority />
        <span className="font-display text-[46px] font-extrabold leading-none tracking-tight text-ink">Objely</span>
      </div>

      <form
        className="flex flex-col items-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete && !busy) void submit(code);
        }}
      >
        <input
          ref={inputRef}
          value={hash ? `#${code}` : ""}
          onChange={(e) => change(e.target.value)}
          disabled={busy}
          autoFocus
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="go"
          aria-label="Code de la borne"
          aria-invalid={error ? true : undefined}
          placeholder={busy ? "Vérification…" : "Code de la borne"}
          className={`h-[88px] w-[560px] rounded-[28px] border-2 bg-white text-center font-mono text-[40px] font-semibold tracking-[0.3em] text-ink caret-blue outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-[26px] placeholder:font-medium placeholder:tracking-normal placeholder:text-slate/60 focus:shadow-[0_0_0_5px_rgba(31,99,224,0.18)] disabled:opacity-70 ${
            error ? "border-danger animate-shake" : "border-line-strong focus:border-blue"
          }`}
        />
        <button
          type="submit"
          disabled={!complete || busy}
          className="press h-[64px] w-[560px] rounded-[20px] bg-blue text-label-xl text-white transition-opacity disabled:opacity-40"
        >
          {busy ? "Connexion…" : "Connexion"}
        </button>
        <p role="alert" className="h-6 text-body-lg font-medium text-danger">
          {error ? MESSAGES[error] : ""}
        </p>
      </form>
    </div>
  );
}
