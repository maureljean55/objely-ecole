import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ResetDraft } from "@/components/home/ResetDraft";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";

// The two big doors take the two colours of the logo's rings: blue for the
// person looking for something, violet for the person who found it.
export default function HomePage() {
  return (
    <Screen variant="home">
      <ResetDraft />
      <div className="mx-auto flex h-full w-full max-w-[1130px] gap-8 px-8 py-5">
        <div className="w-5/12 shrink-0">
          <Hero />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h1 className="text-display text-ink">Vous avez perdu ou trouvé quelque chose ?</h1>
            <p className="mt-4 text-body-xl text-slate">
              Dites-nous ce que c&apos;est et où. La vie scolaire fait le lien entre ceux qui cherchent et ceux qui ont
              trouvé. Une minute suffit.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/declarer/perdu/informations"
              className="press flex h-[176px] items-center justify-between rounded-card bg-blue px-8 text-white"
            >
              <span>
                <span className="block font-display text-[38px] font-extrabold leading-tight tracking-tight">
                  J&apos;ai perdu un objet
                </span>
                <span className="mt-1 block text-body-lg text-white/90">Je le cherche</span>
              </span>
              <span className="flex size-16 items-center justify-center rounded-full bg-white text-blue">
                <Icon name="arrow_forward" size={34} />
              </span>
            </Link>
            <Link
              href="/declarer/trouve/informations"
              className="press flex h-[176px] items-center justify-between rounded-card bg-purple px-8 text-white"
            >
              <span>
                <span className="block font-display text-[38px] font-extrabold leading-tight tracking-tight">
                  J&apos;ai trouvé un objet
                </span>
                <span className="mt-1 block text-body-lg text-white/90">Je le dépose à la vie scolaire</span>
              </span>
              <span className="flex size-16 items-center justify-center rounded-full bg-white text-purple">
                <Icon name="arrow_forward" size={34} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Screen>
  );
}
