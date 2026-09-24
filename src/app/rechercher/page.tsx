import { Screen } from "@/components/kiosk/Screen";
import { SearchPage } from "@/components/search/SearchPage";

// Read-only: lists the objects handed in to the vie scolaire, which can be given back to their owner.
export default function RechercherPage() {
  return (
    <Screen variant="wizard" kind="perdu">
      <SearchPage />
    </Screen>
  );
}
