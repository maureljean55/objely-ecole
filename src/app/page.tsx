import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ResetDraft } from "@/components/home/ResetDraft";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";

const REASSURANCE = [
  { icon: "bolt", title: "Rapide", hint: "Moins d'une minute", tone: "bg-selected text-blue-ink" },
  { icon: "photo_camera", title: "Smartphone", hint: "Scan QR instantané", tone: "bg-tint-purple text-purple-ink" },
  { icon: "shield", title: "Protégé", hint: "Données sécurisées", tone: "bg-selected text-blue-ink" },
];

export default function HomePage() {
  return (
    <Screen variant="home">
      <ResetDraft />
      <div className="mx-auto flex h-full w-full max-w-[1130px] gap-6 px-8 py-4">
        <div className="w-5/12 shrink-0 animate-rise">
          <Hero />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="animate-rise [animation-delay:60ms]">
            <h1 className="text-display text-ink">
              Perdu ou trouvé un objet <span className="block text-blue">au lycée ?</span>
            </h1>
            <p className="mt-3 text-body-lg text-slate">
              Objely aide les élèves et le personnel à retrouver leurs affaires rapidement. Déclarez un objet en moins
              d&apos;une minute : nous rapprochons les déclarations et vous alertons automatiquement.
            </p>
          </div>

          <ul className="grid grid-cols-3 gap-3 animate-rise [animation-delay:120ms]">
            {REASSURANCE.map((item) => (
              <li key={item.title} className="rounded-card border border-line bg-white p-4 shadow-rest">
                <span className={`mb-3 flex size-11 items-center justify-center rounded-xl ${item.tone}`}>
                  <Icon name={item.icon} size={24} fill={item.icon === "shield"} />
                </span>
                <p className="text-h-md text-ink">{item.title}</p>
                <p className="mt-0.5 text-label-sm font-medium text-slate">{item.hint}</p>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-4 animate-rise [animation-delay:180ms]">
            <Link
              href="/declarer/perdu/informations"
              className="press flex h-[132px] flex-col items-center justify-center gap-0.5 rounded-card bg-signature text-center text-white shadow-cta"
            >
              <Icon name="search" size={38} className="mb-0.5" />
              <span className="text-h-md font-bold">J&apos;ai perdu un objet</span>
              <span className="text-label-sm font-medium text-white/90">Faire une déclaration de perte</span>
            </Link>
            <Link
              href="/declarer/trouve/informations"
              className="press flex h-[132px] flex-col items-center justify-center gap-0.5 rounded-card border border-line bg-white text-center shadow-rest hover:border-line-strong"
            >
              <Icon name="volunteer_activism" fill size={38} className="mb-0.5 text-purple-ink" />
              <span className="text-h-md font-bold text-ink">J&apos;ai trouvé un objet</span>
              <span className="text-label-sm font-medium text-slate">Déposer à la vie scolaire</span>
            </Link>
          </div>
        </div>
      </div>
    </Screen>
  );
}
