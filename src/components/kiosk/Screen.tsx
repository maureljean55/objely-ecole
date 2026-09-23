import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

// One tablet screen: 84px header + 686px workspace + 64px footer = 834px.
export function Screen({ variant, children }: { variant: "home" | "wizard"; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <Header variant={variant} />
      <main className="relative min-h-0 flex-1">{children}</main>
      <Footer variant={variant} />
    </div>
  );
}
