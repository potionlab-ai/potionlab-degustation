import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import nl from "../../messages/nl.json";
import es from "../../messages/es.json";
import { LANGS, type Lang } from "./types";

export type Messages = typeof fr;
export const MESSAGES: Record<Lang, Messages> = { fr, en, nl, es };

/** Langue du navigateur, sinon français. */
export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "fr";
  for (const l of navigator.languages || [navigator.language]) {
    const short = l.slice(0, 2).toLowerCase() as Lang;
    if ((LANGS as readonly string[]).includes(short)) return short;
  }
  return "fr";
}

/** Remplace {variable} dans un texte. */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
