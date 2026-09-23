import Link from "next/link";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";
import { KIOSK } from "@/lib/kiosk";

export default function RechercherPage() {
  return (
    <Screen variant="wizard">
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col items-start justify-center gap-6 px-8">
        <div>
          <h1 className="text-h-xl text-ink">La recherche arrive bientôt</h1>
          <p className="mt-3 text-body-xl text-slate">
            Vous pourrez bientôt parcourir les objets trouvés directement depuis la borne. En attendant, déclarez votre
            perte : la vie scolaire la compare aux objets déposés. Vous pouvez aussi passer au bureau ou appeler le{" "}
            <span className="font-mono text-ink">{KIOSK.helpDesk.toLowerCase()}</span>.
          </p>
        </div>
        <Link
          href="/declarer/perdu/informations"
          className="press flex h-[60px] items-center gap-3 rounded-cta bg-blue px-9 text-label-xl text-white"
        >
          Déclarer une perte
          <Icon name="arrow_forward" size={26} />
        </Link>
      </div>
    </Screen>
  );
}
