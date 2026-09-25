"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/kiosk/Icon";
import { useIdleRemaining } from "@/components/kiosk/IdleGuard";
import { CameraSheet } from "@/components/wizard/CameraSheet";
import { PhoneSync } from "@/components/wizard/PhoneSync";
import { RecapBanner, RecapPerson } from "@/components/wizard/RecapBanner";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { KIND_COPY, PHOTO_SLOTS, useDeclaration } from "@/lib/declaration";
import { useKioskToken } from "@/components/kiosk/KioskProvider";
import { submitDeclaration } from "@/lib/submit";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PhotosPage() {
  const router = useRouter();
  const { kind, declaration: d, update, setPhoto, addPhoto, ready } = useDeclaration();
  const idleRemaining = useIdleRemaining();
  const token = useKioskToken();
  const [cameraSlot, setCameraSlot] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoMissing, setPhotoMissing] = useState(false);
  const base = `/declarer/${kind}`;

  const hasObject = Boolean(d.category && d.objectName.trim());
  useEffect(() => {
    if (ready && !hasObject) router.replace(`${base}/objet`);
  }, [ready, hasObject, router, base]);

  if (!ready || !hasObject) return null;

  const copy = KIND_COPY[kind];
  const photoCount = d.photos.filter(Boolean).length;
  const firstEmpty = d.photos.findIndex((p) => !p);

  const submit = async () => {
    // At least one photo: it is what lets the vie scolaire (and the instant search) recognise the object.
    if (photoCount === 0) {
      setPhotoMissing(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitDeclaration(token, kind, d);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    update({ reference: result.reference });
    router.push(`${base}/confirmation`);
  };

  return (
    <>
    <WizardPage
      step={3}
      backHref={`${base}/objet`}
      banner={
        <RecapBanner>
          <RecapPerson nom={d.nom} prenom={d.prenom} classe={d.classe} />
          <span aria-hidden="true" className="h-5 w-0.5 shrink-0 bg-line" />
          <span className="truncate font-semibold text-ink">
            {d.objectName}
            {d.location && <span className="font-normal text-slate"> · {d.location}</span>}
          </span>
        </RecapBanner>
      }
      back={{ label: "Modifier l'objet", icon: "arrow_back", onClick: () => router.push(`${base}/objet`) }}
      next={{ label: submitting ? "Envoi…" : "Valider la déclaration", icon: "task_alt", onClick: submit, busy: submitting }}
      status={
        photoMissing && photoCount === 0 ? (
          <p role="alert" className="max-w-[300px] text-center text-label-md font-semibold text-danger">
            Ajoutez au moins une photo de l&apos;objet pour valider.
          </p>
        ) : error ? (
          <p role="alert" className="max-w-[300px] text-center text-danger">
            {error}
          </p>
        ) : (
          <p className={`max-w-[300px] text-center text-label-md ${photoCount === 0 ? "text-slate" : "text-ok"}`}>
            {photoCount === 0 ? "Au moins une photo est obligatoire." : `${photoCount} photo${photoCount > 1 ? "s" : ""} ajoutée${photoCount > 1 ? "s" : ""}`}
          </p>
        )
      }
    >
      <StepCard>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h-lg text-ink">Ajoutez au moins une photo</h1>
            <p className="mt-0.5 text-body-md text-slate">{copy.photosLead}</p>
          </div>
          <span className={`shrink-0 text-label-sm ${idleRemaining <= 30 ? "text-warn" : "text-slate"}`}>
            Temps restant{" "}
            <span className="font-mono text-label-lg tabular-nums text-ink">{formatCountdown(idleRemaining)}</span>
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
          <PhoneSync full={firstEmpty === -1} onPhoto={addPhoto} />

          <div className="flex h-full flex-col gap-3 rounded-xl border-2 border-line p-4">
            <p className="font-mono text-label-sm font-semibold uppercase tracking-wider text-accent">
              Avec la caméra de la borne
            </p>
            <button
              type="button"
              disabled={firstEmpty === -1}
              onClick={() => setCameraSlot(firstEmpty)}
              className="press flex h-14 items-center justify-center gap-3 rounded-xl border-2 border-ink/80 bg-white text-label-lg text-ink disabled:opacity-40"
            >
              <Icon name="photo_camera" size={24} />
              Prendre une photo
            </button>

            <p className="font-mono text-label-sm tabular-nums text-slate">
              {photoCount} / {PHOTO_SLOTS.length} photos
            </p>

            <div className="grid flex-1 grid-cols-3 gap-3">
              {PHOTO_SLOTS.map((slot, i) => {
                const photo = d.photos[i];
                return photo ? (
                  <div key={slot.label} className="relative overflow-hidden rounded-xl border-2 border-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={slot.label} className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Supprimer la photo ${i + 1}`}
                      onClick={() => setPhoto(i, null)}
                      className="press absolute right-1.5 top-1.5 flex size-11 items-center justify-center rounded-lg bg-danger text-white"
                    >
                      <Icon name="delete" size={22} fill />
                    </button>
                    <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-2.5 py-1.5 text-label-sm text-white">{slot.label}</span>
                  </div>
                ) : (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setCameraSlot(i)}
                    className="press flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong px-2 text-center text-slate hover:border-ink hover:text-ink"
                  >
                    <Icon name={slot.icon} size={30} />
                    <span className="text-label-sm leading-tight">{slot.empty}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-label-sm font-medium text-slate">
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
