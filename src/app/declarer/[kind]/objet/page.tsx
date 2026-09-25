"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/kiosk/Icon";
import { Fieldset } from "@/components/wizard/Fieldset";
import { FieldShell, TextArea, TextField, tone } from "@/components/wizard/Fields";
import { RecapBanner, RecapPerson } from "@/components/wizard/RecapBanner";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { CATEGORIES, DESCRIPTION_MAX, DESCRIPTION_MIN, KIND_COPY, LOCATIONS, useDeclaration } from "@/lib/declaration";

export default function ObjetPage() {
  const router = useRouter();
  const { kind, declaration: d, update, ready } = useDeclaration();
  const [attempted, setAttempted] = useState(false);
  const base = `/declarer/${kind}`;

  // Landing here without step 1 done (refresh after a wipe, deep link).
  const hasIdentity = Boolean(d.nom.trim() && d.prenom.trim() && d.classe.trim());
  useEffect(() => {
    if (ready && !hasIdentity) router.replace(`${base}/informations`);
  }, [ready, hasIdentity, router, base]);

  if (!ready || !hasIdentity) return null;

  const copy = KIND_COPY[kind];
  const missingCategory = attempted && !d.category;
  const missingName = attempted && !d.objectName.trim();
  const locationError = attempted && !d.location ? "Choisissez un lieu (ou « Je ne sais pas »)" : undefined;
  // A few words are enough, but "ok" is not: the description is what tells two similar objects apart.
  const descriptionError =
    attempted && d.description.trim().length < DESCRIPTION_MIN
      ? `Décrivez l'objet en quelques mots (${DESCRIPTION_MIN} caractères minimum)`
      : undefined;

  const next = () => {
    setAttempted(true);
    if (!d.category || !d.objectName.trim() || !d.location || d.description.trim().length < DESCRIPTION_MIN) return;
    router.push(`${base}/photos`);
  };

  return (
    <WizardPage
      step={2}
      backHref={`${base}/informations`}
      banner={
        <RecapBanner
          action={
            <button
              type="button"
              onClick={() => router.push(`${base}/informations`)}
              className="press flex h-[52px] items-center gap-1.5 rounded-xl px-4 text-label-md text-accent underline underline-offset-4"
            >
              <Icon name="edit" size={18} />
              Modifier
            </button>
          }
        >
          <RecapPerson nom={d.nom} prenom={d.prenom} classe={d.classe} />
        </RecapBanner>
      }
      back={{ label: "Retour", icon: "arrow_back", onClick: () => router.push(`${base}/informations`) }}
      next={{ label: "Continuer vers les photos", icon: "arrow_forward", onClick: next }}
      status="Vos réponses sont gardées sur la borne."
    >
      <StepCard>
        <div>
          <h1 className="text-h-lg text-ink">{copy.objectTitle}</h1>
          <p
            role={missingCategory ? "alert" : undefined}
            className={`mt-0.5 text-body-md ${missingCategory ? "font-semibold text-danger" : "text-slate"}`}
          >
            {missingCategory ? "Choisissez une catégorie pour continuer." : "Choisissez la catégorie qui s'en approche le plus."}
          </p>
        </div>

        <div role="radiogroup" aria-label="Catégorie de l'objet" className="my-4 grid grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const selected = d.category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ category: c.id })}
                className={`press relative h-[92px] overflow-hidden rounded-card border-2 bg-canvas text-left ${
                  selected
                    ? "border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                    : missingCategory
                      ? "border-danger"
                      : "border-line-strong hover:border-ink"
                }`}
              >
                {/* Real photos (Wikimedia Commons, public domain / CC0): see public/categories/CREDITS.md. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/categories/${c.id}.jpg`} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/75 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 px-2.5 pb-2 text-label-md font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                  {c.label}
                </span>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-accent text-white shadow">
                    <Icon name="check" size={18} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Fieldset className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-6">
            <TextField
              label="Nom de l'objet"
              required
              value={d.objectName}
              onChange={(objectName) => update({ objectName })}
              error={missingName ? "Donnez un nom à l'objet" : undefined}
              aside="Ex : trousse, calculatrice"
              placeholder="Ex : Écouteurs sans fil, bonnet…"
              maxLength={80}
              enterKeyHint="next"
              className="!h-[52px]"
            />
            <LocationSelect label={copy.locationLabel} value={d.location} onChange={(location) => update({ location })} error={locationError} />
          </div>

          <TextArea
            label="Description"
            required
            error={descriptionError}
            value={d.description}
            onChange={(description) => update({ description })}
            maxLength={DESCRIPTION_MAX}
            rows={2}
            placeholder="Couleur, marque, autocollants, rayures, nom inscrit…"
            className="!h-[64px]"
          />

          {!descriptionError && (
            <p className="text-label-sm font-medium text-slate">
              Astuce : dites si votre prénom ou votre numéro d&apos;élève est écrit discrètement sur l&apos;objet.
            </p>
          )}
        </Fieldset>
      </StepCard>
    </WizardPage>
  );
}

function LocationSelect({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const id = "location";
  return (
    <FieldShell id={id} label={label} required error={error}>
      <div className="relative flex items-center">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`h-[52px] w-full appearance-none rounded-field border-2 pl-4 pr-12 text-body-xl outline-none transition-[background-color,border-color,box-shadow] ${tone(error)} ${
            value ? "text-ink" : "text-slate/70"
          }`}
        >
          <option value="">Sélectionnez un lieu</option>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <Icon name="expand_more" size={26} className="pointer-events-none absolute right-4 text-ink" />
      </div>
    </FieldShell>
  );
}
