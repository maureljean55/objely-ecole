import { Icon } from "../kiosk/Icon";

const STEPS = [
  { title: "Vos informations", hint: "Suivant" },
  { title: "L'objet", hint: "À venir" },
  { title: "Photos", hint: "Finalisation" },
];

// 3 segments. Done = solid blue with a check, current = signature gradient
// that fills in on arrival, upcoming = quiet track.
export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="grid flex-1 grid-cols-3 gap-6" aria-label="Progression">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        const hint = state === "done" ? "Terminé" : state === "current" ? (n === 3 ? "Étape finale" : "En cours") : step.hint;
        return (
          <li key={step.title} aria-current={state === "current" ? "step" : undefined} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`flex items-center gap-1.5 text-label-md ${
                  state === "todo" ? "font-medium text-slate" : "text-blue-ink"
                } ${state === "current" ? "font-bold" : ""}`}
              >
                {state === "done" ? (
                  <Icon name="check_circle" fill size={18} className="text-ok" />
                ) : (
                  state === "current" && <span className="size-2 rounded-full bg-blue" />
                )}
                {n}. {step.title}
              </span>
              <span className={`text-label-sm ${state === "todo" ? "font-medium text-slate/80" : "text-blue-ink"}`}>{hint}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              {state !== "todo" && (
                <div
                  className={`h-full origin-left rounded-full ${
                    state === "current" ? "animate-fill bg-signature shadow-[0_0_12px_rgba(8,123,234,0.35)]" : "bg-blue"
                  }`}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
