"use client";

import { useEffect } from "react";
import { clearStoredDeclaration } from "@/lib/declaration";

// Landing on the home screen always means a fresh start: whatever a previous
// visitor left in sessionStorage is dropped.
export function ResetDraft() {
  useEffect(() => clearStoredDeclaration(), []);
  return null;
}
