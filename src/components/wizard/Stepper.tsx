const STEPS = ["Vos informations", "L'objet", "Photos"];

// Flat bars: done = ink, current = the accent of the side, upcoming = grey.
export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="grid flex-1 grid-cols-3 gap-4" aria-label="Progression">
      {STEPS.map((title, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={title} aria-current={state === "current" ? "step" : undefined} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-label-md ${state === "todo" ? "font-medium text-slate" : "text-ink"}`}>
                {n}. {title}
              </span>
              {state !== "todo" && (
                <span className={`text-label-sm ${state === "current" ? "text-accent" : "text-slate"}`}>
                  {state === "done" ? "Terminé" : n === 3 ? "Dernière étape" : "En cours"}
                </span>
              )}
            </div>
            <div className={`h-1.5 rounded-sm ${state === "done" ? "bg-ink" : state === "current" ? "bg-accent" : "bg-line"}`} />
          </li>
        );
      })}
    </ol>
  );
}
