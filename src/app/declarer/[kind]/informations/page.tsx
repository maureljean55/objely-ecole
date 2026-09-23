"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type RefObject } from "react";
import { KIOSK } from "@/lib/kiosk";
import { Icon } from "@/components/kiosk/Icon";
import { Fieldset } from "@/components/wizard/Fieldset";
import { TextField } from "@/components/wizard/Fields";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { formatPhone, isValidPhone, KIND_COPY, useDeclaration } from "@/lib/declaration";

const CLASS_SUGGESTIONS = ["2nde", "1ère", "Terminale", "Personnel"];

type Field = "nom" | "prenom" | "classe" | "telephone";

export default function InformationsPage() {
  const router = useRouter();
  const { kind, declaration: d, update, ready } = useDeclaration();
  const [touched, setTouched] = useState<Set<Field>>(new Set());
  const nomRef = useRef<HTMLInputElement>(null);
  const prenomRef = useRef<HTMLInputElement>(null);
  const classeRef = useRef<HTMLInputElement>(null);
  const telRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;

  const copy = KIND_COPY[kind];
  const errors: Record<Field, string | undefined> = {
    nom: d.nom.trim() ? undefined : "Entrez votre nom",
    prenom: d.prenom.trim() ? undefined : "Entrez votre prénom",
    classe: d.classe.trim() ? undefined : "Indiquez votre classe ou votre groupe",
    telephone: isValidPhone(d.telephone) ? undefined : "Un numéro compte 10 chiffres, par exemple 06 12 34 56 78",
  };
  const shown = (f: Field) => (touched.has(f) ? errors[f] : undefined);
  const touch = (f: Field) => setTouched((t) => new Set(t).add(f));
  const validNote = (f: Field) =>
    touched.has(f) && !errors[f] ? (
      <>
        <Icon name="check_circle" fill size={16} className="text-ok-ink" />
        Valide
      </>
    ) : undefined;
  const requiredAside = (f: Field) => (shown(f) ? <span className="text-danger-ink">Champ requis</span> : "Obligatoire");

  const next = () => {
    const order: [Field, RefObject<HTMLInputElement | null>][] = [
      ["nom", nomRef],
      ["prenom", prenomRef],
      ["classe", classeRef],
      ["telephone", telRef],
    ];
    setTouched(new Set(order.map(([f]) => f)));
    const firstInvalid = order.find(([f]) => errors[f]);
    if (firstInvalid) {
      firstInvalid[1].current?.focus();
      return;
    }
    router.push(`/declarer/${kind}/objet`);
  };

  const pickClass = (label: string) => {
    update({ classe: label === "Personnel" ? label : `${label} ` });
    touch("classe");
    classeRef.current?.focus();
  };

  return (
    <WizardPage
      step={1}
      backHref="/"
      back={{ label: "Précédent", icon: "chevron_left", onClick: () => router.push("/") }}
      next={{ label: "Suivant : L'objet", icon: "arrow_forward", onClick: next }}
      status={
        <>
          <Icon name="touch_app" size={18} />
          Touchez pour valider vos saisies
        </>
      }
    >
      <StepCard>
        <div className="mb-6">
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-selected px-3 py-1.5 text-label-sm text-blue-ink">
            <Icon name={copy.badgeIcon} size={18} />
            {copy.badge}
          </span>
          <h1 className="text-h-xl text-ink">Qui déclare ?</h1>
          <p className="mt-1 text-body-lg text-slate">
            {kind === "perdu"
              ? "Ces informations permettent de vous recontacter dès qu'un objet correspondant est retrouvé."
              : "Ces informations permettent à la vie scolaire de vous joindre si le propriétaire se manifeste."}
          </p>
        </div>

        <Fieldset className="grid grid-cols-2 gap-x-6 gap-y-4">
          <TextField
            label="Nom"
            required
            value={d.nom}
            inputRef={nomRef}
            onChange={(nom) => update({ nom })}
            onBlur={() => touch("nom")}
            error={shown("nom")}
            aside={requiredAside("nom")}
            note={validNote("nom")}
            placeholder="Ex : Dubois"
            autoCapitalize="words"
            autoComplete="family-name"
            enterKeyHint="next"
          />
          <TextField
            label="Prénom"
            required
            value={d.prenom}
            inputRef={prenomRef}
            onChange={(prenom) => update({ prenom })}
            onBlur={() => touch("prenom")}
            error={shown("prenom")}
            aside={requiredAside("prenom")}
            note={validNote("prenom")}
            placeholder="Ex : Léa"
            autoCapitalize="words"
            enterKeyHint="next"
          />

          <div className="flex min-w-0 flex-col">
            <TextField
              label="Classe ou groupe"
              required
              value={d.classe}
              inputRef={classeRef}
              onChange={(classe) => update({ classe })}
              onBlur={() => touch("classe")}
              error={shown("classe")}
              aside="Élève ou équipe"
              placeholder="Sélectionnez ou tapez"
              trailingIcon="school"
              enterKeyHint="next"
            />
            <div className="-mb-3 mt-1 flex items-center gap-1.5">
              <span className="text-label-sm font-medium text-slate">Suggestions :</span>
              {CLASS_SUGGESTIONS.map((label) => {
                const active = d.classe.startsWith(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickClass(label)}
                    className="press flex h-[52px] items-center"
                  >
                    <span
                      className={`flex h-10 items-center rounded-lg px-4 text-label-sm ${
                        active ? "bg-blue text-white" : "bg-canvas text-slate ring-1 ring-line"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <TextField
            label="Téléphone"
            value={d.telephone}
            inputRef={telRef}
            onChange={(v) => update({ telephone: formatPhone(v) })}
            onBlur={() => touch("telephone")}
            error={shown("telephone")}
            aside="Facultatif (SMS d'alerte)"
            note={
              <>
                <Icon name="sms" size={16} />
                {kind === "perdu"
                  ? "Notification directe si l'objet est déposé"
                  : "Pour vous joindre si le propriétaire se manifeste"}
              </>
            }
            placeholder="06 12 34 56 78"
            icon="phone_iphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </Fieldset>

        <p className="mt-auto flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-body-md text-slate">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-selected text-blue-ink">
            <Icon name="lock" size={20} />
          </span>
          <span>
            Vos coordonnées restent strictement confidentielles et ne sont accessibles qu&apos;à l&apos;équipe de la vie
            scolaire du <strong className="font-semibold text-ink">{KIOSK.school}</strong>.
          </span>
        </p>
      </StepCard>
    </WizardPage>
  );
}
