import Link from "next/link";
import { Icon } from "@/components/kiosk/Icon";
import { Screen } from "@/components/kiosk/Screen";
import { KIOSK } from "@/lib/kiosk";

export default function RechercherPage() {
  return (
    <Screen variant="wizard">
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col items-center justify-center gap-6 px-8 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-selected text-blue-ink">
          <Icon name="manage_search" size={44} />
        </span>
        <div>
          <h1 className="text-h-xl text-ink">La recherche arrive bientôt</h1>
          <p className="mt-2 text-body-lg text-slate">
            Vous pourrez bientôt parcourir les objets trouvés directement depuis la borne. En attendant, déclarez votre
            perte : nous la rapprochons des objets déposés. Vous pouvez aussi demander à la vie scolaire, {KIOSK.helpDesk.toLowerCase()}.
          </p>
        </div>
        <Link
          href="/declarer/perdu/informations"
          className="press flex h-[60px] items-center gap-3 rounded-cta bg-signature px-10 text-label-xl text-white shadow-cta"
        >
          Déclarer une perte
          <Icon name="arrow_forward" size={26} />
        </Link>
      </div>
    </Screen>
  );
}
