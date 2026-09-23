import { notFound } from "next/navigation";
import { IdleGuard } from "@/components/kiosk/IdleGuard";
import { Screen } from "@/components/kiosk/Screen";
import { DeclarationProvider } from "@/lib/declaration";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ kind: "perdu" }, { kind: "trouve" }];
}

export default async function DeclarerLayout({ children, params }: LayoutProps<"/declarer/[kind]">) {
  const { kind } = await params;
  if (kind !== "perdu" && kind !== "trouve") notFound();

  return (
    <Screen variant="wizard">
      <DeclarationProvider kind={kind}>
        <IdleGuard>{children}</IdleGuard>
      </DeclarationProvider>
    </Screen>
  );
}
