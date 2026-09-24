"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/kiosk/Button";
import { Icon } from "@/components/kiosk/Icon";
import { useKioskToken } from "@/components/kiosk/KioskProvider";
import { Screen } from "@/components/kiosk/Screen";
import { TextField } from "@/components/wizard/Fields";
import { trackDeclaration, type Stage, type Tracked } from "@/lib/tracking";

// A result stays on screen at most this long: the borne is shared, the next student must not find it.
const RESULT_MS = 60_000;

const ERRORS = {
  not_found: "Aucune déclaration ne correspond. Vérifiez le numéro de votre ticket et votre nom de famille.",
  rate_limited: "Trop de recherches sur cette borne. Réessayez dans quelques minutes.",
  network: "La recherche n'a pas abouti. Vérifiez le réseau de la borne et réessayez.",
} as const;

// The steps shown for each side, and which one each stage reaches.
const STEPS = {
  perdu: ["Déclaration reçue", "Recherche en cours", "Objet retrouvé", "Objet rendu"],
  trouve: ["Déclaration reçue", "Objet déposé", "Rendu à son propriétaire"],
} as const;
const REACHED: Record<Stage, number> = { searching: 1, match: 2, returned: 3, closed: 0, to_deposit: 0, deposited: 1, donated: 1 };

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

function message(t: Tracked): { icon: string; title: string; text: string; tone: "accent" | "ok" | "slate" } {
  switch (t.stage) {
    case "searching":
      return { icon: "manage_search", tone: "accent", title: "Recherche en cours", text: "La vie scolaire compare votre déclaration aux objets qu'on lui dépose. Revenez vérifier dans quelques jours : vous serez aussi prévenu si un objet correspond." };
    case "match":
      return { icon: "notifications_active", tone: "ok", title: "Un objet correspond !", text: "Passez au bureau de la vie scolaire avec votre carte d'élève pour le récupérer." };
    case "returned":
      return t.kind === "perdu"
        ? { icon: "task_alt", tone: "ok", title: "Objet rendu", text: `Votre objet vous a été rendu le ${date(t.updatedAt)}. Dossier clos.` }
        : { icon: "volunteer_activism", tone: "ok", title: "Rendu à son propriétaire", text: `L'objet a retrouvé son propriétaire le ${date(t.updatedAt)}. Merci pour votre geste !` };
    case "to_deposit":
      return { icon: "front_hand", tone: "accent", title: "Objet à déposer", text: "Pensez à déposer l'objet au bureau de la vie scolaire : il sera enregistré et son propriétaire pourra le récupérer." };
    case "deposited":
      return { icon: "inventory_2", tone: "ok", title: "Objet bien déposé", text: "Merci ! L'objet est gardé à la vie scolaire, qui recherche son propriétaire." };
    case "donated":
      return { icon: "redeem", tone: "slate", title: "Non réclamé", text: "Personne n'a réclamé l'objet dans le délai de conservation : il sera donné." };
    default:
      return { icon: "inventory", tone: "slate", title: "Déclaration clôturée", text: "La vie scolaire a clôturé cette déclaration. Pour toute question, adressez-vous à elle." };
  }
}

export default function SuiviPage() {
  const token = useKioskToken();
  const [reference, setReference] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof ERRORS | null>(null);
  const [tracked, setTracked] = useState<Tracked | null>(null);
  const refInput = useRef<HTMLInputElement>(null);

  // Clear the result (and what was typed) after a while.
  useEffect(() => {
    if (!tracked) return;
    const id = setTimeout(() => {
      setTracked(null);
      setReference("");
      setLastName("");
    }, RESULT_MS);
    return () => clearTimeout(id);
  }, [tracked]);

  // "#DL482" (or an older "DEC-1042"): letters and digits only are sent, the database adds back the format.
  const typed = reference.replace(/[^A-Za-z0-9]/g, "");
  const canSubmit = typed.length >= 4 && lastName.trim().length > 0 && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = await trackDeclaration(token, typed, lastName);
    setBusy(false);
    if (result.ok) setTracked(result.tracked);
    else {
      setTracked(null);
      setError(result.reason);
    }
  }

  function startOver() {
    setTracked(null);
    setReference("");
    setLastName("");
    setError(null);
    refInput.current?.focus();
  }

  return (
    <Screen variant="wizard" kind={tracked?.kind}>
      <div className="mx-auto flex h-full w-full max-w-[1194px] gap-6 px-8 pb-6 pt-4">
        <form onSubmit={submit} noValidate className="flex w-[430px] shrink-0 flex-col gap-5 rounded-card border-2 border-line bg-white p-7">
          <div>
            <h1 className="text-h-xl text-ink">Suivre ma déclaration</h1>
            <p className="mt-1 text-body-lg text-slate">Le numéro est sur le ticket affiché à la fin de votre déclaration.</p>
          </div>

          <TextField
            label="Numéro du ticket"
            inputRef={refInput}
            value={reference}
            onChange={(v) => {
              // Shown as typed on the ticket: "#" + capitals, whatever the student types or leaves out.
              const chars = v.replace(/[^A-Za-z0-9-]/g, "").toUpperCase().slice(0, 9);
              setReference(chars && !chars.startsWith("DEC") ? `#${chars}` : chars);
              setError(null);
            }}
            icon="confirmation_number"
            autoCapitalize="characters"
            placeholder="#DL482"
            aside="2 lettres + 3 chiffres"
            autoFocus
            className="font-mono tracking-[0.08em]"
          />
          <TextField
            label="Votre nom de famille"
            value={lastName}
            onChange={(v) => {
              setLastName(v.slice(0, 80));
              setError(null);
            }}
            icon="person"
            placeholder="Dupont"
            autoCapitalize="words"
            note="Demandé pour que personne d'autre ne voie votre déclaration."
          />

          <p role="alert" className="min-h-[44px] text-label-md font-semibold text-danger">{error ? ERRORS[error] : ""}</p>

          <Button type="submit" icon="search" disabled={!canSubmit} className="mt-auto w-full disabled:opacity-40">
            {busy ? "Recherche…" : "Voir où elle en est"}
          </Button>
        </form>

        <section aria-live="polite" className="flex min-w-0 flex-1 flex-col rounded-card border-2 border-line bg-white p-7">
          {tracked ? <Result tracked={tracked} onDone={startOver} /> : <Placeholder />}
        </section>
      </div>
    </Screen>
  );
}

function Placeholder() {
  return (
    <div className="m-auto flex max-w-[440px] flex-col items-center gap-4 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
        <Icon name="manage_search" size={40} />
      </span>
      <p className="text-h-lg text-ink">Où en est votre objet ?</p>
      <p className="text-body-lg text-slate">
        Tapez le numéro de votre ticket (par exemple <span className="whitespace-nowrap font-mono font-semibold text-ink">#DL482</span>) et votre nom de famille : vous verrez
        tout de suite si votre objet a été retrouvé.
      </p>
    </div>
  );
}

function Result({ tracked: t, onDone }: { tracked: Tracked; onDone: () => void }) {
  const m = message(t);
  const steps = STEPS[t.kind];
  const reached = REACHED[t.stage];
  const toneClass = m.tone === "ok" ? "bg-ok/10 text-ok" : m.tone === "accent" ? "bg-accent-tint text-accent" : "bg-line/60 text-slate";

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-label-sm font-semibold uppercase tracking-wider text-accent">
            {t.kind === "perdu" ? "Objet perdu" : "Objet trouvé"} · {t.reference}
          </p>
          <p className="mt-1 truncate text-h-xl text-ink">{t.objectName}</p>
          <p className="mt-1 text-body-md text-slate">Déclaré le {date(t.createdAt)}</p>
        </div>
      </div>

      <ol className="flex items-start">
        {steps.map((label, i) => {
          const done = i <= reached;
          const current = i === reached;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2 text-center">
              <div className="flex w-full items-center">
                <span className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : done ? "bg-accent" : "bg-line"}`} />
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-label-md font-semibold ${
                    done ? "border-accent bg-accent text-white" : "border-line-strong bg-white text-slate"
                  } ${current ? "shadow-[0_0_0_5px_color-mix(in_srgb,var(--accent)_22%,transparent)]" : ""}`}
                >
                  {done && !current ? <Icon name="check" size={20} /> : i + 1}
                </span>
                <span className={`h-1 flex-1 rounded-full ${i === steps.length - 1 ? "opacity-0" : i < reached ? "bg-accent" : "bg-line"}`} />
              </div>
              <span className={`px-1 text-label-md ${current ? "font-semibold text-ink" : done ? "text-ink" : "text-slate"}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className={`flex items-start gap-4 rounded-card p-5 ${toneClass}`}>
        <Icon name={m.icon} size={32} />
        <div>
          <p className="text-h-md">{m.title}</p>
          <p className="mt-1 text-body-lg text-ink">{m.text}</p>
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <Button variant="secondary" icon="refresh" iconPosition="start" onClick={onDone}>
          Nouvelle recherche
        </Button>
      </div>
    </div>
  );
}
