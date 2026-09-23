import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { KioskFrame } from "@/components/kiosk/KioskFrame";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
  themeColor: "#f6f8fc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <KioskFrame>{children}</KioskFrame>
      </body>
    </html>
  );
}
