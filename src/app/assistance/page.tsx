import Link from "next/link";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";
import { KIOSK } from "@/lib/kiosk";

const STEPS = [
  { title: "Vous déclarez", text: "Objet perdu ou trouvé : trois étapes, moins d'une minute." },
  { title: "La vie scolaire fait le lien", text: "Elle compare les demandes aux objets qu'on lui dépose." },
  { title: "Vous êtes prévenu", text: "Dès qu'un objet correspond, on vous contacte pour le récupérer." },
];

export default function AssistancePage() {
  return (
    <Screen variant="wizard">
      <div className="mx-auto flex h-full w-full max-w-[1130px] flex-col gap-6 px-8 py-6">
        <div>
          <h1 className="text-h-xl text-ink">Assistance</h1>
          <p className="mt-1 text-body-lg text-slate">Comment marche la borne, et qui prévenir si vous êtes bloqué.</p>
        </div>

        <ol className="grid grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-card border-2 border-line bg-white p-5">
              <p className="font-mono text-label-md font-semibold text-blue">{i + 1}</p>
              <p className="mt-2 text-h-md text-ink">{s.title}</p>
              <p className="mt-1 text-body-md text-slate">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col justify-center rounded-card bg-blue p-8 text-white">
            <p className="font-mono text-label-sm font-semibold uppercase tracking-wider text-white/85">Aide vie scolaire</p>
            <p className="mt-1 font-display text-[52px] font-extrabold leading-none tracking-tight">{KIOSK.helpDesk}</p>
            <p className="mt-3 text-body-lg text-white/90">Ou rendez-vous directement au bureau de la vie scolaire.</p>
          </div>
          <div className="flex flex-col justify-center rounded-card border-2 border-line bg-white p-8">
            <p className="text-h-md text-ink">Vos données restent au lycée</p>
            <p className="mt-2 text-body-lg text-slate">
              Seule l&apos;équipe de la vie scolaire du {KIOSK.school} voit vos coordonnées et vos photos.
            </p>
          </div>
        </div>

        <Link href="/" className="press flex h-[60px] w-fit items-center gap-3 rounded-cta bg-blue px-9 text-label-xl text-white">
          Déclarer un objet
          <Icon name="arrow_forward" size={26} />
        </Link>
      </div>
    </Screen>
  );
}
