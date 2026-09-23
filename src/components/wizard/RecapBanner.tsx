import type { ReactNode } from "react";

/** 52px strip that keeps the previous answers in view. */
export function RecapBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between gap-4 rounded-xl border-2 border-line bg-white pl-4 pr-2">
      <div className="flex min-w-0 items-center gap-3 text-body-md">{children}</div>
      {action}
    </div>
  );
}

export function RecapPerson({ nom, prenom, classe }: { nom: string; prenom: string; classe: string }) {
  return (
    <>
      <span className="shrink-0 font-semibold text-ink">
        {prenom} {nom.toUpperCase()}
      </span>
      <span className="truncate text-slate">{classe}</span>
    </>
  );
}
