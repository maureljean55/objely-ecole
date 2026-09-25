"use client";

import { useKiosk } from "@/components/kiosk/KioskProvider";
import { atSchool } from "@/lib/kiosk";

// The home title and lead, worded for the establishment's type ("au lycée", "à l'université"…).
export function HomeTitle() {
  const { schoolType } = useKiosk();
  return (
    <div>
      <h1 className="text-display text-ink">
        Perdu ou trouvé un objet <span className="block text-blue">{atSchool(schoolType)} ?</span>
      </h1>
      <p className="mt-4 text-body-xl text-slate">
        Objely aide les élèves et le personnel à retrouver leurs affaires rapidement. Déclarez un objet en moins d&apos;une
        minute : nous cherchons tout de suite s&apos;il a déjà été trouvé, et la vie scolaire vous prévient dès qu&apos;il est retrouvé.
      </p>
    </div>
  );
}
