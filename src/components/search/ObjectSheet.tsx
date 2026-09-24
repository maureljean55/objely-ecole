"use client";

import { Icon } from "../kiosk/Icon";
import { CATEGORIES } from "@/lib/declaration";
import { useKiosk } from "@/components/kiosk/KioskProvider";
import type { ListedObject } from "@/lib/objects";

export function formatDay(iso: string, month: "long" | "short" = "long") {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month, timeZone: "Europe/Paris" });
}

/** Photo, or the category icon when the object has none. */
export function ObjectVisual({ object, iconSize, className = "" }: { object: ListedObject; iconSize: number; className?: string }) {
  const category = CATEGORIES.find((c) => c.id === object.category);
  return (
    <div className={`flex items-center justify-center bg-canvas ${className}`}>
      {object.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={object.photoUrl} alt={object.name} draggable={false} className="max-h-full max-w-full object-contain p-4" />
      ) : (
        <Icon name={category?.icon ?? "more_horiz"} size={iconSize} className="text-slate/70" />
      )}
    </div>
  );
}

// Read-only detail: what it is, where it was found, and how to get it back.
export function ObjectSheet({ object, onClose }: { object: ListedObject; onClose: () => void }) {
  const kiosk = useKiosk();
  const category = CATEGORIES.find((c) => c.id === object.category);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="object-title" className="absolute inset-0 z-40 flex items-center justify-center bg-ink/60">
      <div className="flex w-[820px] gap-6 rounded-card border-2 border-ink bg-white p-6 shadow-sheet">
        <ObjectVisual object={object} iconSize={96} className="h-[340px] w-[300px] shrink-0 rounded-xl border-2 border-line" />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-label-sm font-semibold uppercase tracking-wider text-accent">{category?.label}</p>
              <h2 id="object-title" className="text-h-lg text-ink">
                {object.name}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="press flex size-[52px] shrink-0 items-center justify-center rounded-xl border-2 border-line-strong text-ink"
            >
              <Icon name="close" size={26} />
            </button>
          </div>

          <p className="mt-2 text-body-lg text-slate">{object.description}</p>

          <dl className="mt-4 flex flex-col gap-3 border-t-2 border-line pt-4">
            <div>
              <dt className="font-mono text-label-sm font-medium uppercase tracking-wider text-slate">Trouvé</dt>
              <dd className="text-body-lg font-semibold text-ink">{object.foundAt}</dd>
            </div>
            <div>
              <dt className="font-mono text-label-sm font-medium uppercase tracking-wider text-slate">Déposé à la vie scolaire</dt>
              <dd className="text-body-lg font-semibold text-ink">le {formatDay(object.depositedAt)}</dd>
            </div>
          </dl>

          <p className="mt-auto rounded-xl border-2 border-accent bg-white p-4 text-body-md text-ink">
            <strong className="font-semibold">C&apos;est le vôtre ?</strong> Passez à la vie scolaire
            {kiosk.helpDesk && <> (<span className="font-mono">{kiosk.helpDesk.toLowerCase()}</span>)</>} : on vous demandera de décrire l&apos;objet avant de vous
            le rendre.
          </p>
        </div>
      </div>
    </div>
  );
}
