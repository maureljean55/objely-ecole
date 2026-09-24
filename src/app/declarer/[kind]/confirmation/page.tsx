"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/kiosk/Button";
import { Ticket } from "@/components/wizard/Ticket";
import { useKiosk } from "@/components/kiosk/KioskProvider";
import { useDeclaration } from "@/lib/declaration";

const RETURN_AFTER = 20;

const NEXT_STEPS = {
  perdu: [
    "La vie scolaire compare votre demande aux objets qu'on lui dépose.",
    "Si un objet correspond, l'équipe vous prévient. Sans numéro de téléphone, repassez à la borne.",
  ],
  trouve: [
    "Déposez l'objet au bureau de la vie scolaire.",
    "Collez le ticket sur l'objet : le numéro le relie à votre déclaration.",
  ],
} as const;

export default function ConfirmationPage() {
  const kiosk = useKiosk();
  const router = useRouter();
  const { kind, declaration: d, ready, reset } = useDeclaration();
  const [left, setLeft] = useState(RETURN_AFTER);
  // Frozen at first render: the ticket shows when it was "printed", not a ticking clock.
  const [printedAt] = useState(() =>
    new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  );

  const done = ready && Boolean(d.reference);
  useEffect(() => {
    if (ready && !d.reference) router.replace("/");
  }, [ready, d.reference, router]);

  const finish = () => {
    reset();
    router.replace("/");
  };

  useEffect(() => {
    if (!done) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (done && left <= 0) {
      reset();
      router.replace("/");
    }
  }, [done, left, reset, router]);

  if (!done || !d.reference) return null;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1194px] flex-col gap-3 px-8 pb-5 pt-3">
      <section className="grid min-h-0 flex-1 grid-cols-[1fr_400px] items-center gap-10">
        <div className="flex flex-col gap-7">
          <span className="inline-block w-fit animate-stamp rounded-md border-[4px] border-accent px-5 py-1.5 font-mono text-[26px] font-semibold uppercase tracking-[0.18em] text-accent">
            Enregistré
          </span>
          <div>
            <h1 className="text-display text-ink">Merci, {d.prenom}.</h1>
            <p className="mt-3 text-body-xl text-slate">
              {kind === "perdu"
                ? "Votre demande est transmise à la vie scolaire."
                : "Merci d'avoir signalé cet objet. Il ne reste qu'à le déposer."}
            </p>
          </div>
          <ol className="flex flex-col gap-4">
            {NEXT_STEPS[kind].map((text, i) => (
              <li key={text} className="flex gap-4 text-body-lg text-ink">
                <span className="w-5 shrink-0 font-mono font-semibold text-accent">{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          <p className="text-body-md text-slate">
            {kiosk.helpDesk ? (
              <>Besoin d&apos;aide ? Vie scolaire, <span className="font-mono text-ink">{kiosk.helpDesk.toLowerCase()}</span>.</>
            ) : (
              "Besoin d'aide ? Adressez-vous à la vie scolaire."
            )}
          </p>
        </div>

        <div className="flex justify-center">
          <Ticket
            kind={kind}
            reference={d.reference}
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
          Retour à l&apos;accueil dans <span className="font-mono text-label-lg tabular-nums text-ink">{Math.max(left, 0)} s</span>
        </p>
        <Button icon="check" onClick={finish}>
          Terminer
        </Button>
      </div>
    </div>
  );
}
