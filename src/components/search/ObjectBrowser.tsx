"use client";

import { useMemo, useState } from "react";
import { Button } from "../kiosk/Button";
import { Icon } from "../kiosk/Icon";
import { CATEGORIES, type CategoryId } from "@/lib/declaration";
import type { ListedObject } from "@/lib/objects";
import { formatDay, ObjectSheet, ObjectVisual } from "./ObjectSheet";

const PAGE_SIZE = 6;

// Lower-case and strip accents so "cles" finds "Clés".
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ObjectBrowser({ objects }: { objects: ListedObject[] }) {
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ListedObject | null>(null);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return objects.filter(
      (o) =>
        (category === "all" || o.category === category) &&
        (!q || fold(`${o.name} ${o.description} ${o.foundAt}`).includes(q)),
    );
  }, [objects, category, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[1194px] flex-col gap-3 px-8 pb-5 pt-3">
      <div className="flex h-14 shrink-0 items-center justify-between gap-6">
        <div>
          <h1 className="text-h-lg text-ink">Objets retrouvés</h1>
          <p className="font-mono text-label-sm text-slate">
            {filtered.length} {filtered.length > 1 ? "objets" : "objet"} à récupérer à la vie scolaire
          </p>
        </div>

        <label className="relative block w-[380px]">
          <span className="sr-only">Rechercher un objet</span>
          <Icon name="search" size={24} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => change(setQuery)(e.target.value)}
            placeholder="Clés, sac, calculatrice…"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            className="h-14 w-full rounded-field border-2 border-line-strong bg-white pl-12 pr-12 text-body-xl text-ink outline-none placeholder:text-slate/60 focus:border-accent"
          />
          {query && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => change(setQuery)("")}
              className="press absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:text-ink"
            >
              <Icon name="cancel" size={22} />
            </button>
          )}
        </label>
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2" role="group" aria-label="Catégorie">
        {[{ id: "all" as const, label: "Tous" }, ...CATEGORIES].map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => change(setCategory)(c.id)}
              className={`press h-11 rounded-lg border-2 px-4 text-label-md ${
                active ? "border-accent bg-accent text-white" : "border-line-strong bg-white text-ink"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-line-strong text-center">
            <p className="text-h-md text-ink">Aucun objet ne correspond.</p>
            <p className="text-body-lg text-slate">Essayez un autre mot, ou une autre catégorie.</p>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setPage(0);
              }}
            >
              Tout afficher
            </Button>
          </div>
        ) : (
          <ul className="grid h-full grid-cols-3 grid-rows-2 gap-3">
            {visible.map((o) => (
              <li key={o.id} className="min-h-0">
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="press flex h-full w-full flex-col overflow-hidden rounded-card border-2 border-line bg-white text-left hover:border-line-strong"
                >
                  <ObjectVisual object={o} iconSize={56} className="min-h-0 flex-1 border-b-2 border-line" />
                  <span className="flex flex-col gap-0.5 px-4 py-3">
                    <span className="truncate font-display text-h-md text-ink">{o.name}</span>
                    <span className="flex items-center gap-1 truncate text-body-md text-slate">
                      <Icon name="location_on" size={18} />
                      {o.foundAt} · déposé le {formatDay(o.depositedAt, "short")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex h-[60px] shrink-0 items-center justify-between gap-6">
        <p className="max-w-[520px] text-label-sm font-medium text-slate">
          Vous reconnaissez votre objet ? Touchez-le puis « C&apos;est le mien » : vous recevrez un code pour le récupérer à la vie scolaire.
        </p>
        <div className="flex items-center gap-4">
          <span className="font-mono text-label-lg tabular-nums text-ink">
            {current + 1} / {pageCount}
          </span>
          <Button
            variant="secondary"
            icon="chevron_left"
            iconPosition="start"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="!px-6 disabled:opacity-40"
          >
            Précédent
          </Button>
          <Button icon="chevron_right" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} className="!px-6 disabled:opacity-40">
            Suivant
          </Button>
        </div>
      </div>

      {selected && <ObjectSheet object={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
