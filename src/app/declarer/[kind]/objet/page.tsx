"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/kiosk/Icon";
import { Fieldset } from "@/components/wizard/Fieldset";
import { FieldShell, TextArea, TextField } from "@/components/wizard/Fields";
import { RecapBanner, RecapPerson } from "@/components/wizard/RecapBanner";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { CATEGORIES, DESCRIPTION_MAX, KIND_COPY, LOCATIONS, useDeclaration } from "@/lib/declaration";

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

  const next = () => {
    setAttempted(true);
    if (!d.category || !d.objectName.trim()) return;
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
              className="press flex h-[52px] items-center gap-1.5 rounded-xl px-4 text-label-md text-blue-ink underline underline-offset-4"
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
      status={
        <>
          <span className="size-2 rounded-full bg-blue" />
          Sauvegarde automatique en cours
        </>
      }
    >
      <StepCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h-lg text-ink">{copy.objectTitle}</h1>
            <p className="mt-0.5 text-body-md text-slate">
              Sélectionnez une catégorie pour accélérer la reconnaissance automatique par l&apos;équipe.
            </p>
          </div>
          <span
            role={missingCategory ? "alert" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm ${
              missingCategory ? "bg-danger-tint text-danger-ink" : "bg-canvas text-slate ring-1 ring-line"
            }`}
          >
            <Icon name="info" size={16} className={missingCategory ? "" : "text-blue"} />
            {missingCategory ? "Choisissez une catégorie pour continuer" : "Champs obligatoires marqués d'un astérisque (*)"}
          </span>
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
                className={`press relative flex h-[92px] flex-col items-center justify-center gap-1.5 rounded-card border-2 ${
                  selected
                    ? "border-blue bg-selected shadow-active"
                    : missingCategory
                      ? "border-danger/40 bg-canvas"
                      : "border-transparent bg-canvas hover:border-line-strong"
                }`}
              >
                {selected && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-blue text-white">
                    <Icon name="check" size={14} style={{ fontWeight: 700 }} />
                  </span>
                )}
                <span
                  className={`flex size-11 items-center justify-center rounded-xl bg-white shadow-rest ${
                    selected ? "text-blue" : "text-slate"
                  }`}
                >
                  <Icon name={c.icon} size={26} fill={selected} />
                </span>
                <span className={`text-label-md ${selected ? "text-blue-ink" : "font-medium text-slate"}`}>{c.label}</span>
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
              placeholder="Ex : Écouteurs sans fil, Bonnet…"
              icon="edit_note"
              maxLength={80}
              enterKeyHint="next"
              className="!h-[52px]"
            />
            <LocationSelect
              label={copy.locationLabel}
              value={d.location}
              onChange={(location) => update({ location })}
            />
          </div>

          <TextArea
            label="Description complémentaire"
            optional="(facultatif)"
            value={d.description}
            onChange={(description) => update({ description })}
            maxLength={DESCRIPTION_MAX}
            rows={2}
            placeholder="Couleur, marque, signes distinctifs (autocollants, rayures, nom inscrit…)"
            className="!h-[88px]"
          />

          <p className="flex items-center gap-1.5 text-label-sm font-medium text-slate">
            <Icon name="lightbulb" size={16} className="text-blue" />
            Indice utile : mentionnez si votre prénom ou numéro d&apos;élève figure discrètement sur l&apos;objet.
          </p>
        </Fieldset>
      </StepCard>
    </WizardPage>
  );
}

function LocationSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = "location";
  return (
    <FieldShell id={id} label={label}>
      <div className="relative flex items-center">
        <Icon name="location_on" size={22} className="pointer-events-none absolute left-4 text-slate" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-[52px] w-full appearance-none rounded-field border-[1.5px] border-line bg-canvas pl-12 pr-12 text-body-xl outline-none transition-[background-color,border-color,box-shadow] focus:border-blue focus:bg-white focus:shadow-[0_0_0_4px_rgba(8,123,234,0.18)] ${value ? "text-ink" : "text-slate/70"}`}
        >
          <option value="">Sélectionnez un lieu (facultatif)</option>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <Icon name="expand_more" size={24} className="pointer-events-none absolute right-4 text-slate" />
      </div>
    </FieldShell>
  );
}
