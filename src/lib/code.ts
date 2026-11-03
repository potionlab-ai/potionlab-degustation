/** Alphabet des codes générés : sans 0/O ni 1/I/L. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** "abc-def", " ABC DEF " -> "ABCDEF" */
export function normalizeCode(input: string): string {
  return (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "ABCDEF" -> "ABC-DEF" ; "DEMO01" -> "DEMO-01" */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  if (c === "DEMO01") return "DEMO-01";
  return c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
}
