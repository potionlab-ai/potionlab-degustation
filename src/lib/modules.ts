import type { Localized } from "./types";

/** Types de boisson. La clé correspond au "module" des questions. */
export const BEVERAGE_TYPES: { id: string; label: Localized }[] = [
  { id: "biere", label: { fr: "Bière", en: "Beer", nl: "Bier", es: "Cerveza" } },
  { id: "the_glace", label: { fr: "Thé glacé", en: "Iced tea", nl: "IJsthee", es: "Té helado" } },
  { id: "cold_brew", label: { fr: "Cold brew", en: "Cold brew", nl: "Cold brew", es: "Cold brew" } },
  { id: "limonade", label: { fr: "Limonade", en: "Lemonade", nl: "Limonade", es: "Limonada" } },
  { id: "hard_seltzer", label: { fr: "Hard seltzer", en: "Hard seltzer", nl: "Hard seltzer", es: "Hard seltzer" } },
  { id: "bissap_mate", label: { fr: "Bissap / Maté", en: "Bissap / Mate", nl: "Bissap / Maté", es: "Bissap / Mate" } },
  { id: "autre", label: { fr: "Autre", en: "Other", nl: "Andere", es: "Otra" } },
];

export const MODULE_LABELS: Record<string, string> = {
  base: "Base commune",
  ...Object.fromEntries(BEVERAGE_TYPES.map((b) => [b.id, b.label.fr!])),
};

export const MODULE_ORDER = ["base", ...BEVERAGE_TYPES.map((b) => b.id)];

export function beverageLabel(id: string, lang: keyof Localized = "fr"): string {
  const b = BEVERAGE_TYPES.find((x) => x.id === id);
  return b ? b.label[lang] || b.label.fr! : id;
}

export const KIND_LABELS: Record<string, string> = {
  jar: "Pas assez / Juste bien / Trop",
  scale9: "Échelle de 1 à 9",
  choice: "Choix multiple",
  text: "Texte libre",
};
