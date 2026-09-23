"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "../kiosk/Button";
import { Icon } from "../kiosk/Icon";
import { useDeclaration } from "@/lib/declaration";
import { Stepper } from "./Stepper";

type WizardPageProps = {
  step: 1 | 2 | 3;
  /** Where the round back arrow goes. */
  backHref: string;
  /** Recap strip shown between the stepper and the card. */
  banner?: ReactNode;
  back: { label: string; icon: string; onClick: () => void };
  next: { label: string; icon: string; onClick: () => void; busy?: boolean };
  /** Small status text centred in the action bar. */
  status?: ReactNode;
  children: ReactNode;
};

// Shared frame for the 3 steps. Vertical budget inside the 686px workspace:
// 12 pad + 52 top row + 12 + card (flex) + 12 + 60 action bar + 12 pad.
export function WizardPage({ step, backHref, banner, back, next, status, children }: WizardPageProps) {
  const router = useRouter();
  const { reset } = useDeclaration();

  const cancel = () => {
    reset();
    router.replace("/");
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[1130px] flex-col gap-3 px-8 py-3">
      <div className="flex h-[52px] shrink-0 items-center gap-6">
        <button
          type="button"
          aria-label="Étape précédente"
          onClick={() => router.push(backHref)}
          className="press flex size-[52px] shrink-0 items-center justify-center rounded-xl border-2 border-line-strong bg-white text-ink"
        >
          <Icon name="arrow_back" size={26} />
        </button>
        <Stepper current={step} />
        <button type="button" onClick={cancel} className="press h-[52px] shrink-0 rounded-xl px-4 text-label-lg text-slate hover:text-ink">
          Annuler
        </button>
      </div>

      {banner}

      <div className="min-h-0 flex-1">{children}</div>

      <div className="flex h-[60px] shrink-0 items-center justify-between gap-6">
        <Button variant="secondary" icon={back.icon} iconPosition="start" onClick={back.onClick} className="!px-7">
          {back.label}
        </Button>
        {status && <div className="flex items-center gap-2 text-label-sm font-medium text-slate">{status}</div>}
        <Button icon={next.icon} onClick={next.onClick} disabled={next.busy} aria-busy={next.busy}>
          {next.label}
        </Button>
      </div>
    </div>
  );
}

/** White card that holds a step's content. */
export function StepCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`h-full overflow-hidden rounded-card border-2 border-line bg-white p-6 ${className}`}>
      <div className="flex h-full flex-col">{children}</div>
    </section>
  );
}
