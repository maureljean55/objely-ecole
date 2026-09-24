// Fixed iPad 11" landscape frame every screen is designed against.
export const FRAME = { width: 1194, height: 834 } as const;

/** This app's version (package.json), set at build time in next.config.ts. */
export const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
// Seconds before the idle wipe at which we ask "still there?".
export const IDLE_WARNING_SECONDS = 15;

/** What a borne knows about itself and its establishment, read from the database once paired. */
export type KioskConfig = {
  /** Name of this borne ("Borne d'entrée principale"). */
  station: string;
  /** Full establishment name ("Lycée Jean Moulin"). */
  school: string;
  /** "Lycée", "Université"… shown small above the name in the header. */
  schoolType: string;
  /** The name without the type when it repeats it ("Jean Moulin"). */
  schoolName: string;
  /** Help-desk number, or null when the establishment gave none. */
  helpDesk: string | null;
  /** Seconds without a touch before the borne wipes the form and returns home. */
  idleSeconds: number;
};

const TYPE_LABELS: Record<string, string> = { ecole: "École", college: "Collège", lycee: "Lycée", universite: "Université" };

type ConfigRow = { kiosk_name: string; school_name: string; school_type: string; help_desk: string | null; idle_seconds: number };

export function toConfig(row: ConfigRow): KioskConfig {
  const schoolType = TYPE_LABELS[row.school_type] ?? "Établissement";
  const stripped = row.school_name.replace(new RegExp(`^${schoolType}\\s+`, "i"), "").trim();
  return {
    station: row.kiosk_name,
    school: row.school_name,
    schoolType,
    schoolName: stripped || row.school_name,
    helpDesk: row.help_desk?.trim() || null,
    idleSeconds: row.idle_seconds,
  };
}
