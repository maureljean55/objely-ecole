import Link from "next/link";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";
import { KIOSK } from "@/lib/kiosk";

const STEPS = [
  { icon: "edit_note", title: "Vous déclarez", text: "Objet perdu ou trouvé : trois étapes, moins d'une minute." },
  { icon: "compare_arrows", title: "Nous rapprochons", text: "La vie scolaire compare les déclarations et les objets déposés." },
  { icon: "task_alt", title: "Vous êtes prévenu", text: "Dès qu'un objet correspond, vous êtes contacté pour le récupérer." },
];

export default function AssistancePage() {
  return (
    <Screen variant="wizard">
      <div className="mx-auto flex h-full w-full max-w-[1130px] flex-col gap-5 px-8 py-6">
        <div>
          <h1 className="text-h-xl text-ink">Assistance</h1>
          <p className="mt-1 text-body-lg text-slate">Comment fonctionne la borne, et qui contacter si vous êtes bloqué.</p>
        </div>

        <ol className="grid grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <li key={s.title} className="rounded-card border border-line bg-white p-5 shadow-rest">
              <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-selected text-blue-ink">
                <Icon name={s.icon} size={26} />
              </span>
              <p className="text-h-md text-ink">{s.title}</p>
              <p className="mt-1 text-body-md text-slate">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex items-center gap-5 rounded-card bg-signature p-7 text-white shadow-cta">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Icon name="support_agent" fill size={36} />
            </span>
            <div>
              <p className="text-label-sm uppercase tracking-wide text-white/85">Aide vie scolaire</p>
              <p className="text-h-xl">{KIOSK.helpDesk}</p>
              <p className="text-body-md text-white/90">Ou rendez-vous au bureau de la vie scolaire.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-card border border-line bg-white p-7 shadow-rest">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-tint-purple text-purple-ink">
              <Icon name="lock" fill size={32} />
            </span>
            <div>
              <p className="text-h-md text-ink">Vos données restent au lycée</p>
              <p className="mt-1 text-body-md text-slate">
                Seule l&apos;équipe de la vie scolaire du {KIOSK.school} voit vos coordonnées et vos photos.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="press flex h-[60px] w-fit items-center gap-3 rounded-cta bg-signature px-10 text-label-xl text-white shadow-cta"
        >
          Déclarer un objet
          <Icon name="arrow_forward" size={26} />
        </Link>
      </div>
    </Screen>
  );
}
