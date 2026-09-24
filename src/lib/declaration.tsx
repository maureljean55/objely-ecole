"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Kind = "perdu" | "trouve";
export type CategoryId = "telephone" | "sac" | "cles" | "vetement" | "scolaire" | "autre";

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "telephone", label: "Téléphone", icon: "smartphone" },
  { id: "sac", label: "Sac & Dos", icon: "backpack" },
  { id: "cles", label: "Clés / Badge", icon: "key" },
  { id: "vetement", label: "Vêtement", icon: "checkroom" },
  { id: "scolaire", label: "Scolaire", icon: "menu_book" },
  { id: "autre", label: "Autre", icon: "more_horiz" },
];

export const LOCATIONS = [
  "CDI (1er étage)",
  "Cantine / Réfectoire",
  "Gymnase & Vestiaires",
  "Cour de récréation",
  "Salle de cours",
  "Couloir / Hall",
  "Je ne sais pas",
];

export const PHOTO_SLOTS = [
  { label: "Face avant", empty: "Ajouter la face avant", icon: "add_a_photo" },
  { label: "Vue arrière", empty: "Ajouter la vue arrière", icon: "add_a_photo" },
  { label: "Numéro de série / détail", empty: "Numéro de série / détail", icon: "add" },
] as const;

export const DESCRIPTION_MAX = 250;

export type Declaration = {
  nom: string;
  prenom: string;
  classe: string;
  telephone: string;
  category: CategoryId | null;
  objectName: string;
  location: string;
  description: string;
  /** One data URL per PHOTO_SLOTS entry, null while empty. */
  photos: (string | null)[];
  /** Set once the declaration has been submitted. */
  reference: string | null;
};

const EMPTY: Declaration = {
  nom: "",
  prenom: "",
  classe: "",
  telephone: "",
  category: null,
  objectName: "",
  location: "",
  description: "",
  photos: [null, null, null],
  reference: null,
};

const STORAGE_KEY = "objely-ecole:declaration";

/** Wipes any in-progress declaration. The home screen calls this on every visit. */
export function clearStoredDeclaration() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}

type Ctx = {
  kind: Kind;
  declaration: Declaration;
  /** False until the stored draft has been read; guards must wait for it. */
  ready: boolean;
  update: (patch: Partial<Declaration>) => void;
  setPhoto: (slot: number, dataUrl: string | null) => void;
  /** Puts a photo in the first free slot; dropped when all slots are taken. */
  addPhoto: (dataUrl: string) => void;
  reset: () => void;
};

const DeclarationContext = createContext<Ctx | null>(null);

// The draft lives in sessionStorage so a refresh on the borne doesn't lose
// the form, but it never outlives the browser session (shared device).
export function DeclarationProvider({ kind, children }: { kind: Kind; children: ReactNode }) {
  const [declaration, setDeclaration] = useState<Declaration>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // sessionStorage doesn't exist on the server, so the draft can only be read after mount.
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDeclaration({ ...EMPTY, ...(JSON.parse(raw) as Partial<Declaration>) });
    } catch {
      // Corrupt or blocked storage: start from an empty form.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(declaration));
    } catch {
      // Quota or blocked storage: the form still works in memory.
    }
  }, [declaration, ready]);

  const update = useCallback((patch: Partial<Declaration>) => setDeclaration((d) => ({ ...d, ...patch })), []);
  const setPhoto = useCallback(
    (slot: number, dataUrl: string | null) =>
      setDeclaration((d) => ({ ...d, photos: d.photos.map((p, i) => (i === slot ? dataUrl : p)) })),
    [],
  );
  const addPhoto = useCallback(
    (dataUrl: string) =>
      setDeclaration((d) => {
        const slot = d.photos.findIndex((p) => !p);
        return slot < 0 ? d : { ...d, photos: d.photos.map((p, i) => (i === slot ? dataUrl : p)) };
      }),
    [],
  );
  const reset = useCallback(() => {
    clearStoredDeclaration();
    setDeclaration(EMPTY);
  }, []);

  const value = useMemo(
    () => ({ kind, declaration, ready, update, setPhoto, addPhoto, reset }),
    [kind, declaration, ready, update, setPhoto, addPhoto, reset],
  );
  return <DeclarationContext.Provider value={value}>{children}</DeclarationContext.Provider>;
}

export function useDeclaration() {
  const ctx = useContext(DeclarationContext);
  if (!ctx) throw new Error("useDeclaration must be used inside <DeclarationProvider>");
  return ctx;
}

export const KIND_COPY = {
  perdu: {
    badge: "Objet perdu",
    badgeIcon: "search",
    objectTitle: "Quel objet avez-vous perdu ?",
    locationLabel: "Lieu de la perte",
    photosLead: "Une photo multiplie par 3 les chances de restitution rapide au sein de l'établissement.",
  },
  trouve: {
    badge: "Objet trouvé",
    badgeIcon: "volunteer_activism",
    objectTitle: "Quel objet avez-vous trouvé ?",
    locationLabel: "Lieu de la découverte",
    photosLead: "Une photo permet à son propriétaire de le reconnaître sans se déplacer.",
  },
} as const;

/** Formats a French phone number as the user types: "0612345678" → "06 12 34 56 78". */
export function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

export function isValidPhone(value: string) {
  return value === "" || /^0\d( \d{2}){4}$/.test(value);
}
