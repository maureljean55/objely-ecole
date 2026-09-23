import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

// One tablet screen: 84px header band + 686px workspace + 64px footer = 834px.
// The header is a glass bar floating over the top band, so the workspace starts at 84px.
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
    <div data-kind={kind} className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
      {/* Colour behind the glass: the logo's blue, violet and a touch of cyan, fading out below the bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[330px]"
        style={{
          background:
            "radial-gradient(ellipse 380px 190px at 10% -20px, rgba(31, 99, 224, 0.5) 0%, transparent 72%), radial-gradient(ellipse 420px 200px at 90% -30px, rgba(141, 108, 243, 0.5) 0%, transparent 72%), radial-gradient(ellipse 340px 150px at 52% 0px, rgba(56, 211, 255, 0.36) 0%, transparent 72%)",
        }}
      />
      <Header variant={variant} />
      <main className="relative mt-[84px] min-h-0 flex-1">{children}</main>
      <Footer variant={variant} />
    </div>
  );
}
