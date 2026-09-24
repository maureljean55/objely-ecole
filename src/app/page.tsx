import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ResetDraft } from "@/components/home/ResetDraft";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";

export default function HomePage() {
  return (
    <Screen variant="home">
      <ResetDraft />
      <div className="mx-auto flex h-full w-full max-w-[1194px] gap-8 px-8 pb-5 pt-3">
        <div className="w-5/12 shrink-0">
          <Hero />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h1 className="text-display text-ink">
              Perdu ou trouvé un objet <span className="block text-blue">au lycée ?</span>
            </h1>
            <p className="mt-4 text-body-xl text-slate">
              Objely aide les élèves et le personnel à retrouver leurs affaires rapidement. Déclarez un objet en moins
              d&apos;une minute : nous rapprochons les déclarations et vous alertons automatiquement.
            </p>
          </div>

          <div className="flex flex-col gap-5 pb-2">
            <Link href="/declarer/perdu/informations" className="action-card action-lost press">
              <span className="action-icon">
                <Icon name="sentiment_very_dissatisfied" fill size={42} className="action-glyph-lost" />
              </span>
              <span className="action-body">
                <h2>J&apos;ai perdu un objet</h2>
                <p>Faire une déclaration de perte</p>
              </span>
            </Link>

            <Link href="/declarer/trouve/informations" className="action-card action-found press">
              <span className="action-icon">
                <Icon name="handshake" fill size={42} className="action-glyph-found" />
              </span>
              <span className="action-body">
                <h2>J&apos;ai trouvé un objet</h2>
                <p>Déposer à la vie scolaire</p>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Screen>
  );
}
