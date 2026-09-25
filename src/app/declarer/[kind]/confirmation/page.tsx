"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/kiosk/Button";
import { Icon } from "@/components/kiosk/Icon";
import { useKioskToken } from "@/components/kiosk/KioskProvider";
import { Ticket } from "@/components/wizard/Ticket";
import { CATEGORIES, useDeclaration, type Kind } from "@/lib/declaration";
import { confirmMatch, findMatches, type Candidate } from "@/lib/instantMatch";

// Seconds before the final screen goes back home by itself (time to note or photograph the code).
const RETURN_AFTER = 90;

/** 90 → "1 min 30 s", 45 → "45 s". */
function formatLeft(seconds: number) {
  const s = Math.max(seconds, 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} min ${String(r).padStart(2, "0")} s` : `${r} s`;
}
// The search is near-instant; it stays on screen long enough to be read.
const MIN_SEARCH_MS = 2800;

/**
 * none          nothing matched (or the student said none of them)
 * claimed       lost object: the student recognised an object already at the vie scolaire
 * claimed_soon  lost object: the student recognised an object someone declared found, not deposited yet
 * owner_found   found object: it matches a lost-object declaration
 */
type Outcome = "none" | "claimed" | "claimed_soon" | "owner_found";
type Phase = { step: "searching" } | { step: "candidates"; candidates: Candidate[] } | { step: "result"; outcome: Outcome };

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export default function ConfirmationPage() {
  const router = useRouter();
  const token = useKioskToken();
  const { kind, declaration: d, ready, reset } = useDeclaration();
  const [phase, setPhase] = useState<Phase>({ step: "searching" });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [left, setLeft] = useState(RETURN_AFTER);
  // Frozen at first render: the ticket shows when it was "printed", not a ticking clock.
  const [printedAt] = useState(() =>
    new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  );

  const reference = ready ? d.reference : undefined;
  const claimObjectId = ready ? d.claimObjectId : null;
  useEffect(() => {
    if (ready && !d.reference) router.replace("/");
  }, [ready, d.reference, router]);

  // Search as soon as the declaration is known.
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    (async () => {
      // Started from "C'est le mien" in Rechercher: the object is already known, link it straight away.
      if (claimObjectId) {
        const [linked] = await Promise.all([
          confirmMatch(token, reference, { id: claimObjectId, source: "object" }),
          new Promise((r) => setTimeout(r, MIN_SEARCH_MS)),
        ]);
        if (cancelled) return;
        if (linked) return setPhase({ step: "result", outcome: "claimed" });
      }
      const [candidates] = await Promise.all([findMatches(token, reference), new Promise((r) => setTimeout(r, MIN_SEARCH_MS))]);
      if (cancelled) return;
      setPhase(candidates.length > 0 ? { step: "candidates", candidates } : { step: "result", outcome: "none" });
    })();
    return () => {
      cancelled = true;
    };
  }, [reference, token, claimObjectId]);

  const finish = () => {
    reset();
    router.replace("/");
  };

  // The countdown home only runs on the final screen.
  const onResult = phase.step === "result";
  useEffect(() => {
    if (!onResult) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [onResult]);
  useEffect(() => {
    if (onResult && left <= 0) {
      reset();
      router.replace("/");
    }
  }, [onResult, left, reset, router]);

  async function choose(candidate: Candidate) {
    if (!reference) return;
    setConfirming(candidate.id);
    const ok = await confirmMatch(token, reference, candidate);
    setConfirming(null);
    const outcome: Outcome = !ok ? "none" : kind === "trouve" ? "owner_found" : candidate.source === "object" ? "claimed" : "claimed_soon";
    setPhase({ step: "result", outcome });
  }

  if (!ready || !reference) return null;

  if (phase.step === "searching") return <Searching kind={kind} />;
  if (phase.step === "candidates") {
    return (
      <Candidates
        kind={kind}
        candidates={phase.candidates}
        confirming={confirming}
        onChoose={choose}
        onNone={() => setPhase({ step: "result", outcome: "none" })}
      />
    );
  }

  const copy = resultCopy(kind, phase.outcome);

  return (
    <div className="mx-auto flex h-full w-full max-w-[1194px] flex-col gap-3 px-8 pb-5 pt-3">
      <section className="grid min-h-0 flex-1 grid-cols-[1fr_400px] items-center gap-10">
        <div className="flex flex-col gap-6">
          <span
            className={`inline-block w-fit animate-stamp rounded-md border-[4px] px-5 py-1.5 font-mono text-[26px] font-semibold uppercase tracking-[0.18em] ${
              copy.success ? "border-ok text-ok" : "border-accent text-accent"
            }`}
          >
            {copy.stamp}
          </span>
          <div>
            <h1 className="text-h-xl text-ink">{copy.title(d.prenom)}</h1>
            <p className="mt-3 text-body-xl text-slate">{copy.lead}</p>
          </div>
          <ol className="flex flex-col gap-3">
            {copy.steps.map((text, i) => (
              <li key={text} className="flex gap-4 text-body-lg text-ink">
                <span className="w-5 shrink-0 font-mono font-semibold text-accent">{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-2 rounded-field bg-accent-tint px-4 py-3 text-body-md text-ink">
            <Icon name="confirmation_number" size={22} className="shrink-0 text-accent" />
            <span>
              Notez ou photographiez votre code <span className="font-mono font-semibold">{reference}</span> : il permet de suivre votre déclaration
              depuis la borne, dans « Suivre ».
            </span>
          </p>
        </div>

        <div className="flex justify-center">
          <Ticket
            kind={kind}
            reference={reference}
            objectName={d.objectName}
            location={d.location}
            person={`${d.prenom} ${d.nom.toUpperCase()} · ${d.classe}`}
            printedAt={printedAt}
          />
        </div>
      </section>

      <div className="flex h-[60px] shrink-0 items-center justify-between gap-6">
        <Button
          variant="secondary"
          icon="add"
          iconPosition="start"
          onClick={() => {
            reset();
            router.replace(`/declarer/${kind}/informations`);
          }}
        >
          Déclarer un autre objet
        </Button>
        <p className="text-label-sm font-medium text-slate">
          Retour à l&apos;accueil dans <span className="font-mono text-label-lg tabular-nums text-ink">{formatLeft(left)}</span>
        </p>
        <Button icon="check" onClick={finish}>
          Terminer
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- texts of the final screen

type ResultCopy = { stamp: string; success: boolean; title: (prenom: string) => string; lead: string; steps: string[] };

const PROOF = "une preuve que c'est bien à vous : photo de l'objet, facture, ou un détail que vous seul connaissez";

const RESULT: { perdu: Record<"none" | "claimed" | "claimed_soon", ResultCopy>; trouve: Record<"none" | "owner_found", ResultCopy> } = {
  perdu: {
    none: {
      stamp: "Enregistré",
      success: false,
      title: (p) => `Merci, ${p}. Aucun objet trouvé pour le moment.`,
      lead: "Votre déclaration est transmise à la vie scolaire, qui la compare à chaque objet qu'on lui dépose.",
      steps: [
        "Vous pouvez suivre votre réclamation avec ce code, depuis la borne.",
        "Si un objet correspond, la vie scolaire vous prévient.",
      ],
    },
    claimed: {
      stamp: "Retrouvé",
      success: true,
      title: (p) => `Félicitations ${p}, vous avez retrouvé votre objet !`,
      lead: "Il vous attend au service vie scolaire.",
      steps: [
        "Présentez ce code au bureau de la vie scolaire.",
        `Apportez ${PROOF}.`,
        "Après vérification, l'objet vous est rendu.",
      ],
    },
    claimed_soon: {
      stamp: "Retrouvé",
      success: true,
      title: (p) => `Bonne nouvelle ${p}, votre objet a été retrouvé !`,
      lead: "La personne qui l'a trouvé doit encore le déposer au service vie scolaire.",
      steps: [
        "Suivez votre déclaration avec ce code : vous verrez quand l'objet est déposé.",
        `Présentez ensuite ce code à la vie scolaire, avec ${PROOF}.`,
      ],
    },
  },
  trouve: {
    none: {
      stamp: "Enregistré",
      success: false,
      title: (p) => `Merci, ${p}. Personne ne l'a déclaré perdu pour le moment.`,
      lead: "Il ne reste qu'une étape : le déposer au service vie scolaire.",
      steps: [
        "Déposez l'objet au bureau de la vie scolaire avec ce code.",
        "Il y sera gardé jusqu'à ce que son propriétaire le réclame.",
      ],
    },
    owner_found: {
      stamp: "Propriétaire trouvé",
      success: true,
      title: (p) => `Merci ${p}, son propriétaire l'a déclaré perdu !`,
      lead: "Grâce à vous, il va le récupérer. Il ne reste qu'à déposer l'objet.",
      steps: [
        "Déposez l'objet au bureau de la vie scolaire avec ce code.",
        "La vie scolaire le rendra à son propriétaire, après vérification.",
      ],
    },
  },
};

function resultCopy(kind: Kind, outcome: Outcome): ResultCopy {
  if (kind === "perdu") return outcome === "claimed" || outcome === "claimed_soon" ? RESULT.perdu[outcome] : RESULT.perdu.none;
  return outcome === "owner_found" ? RESULT.trouve.owner_found : RESULT.trouve.none;
}

// ---------------------------------------------------------------- searching

function Searching({ kind }: { kind: Kind }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-8 text-center" role="status" aria-live="polite">
      <div className="relative flex size-[168px] items-center justify-center">
        <span aria-hidden="true" className="radar-ping absolute inset-0 rounded-full bg-accent/20" />
        <span aria-hidden="true" className="radar-ping absolute inset-0 rounded-full bg-accent/15 [animation-delay:1.3s]" />
        <span className="magnifier-pulse relative flex size-[112px] items-center justify-center rounded-full bg-accent text-white">
          <Icon name="manage_search" size={56} />
        </span>
      </div>
      <div>
        <h1 className="text-h-xl text-ink">{kind === "perdu" ? "Recherche de votre objet en cours…" : "Recherche de son propriétaire en cours…"}</h1>
        <p className="mt-2 text-body-xl text-slate">
          {kind === "perdu"
            ? "Nous comparons votre déclaration aux objets déjà trouvés dans l'établissement."
            : "Nous comparons cet objet aux déclarations de perte de l'établissement."}
        </p>
      </div>
      <span aria-hidden="true" className="size-11 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
    </div>
  );
}

// ---------------------------------------------------------------- candidates

function Candidates({
  kind,
  candidates,
  confirming,
  onChoose,
  onNone,
}: {
  kind: Kind;
  candidates: Candidate[];
  confirming: string | null;
  onChoose: (c: Candidate) => void;
  onNone: () => void;
}) {
  const busy = confirming !== null;
  return (
    <div className="mx-auto flex h-full w-full max-w-[1194px] flex-col gap-5 px-8 pb-5 pt-3">
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">
          <Icon name="notifications_active" size={30} />
        </span>
        <div>
          <h1 className="text-h-xl text-ink">{kind === "perdu" ? "Nous avons peut-être trouvé votre objet !" : "Cet objet a peut-être été déclaré perdu !"}</h1>
          <p className="mt-1 text-body-xl text-slate">
            {kind === "perdu"
              ? candidates.length > 1 ? "L'un de ces objets est-il le vôtre ?" : "Cet objet est-il le vôtre ?"
              : candidates.length > 1 ? "L'une de ces pertes correspond-elle à l'objet que vous avez trouvé ?" : "Cette perte correspond-elle à l'objet que vous avez trouvé ?"}
          </p>
        </div>
      </div>

      <ul className="grid min-h-0 flex-1 grid-cols-3 gap-4">
        {candidates.map((c) => {
          const category = CATEGORIES.find((x) => x.id === c.category);
          return (
            <li key={c.id} className="flex min-h-0 flex-col overflow-hidden rounded-card border-2 border-line bg-white">
              <div className="relative h-[190px] shrink-0 bg-canvas">
                {c.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-slate">
                    <Icon name={category?.icon ?? "more_horiz"} size={56} />
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-label-sm font-semibold text-ink">{category?.label}</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
                <p className="truncate text-h-md text-ink">{c.name}</p>
                {c.description && <p className="line-clamp-2 text-body-md text-slate">{c.description}</p>}
                <p className="mt-auto flex items-center gap-1.5 text-label-sm font-medium text-slate">
                  <Icon name="location_on" size={16} />
                  <span className="truncate">{c.location || "Lieu non précisé"}</span>
                </p>
                <p className="text-label-sm font-medium text-slate">
                  {kind === "trouve"
                    ? `Déclaré perdu le ${dateLabel(c.seenAt)}`
                    : c.source === "object"
                      ? `À la vie scolaire depuis le ${dateLabel(c.seenAt)}`
                      : `Signalé trouvé le ${dateLabel(c.seenAt)}`}
                </p>
              </div>
              <div className="p-4 pt-0">
                <Button icon="check" className="w-full" disabled={busy} onClick={() => onChoose(c)}>
                  {confirming === c.id ? "Un instant…" : kind === "perdu" ? "C'est le mien" : "C'est cet objet"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex h-[60px] shrink-0 items-center justify-between gap-6">
        <p className="max-w-[640px] text-label-md text-slate">
          {kind === "perdu"
            ? "Vous devrez prouver que l'objet est à vous au bureau de la vie scolaire."
            : "Le propriétaire devra prouver que l'objet est à lui au bureau de la vie scolaire."}
        </p>
        <Button variant="secondary" disabled={busy} onClick={onNone}>
          {kind === "perdu" ? "Aucun n'est à moi" : "Aucune ne correspond"}
        </Button>
      </div>
    </div>
  );
}
