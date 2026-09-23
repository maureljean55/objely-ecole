import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

// One tablet screen: 84px header + 686px workspace + 64px footer = 834px.
// `kind` sets the accent colour for the whole screen (blue = lost, violet = found).
export function Screen({
  variant,
  kind,
  children,
}: {
  variant: "home" | "wizard";
  kind?: "perdu" | "trouve";
  children: ReactNode;
}) {
  return (
    <div data-kind={kind} className="flex h-full w-full flex-col bg-canvas">
      <Header variant={variant} />
      <main className="relative min-h-0 flex-1">{children}</main>
      <Footer variant={variant} />
    </div>
  );
}
