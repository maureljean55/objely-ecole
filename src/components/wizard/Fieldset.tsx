import type { ReactNode } from "react";

// Form grid wrapper: submitting on the borne is done with the big buttons,
// so pressing Enter in a field must never reload the page.
export function Fieldset({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className={className}>
      {children}
    </form>
  );
}
