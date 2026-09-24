import type { CategoryId } from "@/lib/declaration";

// An object that has been handed in to the vie scolaire and can be given back to its owner.
// Objects only reported as found (not yet deposited) are never listed: they can't be restituted.
export type ListedObject = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  /** Where it was found. */
  foundAt: string;
  /** ISO date it was handed in. */
  depositedAt: string;
  /** Optional photo; without one the card shows the category icon. */
  photoUrl?: string;
};

// TODO: demo data. Replace with a Supabase query (objects handed in, not yet restituted)
// once the schema exists and the project keys are set. Nothing about the finder or a
// claimed owner may ever be exposed here: this list is public on the borne.
const DEMO: ListedObject[] = [
  { id: "o1", name: "Écouteurs sans fil noirs", category: "autre", description: "Boîtier de charge noir, petit autocollant blanc au dos.", foundAt: "Cantine", depositedAt: "2026-09-23T12:10:00+02:00", photoUrl: "/illustrations/splash/earbuds.png" },
  { id: "o2", name: "Portefeuille en cuir marron", category: "autre", description: "Cuir vieilli, plusieurs compartiments pour cartes.", foundAt: "Couloir bâtiment B", depositedAt: "2026-09-23T09:40:00+02:00", photoUrl: "/illustrations/splash/wallet.png" },
  { id: "o3", name: "Téléphone gris métallisé", category: "telephone", description: "Écran fissuré en bas à gauche, pas de coque.", foundAt: "Gymnase", depositedAt: "2026-09-22T16:25:00+02:00", photoUrl: "/illustrations/splash/phone.png" },
  { id: "o4", name: "Trousseau de clés", category: "cles", description: "Trois clés et une télécommande de voiture, porte-clés rond.", foundAt: "Salle de cours", depositedAt: "2026-09-22T11:05:00+02:00", photoUrl: "/illustrations/splash/keys.png" },
  { id: "o5", name: "Calculatrice graphique", category: "scolaire", description: "Coque turquoise, autocollant panda blanc au dos.", foundAt: "Salle B12", depositedAt: "2026-09-22T10:15:00+02:00" },
  { id: "o6", name: "Sweat gris à capuche", category: "vetement", description: "Taille M, étiquette arrachée, poche kangourou.", foundAt: "Cour", depositedAt: "2026-09-21T13:30:00+02:00" },
  { id: "o7", name: "Sac à dos bleu marine", category: "sac", description: "Deux fermetures, badge rond jaune sur la sangle.", foundAt: "CDI", depositedAt: "2026-09-21T09:00:00+02:00" },
  { id: "o8", name: "Gourde métallique verte", category: "autre", description: "Bouchon noir, quelques rayures sur le côté.", foundAt: "Gymnase", depositedAt: "2026-09-19T15:45:00+02:00" },
  { id: "o9", name: "Badge de cantine", category: "cles", description: "Badge blanc sur cordon rouge.", foundAt: "Cantine", depositedAt: "2026-09-19T12:20:00+02:00" },
  { id: "o10", name: "Trousse rouge", category: "scolaire", description: "Zip noir, contient des stylos et un surligneur.", foundAt: "Salle de cours", depositedAt: "2026-09-18T14:10:00+02:00" },
  { id: "o11", name: "Veste de sport noire", category: "vetement", description: "Trois bandes blanches sur les manches.", foundAt: "Gymnase", depositedAt: "2026-09-18T10:00:00+02:00" },
  { id: "o12", name: "Cahier de maths", category: "scolaire", description: "Couverture verte, prénom écrit au crayon à l'intérieur.", foundAt: "Couloir bâtiment B", depositedAt: "2026-09-17T16:30:00+02:00" },
];

export async function listObjects(): Promise<{ objects: ListedObject[]; source: "demo" }> {
  // Newest deposits first.
  const objects = [...DEMO].sort((a, b) => b.depositedAt.localeCompare(a.depositedAt));
  return { objects, source: "demo" };
}
