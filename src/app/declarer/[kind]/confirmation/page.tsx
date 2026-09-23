"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/kiosk/Button";
import { Icon } from "@/components/kiosk/Icon";
import { KIOSK } from "@/lib/kiosk";
import { CATEGORIES, useDeclaration } from "@/lib/declaration";

const RETURN_AFTER = 20;

const NEXT_STEPS = {
  perdu: [
    "Nous comparons votre déclaration aux objets déposés à la vie scolaire.",
    "Dès qu'un objet correspond, l'équipe vous prévient. Sans numéro de téléphone, repassez à la borne.",
  ],
  trouve: [
    "Déposez l'objet au bureau de la vie scolaire.",
    "Donnez le numéro de dossier ci-contre : il relie l'objet à votre déclaration.",
  ],
} as const;

export default function ConfirmationPage() {
  const router = useRouter();
  const { kind, declaration: d, ready, reset } = useDeclaration();
  const [left, setLeft] = useState(RETURN_AFTER);

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

  if (!done) return null;

  const category = CATEGORIES.find((c) => c.id === d.category);
  const photos = d.photos.filter((p): p is string => Boolean(p));

  return (
    <div className="mx-auto flex h-full w-full max-w-[1130px] flex-col justify-center gap-4 px-8 py-4">
      <section className="grid flex-1 grid-cols-[1fr_440px] overflow-hidden rounded-3xl border border-line bg-white shadow-rest">
        <div className="flex flex-col justify-center gap-6 p-10">
          <span className="flex size-[72px] animate-pop items-center justify-center rounded-full bg-ok/15 text-ok-ink">
            <Icon name="check_circle" fill size={44} />
          </span>
          <div className="animate-rise [animation-delay:120ms]">
            <h1 className="text-display text-ink">C&apos;est enregistré, {d.prenom}.</h1>
            <p className="mt-2 text-body-xl text-slate">
              {kind === "perdu"
                ? "Votre déclaration de perte est transmise à la vie scolaire."
                : "Merci d'avoir signalé cet objet. Il ne reste qu'à le déposer."}
            </p>
          </div>

          <ol className="flex animate-rise flex-col gap-3 [animation-delay:200ms]">
            {NEXT_STEPS[kind].map((text, i) => (
              <li key={text} className="flex items-start gap-3 text-body-lg text-ink">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-selected text-label-sm text-blue-ink">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        <aside className="flex flex-col gap-4 bg-canvas p-8">
          <div className="rounded-2xl bg-white p-5 shadow-rest ring-1 ring-line">
            <p className="text-label-sm uppercase tracking-wide text-slate">Numéro de dossier</p>
            <p className="mt-1 bg-signature bg-clip-text text-display tabular-nums text-transparent">{d.reference}</p>
          </div>

          <dl className="flex flex-col gap-3 rounded-2xl bg-white p-5 text-body-md shadow-rest ring-1 ring-line">
            <div className="flex items-center gap-3">
              <Icon name={category?.icon ?? "sell"} size={22} className="text-purple-ink" />
              <div className="min-w-0">
                <dt className="sr-only">Objet</dt>
                <dd className="truncate text-label-lg text-ink">{d.objectName}</dd>
              </div>
            </div>
            {d.location && (
              <div className="flex items-center gap-3">
                <Icon name="location_on" size={22} className="text-slate" />
                <div>
                  <dt className="sr-only">Lieu</dt>
                  <dd className="text-body-md text-slate">{d.location}</dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Icon name="person" size={22} className="text-slate" />
              <div>
                <dt className="sr-only">Déclarant</dt>
                <dd className="text-body-md text-slate">
                  {d.prenom} {d.nom.toUpperCase()} · {d.classe}
                </dd>
              </div>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 pt-1">
                {photos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Photo ${i + 1}`} className="h-16 w-20 rounded-lg object-cover ring-1 ring-line" />
                ))}
              </div>
            )}
          </dl>

          <p className="mt-auto text-label-sm font-medium text-slate">Besoin d&apos;aide ? Vie scolaire, {KIOSK.helpDesk.toLowerCase()}.</p>
        </aside>
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
        <p className="flex items-center gap-2 text-label-sm font-medium text-slate">
          <Icon name="timer" size={18} />
          Retour à l&apos;accueil dans <span className="tabular-nums text-ink">{Math.max(left, 0)} s</span>
        </p>
        <Button icon="check" onClick={finish}>
          Terminer
        </Button>
      </div>
    </div>
  );
}
