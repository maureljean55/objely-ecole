import type { ReactNode } from "react";
import { Icon } from "../kiosk/Icon";

/** 52px strip that keeps the previous answers in view. */
export function RecapBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between gap-4 rounded-2xl border border-line bg-white/70 pl-4 pr-2">
      <div className="flex min-w-0 items-center gap-3">{children}</div>
      {action}
    </div>
  );
}

export function RecapPerson({ nom, prenom, classe }: { nom: string; prenom: string; classe: string }) {
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue text-white">
        <Icon name="person" size={18} fill />
      </span>
      <span className="truncate text-label-lg text-ink">
        {prenom} {nom.toUpperCase()}
      </span>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-line-strong" />
      <span className="truncate text-body-md font-medium text-slate">{classe}</span>
    </>
  );
}
