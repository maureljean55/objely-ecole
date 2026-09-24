"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type RefObject } from "react";
import { useKiosk } from "@/components/kiosk/KioskProvider";
import { Icon } from "@/components/kiosk/Icon";
import { Fieldset } from "@/components/wizard/Fieldset";
import { TextField } from "@/components/wizard/Fields";
import { StepCard, WizardPage } from "@/components/wizard/WizardPage";
import { formatPhone, isValidPhone, KIND_COPY, useDeclaration } from "@/lib/declaration";

const CLASS_SUGGESTIONS = ["2nde", "1ère", "Terminale", "Personnel"];

type Field = "nom" | "prenom" | "classe" | "telephone";

export default function InformationsPage() {
  const kiosk = useKiosk();
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
    >
      <StepCard>
        <div className="mb-6">
          <p className="mb-1 font-mono text-label-sm font-semibold uppercase tracking-wider text-accent">{copy.badge}</p>
          <h1 className="text-h-xl text-ink">Qui déclare ?</h1>
          <p className="mt-1 text-body-lg text-slate">
            {kind === "perdu"
              ? "Pour vous recontacter dès qu'un objet correspondant est retrouvé."
              : "Pour que la vie scolaire puisse vous joindre si le propriétaire se manifeste."}
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
              placeholder="Ex : Terminale C"
              enterKeyHint="next"
            />
            <div className="-mb-3 mt-1 flex items-center gap-2">
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
                      className={`flex h-10 items-center rounded-lg border-2 px-4 text-label-sm ${
                        active ? "border-accent bg-accent text-white" : "border-line-strong bg-white text-ink"
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
            aside="Facultatif"
            note={
              kind === "perdu"
                ? "Nous vous envoyons un SMS si l'objet est déposé."
                : "Nous ne l'utilisons que si le propriétaire se manifeste."
            }
            placeholder="06 12 34 56 78"
            icon="phone_iphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </Fieldset>

        <p className="mt-auto flex items-center gap-2 border-t-2 border-line pt-4 text-body-md text-slate">
          <Icon name="lock" size={20} />
          <span>
            Vos coordonnées ne sont accessibles qu&apos;à l&apos;équipe de la vie scolaire du {kiosk.school}.
          </span>
        </p>
      </StepCard>
    </WizardPage>
  );
}
