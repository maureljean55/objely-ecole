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

          {/* Handwritten, tilted note in the app's blue-violet gradient, pointing down at the cards. */}
          <div
            aria-hidden="true"
            className="relative ml-4 w-fit -rotate-[4deg]"
            style={{ fontFamily: "var(--font-caveat), cursive" }}
          >
            <p
              className="text-[28px] font-bold leading-[1.1] tracking-[0.2px]"
              style={{
                backgroundImage: "linear-gradient(90deg, #087be8, #735af4, #a34ee9)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Derrière chaque objet perdu,
              <br />
              il y a quelqu&apos;un qui le cherche.
            </p>
            {/* Curved arrow: the two short strokes at the end form the head, aligned with the curve's
                tangent (down and slightly left) so the tip lands just above the card. */}
            <svg className="absolute left-full top-[18px] -ml-2 h-[86px] w-[74px]" viewBox="0 0 60 70" fill="none">
              <defs>
                <linearGradient id="noteArrow" x1="4" y1="4" x2="44" y2="58" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#735af4" />
                  <stop offset="1" stopColor="#a34ee9" />
                </linearGradient>
              </defs>
              <path d="M6 6C40 4 58 26 40 56" stroke="url(#noteArrow)" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M50.2 49.8L40 56L40.6 44" stroke="url(#noteArrow)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
