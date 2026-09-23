import type { Declaration, Kind } from "@/lib/declaration";

// TODO: not persisted yet. Replace with a Supabase insert (declarations table
// + photo upload to storage) once the schema exists; the reference should
// then come from the row, not be generated here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitDeclaration(_kind: Kind, _declaration: Declaration): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `OBJ-${suffix}`;
}
