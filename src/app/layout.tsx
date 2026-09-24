import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque, Caveat, IBM_Plex_Mono } from "next/font/google";
import { KioskFrame } from "@/components/kiosk/KioskFrame";
import "./globals.css";

// Body: Atkinson Hyperlegible, designed for legibility at a glance (a borne is read standing, at arm's length).
const body = Atkinson_Hyperlegible_Next({ variable: "--font-body", subsets: ["latin"], display: "swap" });
// Titles: Bricolage Grotesque, heavy and slightly quirky rather than neutral.
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });
// Handwritten accent for the little tilted note on the home splash (same font as the Objely app).
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["700"], display: "swap" });
// Numbers and labels that read like a printed ticket.
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "Objely École · Objets perdus et trouvés",
  description: "Borne tactile pour déclarer un objet perdu ou trouvé dans l'établissement.",
  appleWebApp: { capable: true, title: "Objely École", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f1f2f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${body.variable} ${bricolage.variable} ${plexMono.variable} ${caveat.variable}`}>
      <body>
        <KioskFrame>{children}</KioskFrame>
      </body>
    </html>
  );
}
