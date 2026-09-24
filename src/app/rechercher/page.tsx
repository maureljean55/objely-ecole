import { ObjectBrowser } from "@/components/search/ObjectBrowser";
import { Screen } from "@/components/kiosk/Screen";
import { listObjects } from "@/lib/objects";

// Read-only: lists the objects handed in to the vie scolaire, which can be given back to their owner.
export default async function RechercherPage() {
  const { objects, source } = await listObjects();
  return (
    <Screen variant="wizard" kind="perdu">
      <ObjectBrowser objects={objects} isDemo={source === "demo"} />
    </Screen>
  );
}
