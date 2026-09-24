"use client";

import type { Kind } from "@/lib/declaration";
import { useKiosk } from "@/components/kiosk/KioskProvider";

// A deterministic barcode from the reference, so the same dossier always prints the same bars.
function bars(reference: string) {
  const out: number[] = [];
  for (const ch of reference) {
    const c = ch.charCodeAt(0);
    for (let bit = 0; bit < 6; bit++) out.push(1 + ((c >> bit) & 1) + (bit % 3 === 0 ? 1 : 0));
  }
  return out;
}

function Row({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="font-mono text-label-sm font-medium uppercase tracking-wider text-slate">{label}</dt>
      <dd className="truncate text-body-lg font-semibold text-ink">{children}</dd>
    </div>
  );
}

// The dossier as a paper ticket, like the ones handed out at a cloakroom: the
// number is what ties the object to its declaration. Colour bar = side (blue lost, violet found).
export function Ticket({
  kind,
  reference,
  objectName,
  location,
  person,
  printedAt,
}: {
  kind: Kind;
  reference: string;
  objectName: string;
  location: string;
  person: string;
  printedAt: string;
}) {
  const { school } = useKiosk();
  return (
    <div className="w-[380px] rotate-[1.4deg] [filter:drop-shadow(0_1px_1px_rgba(16,26,54,0.18))_drop-shadow(0_16px_14px_rgba(16,26,54,0.2))]">
      <div className="ticket relative animate-print bg-white">
        <div className="h-3 bg-accent" />

        <div className="h-[164px] px-7 pt-5">
          <p className="font-mono text-label-sm font-medium uppercase tracking-wider text-slate">
            {school} · {kind === "perdu" ? "Objet perdu" : "Objet trouvé"}
          </p>
          <p className="mt-3 font-mono text-[15px] font-medium uppercase tracking-wider text-slate">Dossier n°</p>
          <p className="font-mono text-[50px] font-semibold leading-none tracking-tight text-ink">{reference}</p>
          <p className="mt-3 font-mono text-label-sm tabular-nums text-slate">{printedAt}</p>
        </div>

        <div aria-hidden="true" className="mx-6 border-t-2 border-dashed border-line-strong" />

        <dl className="flex flex-col gap-3 px-7 pb-4 pt-5">
          <Row label="Objet">{objectName}</Row>
          {location && <Row label="Lieu">{location}</Row>}
          <Row label={kind === "perdu" ? "Déclarant" : "Trouvé par"}>{person}</Row>
        </dl>

        <div aria-hidden="true" className="flex h-11 items-stretch px-7 pb-0">
          {bars(reference).map((w, i) => (
            <span key={i} style={{ width: w * 2.3 }} className={i % 2 === 0 ? "bg-ink" : "bg-transparent"} />
          ))}
        </div>
        <p className="px-7 pb-5 pt-3 text-body-md text-slate">
          {kind === "perdu" ? "À garder : ce numéro suit votre demande." : "À coller sur l'objet avant de le déposer."}
        </p>
      </div>
    </div>
  );
}
