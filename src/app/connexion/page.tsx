"use client";

import { useRef, useState } from "react";
import { LogoMark } from "@/components/kiosk/LogoMark";
import { usePairing } from "@/components/kiosk/KioskProvider";

const CODE_LENGTH = 6;

const MESSAGES = {
  invalid: "Ce code est incorrect ou a expiré.",
  rate_limited: "Trop d'essais. Patientez quelques minutes.",
  network: "Connexion impossible. Vérifiez le réseau de la borne.",
  not_configured: "La borne n'est pas configurée.",
} as const;

// The only thing a borne needs before it can be used: the code shown in the administration when it was added.
export default function ConnexionPage() {
  const pair = usePairing();
  const [code, setCode] = useState("");
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
    inputRef.current?.focus();
  }

  function change(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    // Six digits is a complete code: no button to press.
    if (digits.length === CODE_LENGTH) void submit(digits);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 bg-canvas px-10">
      <div className="flex items-center gap-4">
        <LogoMark height={64} priority />
        <span className="font-display text-[46px] font-extrabold leading-none tracking-tight text-ink">Objely</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => change(e.target.value)}
          disabled={busy}
          autoFocus
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          enterKeyHint="go"
          aria-label="Code de la borne"
          aria-invalid={error ? true : undefined}
          placeholder={busy ? "Vérification…" : "Code de la borne"}
          className={`h-[88px] w-[560px] rounded-[28px] border-2 bg-white text-center font-mono text-[40px] font-semibold tracking-[0.5em] text-ink caret-blue outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-[26px] placeholder:font-medium placeholder:tracking-normal placeholder:text-slate/60 focus:shadow-[0_0_0_5px_rgba(31,99,224,0.18)] disabled:opacity-70 ${
            error ? "border-danger animate-shake" : "border-line-strong focus:border-blue"
          }`}
        />
        <p role="alert" className="h-6 text-body-lg font-medium text-danger">
          {error ? MESSAGES[error] : ""}
        </p>
      </div>
    </div>
  );
}
