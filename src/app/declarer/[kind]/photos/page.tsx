"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/kiosk/Icon";
import { useIdleRemaining } from "@/components/kiosk/IdleGuard";
import { CameraSheet } from "@/components/wizard/CameraSheet";
import { PhoneSync } from "@/components/wizard/PhoneSync";
import { RecapBanner, RecapPerson } from "@/components/wizard/RecapBanner";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { CATEGORIES, KIND_COPY, PHOTO_SLOTS, useDeclaration } from "@/lib/declaration";
import { submitDeclaration } from "@/lib/submit";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PhotosPage() {
  const router = useRouter();
  const { kind, declaration: d, update, setPhoto, ready } = useDeclaration();
  const idleRemaining = useIdleRemaining();
  const [cameraSlot, setCameraSlot] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/declarer/${kind}`;

  const hasObject = Boolean(d.category && d.objectName.trim());
  useEffect(() => {
    if (ready && !hasObject) router.replace(`${base}/objet`);
  }, [ready, hasObject, router, base]);

  if (!ready || !hasObject) return null;

  const copy = KIND_COPY[kind];
  const category = CATEGORIES.find((c) => c.id === d.category);
  const photoCount = d.photos.filter(Boolean).length;
  const firstEmpty = d.photos.findIndex((p) => !p);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const reference = await submitDeclaration(kind, d);
      update({ reference });
      router.push(`${base}/confirmation`);
    } catch {
      setError("La déclaration n'a pas pu être envoyée. Touchez « Valider la déclaration » pour réessayer.");
      setSubmitting(false);
    }
  };

  return (
    <>
    <WizardPage
      step={3}
      backHref={`${base}/objet`}
      banner={
        <RecapBanner
          action={
            <span className="mr-2 flex items-center gap-1.5 rounded-full bg-selected px-3 py-1.5 text-label-sm text-blue-ink">
              <span className="size-2 rounded-full bg-blue" />
              Étape finale
            </span>
          }
        >
          <RecapPerson nom={d.nom} prenom={d.prenom} classe={d.classe} />
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />
          <Icon name={category?.icon ?? "sell"} size={22} className="text-purple-ink" />
          <span className="truncate text-body-md font-medium text-ink">
            {d.objectName}
            {d.location && <span className="text-slate"> ({d.location})</span>}
          </span>
        </RecapBanner>
      }
      back={{ label: "Modifier l'objet", icon: "arrow_back", onClick: () => router.push(`${base}/objet`) }}
      next={{ label: submitting ? "Envoi…" : "Valider la déclaration", icon: "task_alt", onClick: submit, busy: submitting }}
      status={
        error ? (
          <p role="alert" className="max-w-[300px] text-center text-danger-ink">
            {error}
          </p>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="press h-[52px] px-4 text-label-md text-slate underline underline-offset-4 hover:text-ink"
          >
            Finaliser sans photo supplémentaire
          </button>
        )
      }
    >
      <StepCard>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h-lg text-ink">Ajouter des photos</h1>
            <p className="mt-0.5 text-body-md text-slate">{copy.photosLead}</p>
          </div>
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm tabular-nums ${
              idleRemaining <= 30 ? "bg-warn/15 text-[#92580a]" : "bg-canvas text-slate ring-1 ring-line"
            }`}
          >
            <Icon name="timer" size={18} />
            Temps restant : <strong className="text-ink">{formatCountdown(idleRemaining)}</strong>
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
          <PhoneSync />

          <div className="flex h-full flex-col gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-line">
            <p className="text-label-sm uppercase tracking-wide text-ink">Option directe sur borne</p>
            <button
              type="button"
              disabled={firstEmpty === -1}
              onClick={() => setCameraSlot(firstEmpty)}
              className="press flex h-14 items-center justify-center gap-3 rounded-xl bg-white text-label-lg text-blue-ink shadow-rest ring-1 ring-line hover:ring-line-strong disabled:opacity-50"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-selected">
                <Icon name="photo_camera" size={22} />
              </span>
              Activer la webcam de la borne
            </button>

            <div className="flex items-center gap-3 text-label-sm uppercase tracking-wide text-slate">
              <span className="h-px flex-1 bg-line" />
              Photos associées ({photoCount}/{PHOTO_SLOTS.length})
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="grid flex-1 grid-cols-3 gap-3">
              {PHOTO_SLOTS.map((slot, i) => {
                const photo = d.photos[i];
                return photo ? (
                  <div key={slot.label} className="relative overflow-hidden rounded-2xl shadow-rest">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={slot.label} className="size-full object-cover" />
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-label-sm text-white backdrop-blur">
                      <Icon name="check_circle" size={16} />
                      Photo {i + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Supprimer la photo ${i + 1}`}
                      onClick={() => setPhoto(i, null)}
                      className="press absolute right-1.5 top-1.5 flex size-11 items-center justify-center rounded-xl bg-danger text-white shadow-rest"
                    >
                      <Icon name="delete" size={22} fill />
                    </button>
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-6 text-label-sm text-white">
                      {slot.label}
                    </span>
                  </div>
                ) : (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setCameraSlot(i)}
                    className="press flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-white px-2 text-center hover:border-blue"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-selected text-blue-ink">
                      <Icon name={slot.icon} size={24} />
                    </span>
                    <span className="text-label-sm leading-tight text-ink">{slot.empty}</span>
                  </button>
                );
              })}
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-selected/70 px-3 py-2 text-label-sm font-medium text-slate">
              <Icon name="shield" size={18} className="mt-px text-blue-ink" />
              Seule la vie scolaire voit vos photos. Évitez les visages et les documents personnels.
            </p>
          </div>
        </div>
      </StepCard>
    </WizardPage>

    {/* Outside WizardPage: its entrance animation would otherwise clip the sheet to the card. */}
    {cameraSlot !== null && (
      <CameraSheet
        title={`Photographier : ${PHOTO_SLOTS[cameraSlot].label}`}
        onClose={() => setCameraSlot(null)}
        onCapture={(dataUrl) => {
          setPhoto(cameraSlot, dataUrl);
          setCameraSlot(null);
        }}
      />
    )}
    </>
  );
}
