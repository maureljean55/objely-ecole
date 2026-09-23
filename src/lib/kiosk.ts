// Fixed iPad 11" landscape frame every screen is designed against.
export const FRAME = { width: 1194, height: 834 } as const;

// Per-installation values. Hardcoded for the first pilot; these move to the
// database once schools/kiosks are modelled.
export const KIOSK = {
  // Shown on two lines in the header ("Lycée" over "Jean Moulin"), and joined elsewhere.
  schoolType: "Lycée",
  schoolName: "Jean Moulin",
  school: "Lycée Jean Moulin",
  station: "Borne d'entrée principale",
  version: "2.4",
  helpDesk: "Poste 204",
  // Seconds without a touch before the borne wipes the form and returns home.
  idleSeconds: 90,
  // Seconds before the idle wipe at which we ask "still there?".
  idleWarningSeconds: 15,
} as const;
