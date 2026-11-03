// Calcul des résultats et de la synthèse automatique « À garder / À corriger ».
import {
  LETTERS,
  loc,
  type Answers,
  type JarValue,
  type Letter,
  type Question,
  type Questionnaire,
  type ResponseRow,
} from "./types";

export const HEDONIC_FR = [
  "Je n'aime pas du tout",
  "Je n'aime vraiment pas",
  "Je n'aime pas",
  "Je n'aime pas trop",
  "Ni j'aime, ni je n'aime pas",
  "J'aime un peu",
  "J'aime",
  "J'aime beaucoup",
  "J'adore",
];
export const JAR_FR: Record<JarValue, string> = { low: "Pas assez", ok: "Juste bien", high: "Trop" };

// Seuils de la synthèse
export const KEEP_THRESHOLD = 50; // % de « Juste bien » pour garder un critère
export const AFTERTASTE_BAD_THRESHOLD = 34; // % de « Désagréable » pour signaler l'arrière-goût

export type JarStat = {
  kind: "jar";
  question: Question;
  n: number;
  counts: Record<JarValue, number>;
  pct: Record<JarValue, number>;
  verdict: "keep" | "reduce" | "increase" | "mixed" | null;
};
export type ScaleStat = { kind: "scale9"; question: Question; n: number; mean: number | null };
export type ChoiceStat = { kind: "choice"; question: Question; n: number; counts: number[]; pct: number[] };
export type TextStat = { kind: "text"; question: Question; n: number; texts: { who: string; text: string }[] };
export type QStat = JarStat | ScaleStat | ChoiceStat | TextStat;

export type FixItem = { label: string; action: "reduce" | "increase" | "mixed" | "aftertaste"; pct: number };

export type CanSummary = {
  letter: Letter;
  change: string;
  n: number;
  overallMean: number | null;
  overallCounts: number[]; // 9 cases
  rankCounts: number[]; // nombre de fois classée 1re, 2e, 3e, 4e
  meanRank: number | null;
  stats: QStat[];
  comments: { who: string; text: string }[];
  keeps: { who: string; text: string }[];
  keep: string[];
  fix: FixItem[];
  sentence: string;
};

export type ResultsSummary = {
  nSubmitted: number;
  nInProgress: number;
  cans: CanSummary[];
  best: Letter | null;
  headline: string | null;
  recipe: string[];
  bestByCriterion: { label: string; letter: Letter; ok: number }[];
  generalComments: { who: string; text: string; date: string | null }[];
};

const round = (x: number) => Math.round(x);
const shortLabel = (q: Question) => loc(q.short, "fr") || loc(q.label, "fr");
export const respondentName = (r: ResponseRow, i: number) => r.respondent_name || `Dégustateur ${i + 1}`;

function pctOf(count: number, n: number) {
  return n ? round((count / n) * 100) : 0;
}

export function summarize(qn: Questionnaire, responses: ResponseRow[]): ResultsSummary {
  const done = responses.filter((r) => r.submitted_at);
  const named = done.map((r, i) => ({ r, who: respondentName(r, i), a: (r.answers ?? {}) as Answers }));

  const cans: CanSummary[] = LETTERS.map((letter) => {
    const change = qn.iterations.find((x) => x.letter === letter)?.change ?? "";
    const canAnswers = named.map(({ a, who }) => ({ who, c: a.cans?.[letter], a }));

    // Appréciation globale
    const overall = canAnswers.map((x) => x.c?.overall).filter((v): v is number => typeof v === "number");
    const overallCounts = Array.from({ length: 9 }, (_, i) => overall.filter((v) => v === i + 1).length);
    const overallMean = overall.length ? overall.reduce((s, v) => s + v, 0) / overall.length : null;

    // Classement
    const rankCounts = [0, 0, 0, 0];
    const ranks: number[] = [];
    for (const { a } of named) {
      const idx = a.ranking?.indexOf(letter) ?? -1;
      if (idx >= 0 && idx < 4) {
        rankCounts[idx]++;
        ranks.push(idx + 1);
      }
    }
    const meanRank = ranks.length ? ranks.reduce((s, v) => s + v, 0) / ranks.length : null;

    // Questions
    const stats: QStat[] = qn.questions.map((q): QStat => {
      const vals = canAnswers.map((x) => ({ who: x.who, v: x.c?.q?.[q.id] })).filter((x) => x.v !== undefined && x.v !== null && x.v !== "");
      if (q.kind === "jar") {
        const counts = { low: 0, ok: 0, high: 0 } as Record<JarValue, number>;
        for (const { v } of vals) if (v === "low" || v === "ok" || v === "high") counts[v]++;
        const n = counts.low + counts.ok + counts.high;
        const pct = { low: pctOf(counts.low, n), ok: pctOf(counts.ok, n), high: pctOf(counts.high, n) };
        let verdict: JarStat["verdict"] = null;
        if (n > 0) {
          if (pct.ok >= KEEP_THRESHOLD && counts.ok >= Math.max(counts.low, counts.high)) verdict = "keep";
          else if (counts.high > counts.low) verdict = "reduce";
          else if (counts.low > counts.high) verdict = "increase";
          else verdict = counts.ok > counts.low ? "keep" : "mixed";
        }
        return { kind: "jar", question: q, n, counts, pct, verdict };
      }
      if (q.kind === "scale9") {
        const nums = vals.map((x) => x.v).filter((v): v is number => typeof v === "number");
        return { kind: "scale9", question: q, n: nums.length, mean: nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null };
      }
      if (q.kind === "choice") {
        const counts = q.options.map(() => 0);
        let n = 0;
        for (const { v } of vals) {
          const arr = Array.isArray(v) ? v : [v];
          let any = false;
          for (const i of arr) if (typeof i === "number" && i >= 0 && i < counts.length) { counts[i]++; any = true; }
          if (any) n++;
        }
        return { kind: "choice", question: q, n, counts, pct: counts.map((c) => pctOf(c, n)) };
      }
      const texts = vals.filter((x) => typeof x.v === "string" && x.v.trim()).map((x) => ({ who: x.who, text: String(x.v).trim() }));
      return { kind: "text", question: q, n: texts.length, texts };
    });

    // Synthèse
    const keep: string[] = [];
    const fix: FixItem[] = [];
    for (const s of stats) {
      if (s.kind === "jar" && s.verdict) {
        const label = shortLabel(s.question);
        if (s.verdict === "keep") keep.push(label);
        else if (s.verdict === "reduce") fix.push({ label, action: "reduce", pct: s.pct.high });
        else if (s.verdict === "increase") fix.push({ label, action: "increase", pct: s.pct.low });
        else fix.push({ label, action: "mixed", pct: Math.max(s.pct.low, s.pct.high) });
      }
      if (s.kind === "choice" && s.question.key === "aftertaste" && s.n > 0) {
        if (s.pct[2] >= AFTERTASTE_BAD_THRESHOLD) fix.push({ label: "arrière-goût", action: "aftertaste", pct: s.pct[2] });
        else if (s.pct[0] >= KEEP_THRESHOLD) keep.push("arrière-goût");
      }
    }

    return {
      letter,
      change,
      n: overall.length,
      overallMean,
      overallCounts,
      rankCounts,
      meanRank,
      stats,
      comments: canAnswers.filter((x) => x.c?.comment?.trim()).map((x) => ({ who: x.who, text: x.c!.comment!.trim() })),
      keeps: named.filter(({ a }) => a.keep?.[letter]?.trim()).map(({ a, who }) => ({ who, text: a.keep![letter]!.trim() })),
      keep,
      fix,
      sentence: canSentence(letter, keep, fix, overall.length),
    };
  });

  // Meilleure version : classement moyen (puis note moyenne)
  const ranked = cans
    .filter((c) => c.n > 0)
    .sort((a, b) => (a.meanRank ?? 9) - (b.meanRank ?? 9) || (b.overallMean ?? 0) - (a.overallMean ?? 0));
  const best = ranked[0]?.letter ?? null;
  const bestCan = cans.find((c) => c.letter === best);

  // Meilleure version par critère (le plus de « Juste bien »)
  const jarQs = qn.questions.filter((q) => q.kind === "jar");
  const bestByCriterion = jarQs
    .map((q) => {
      let top: { letter: Letter; ok: number } | null = null;
      for (const c of cans) {
        const s = c.stats.find((x) => x.question.id === q.id) as JarStat | undefined;
        if (s && s.n > 0 && (!top || s.pct.ok > top.ok)) top = { letter: c.letter, ok: s.pct.ok };
      }
      return top ? { label: shortLabel(q), ...top } : null;
    })
    .filter((x): x is { label: string; letter: Letter; ok: number } => !!x);

  // Piste de recette : partir de la meilleure, emprunter ailleurs ce qui est jugé juste
  const recipe: string[] = [];
  if (bestCan) {
    for (const f of bestCan.fix) {
      if (f.action === "aftertaste") {
        recipe.push(`Arrière-goût : jugé désagréable par ${f.pct} % sur ${best}, à retravailler.`);
        continue;
      }
      const alt = bestByCriterion.find((b) => b.label === f.label && b.letter !== best && b.ok >= KEEP_THRESHOLD);
      if (alt) recipe.push(`${cap(f.label)} : s'inspirer de ${alt.letter} (${alt.ok} % « juste bien »).`);
      else if (f.action === "reduce") recipe.push(`${cap(f.label)} : réduire par rapport à ${best}.`);
      else if (f.action === "increase") recipe.push(`${cap(f.label)} : augmenter par rapport à ${best}.`);
      else recipe.push(`${cap(f.label)} : avis partagés, à rediscuter avec le client.`);
    }
  }

  let headline: string | null = null;
  if (bestCan) {
    const bits: string[] = [];
    if (bestCan.overallMean != null) bits.push(`note moyenne ${fmtNum(bestCan.overallMean)}/9`);
    if (bestCan.rankCounts[0]) bits.push(`classée 1re par ${bestCan.rankCounts[0]} dégustateur(s) sur ${done.length}`);
    headline = `Version préférée : ${best}${bits.length ? ` (${bits.join(", ")})` : ""}.`;
  }

  return {
    nSubmitted: done.length,
    nInProgress: responses.length - done.length,
    cans,
    best,
    headline,
    recipe,
    bestByCriterion,
    generalComments: named
      .filter(({ a }) => a.general_comment?.trim())
      .map(({ a, who, r }) => ({ who, text: a.general_comment!.trim(), date: r.submitted_at })),
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtNum(x: number | null | undefined, digits = 1) {
  if (x == null) return "–";
  return x.toLocaleString("fr-BE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function joinFr(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/** Ex. « B : sucre jugé juste, acidité jugée trop forte → garder le sucre de B, réduire l'acidité. » */
function canSentence(letter: Letter, keep: string[], fix: FixItem[], n: number): string {
  if (!n) return `${letter} : pas encore de réponse.`;
  const parts: string[] = [];
  if (keep.length) parts.push(`garder ${joinFr(keep)}`);
  const reduce = fix.filter((f) => f.action === "reduce").map((f) => f.label);
  const increase = fix.filter((f) => f.action === "increase").map((f) => f.label);
  const mixed = fix.filter((f) => f.action === "mixed").map((f) => f.label);
  const after = fix.find((f) => f.action === "aftertaste");
  if (reduce.length) parts.push(`réduire ${joinFr(reduce)}`);
  if (increase.length) parts.push(`augmenter ${joinFr(increase)}`);
  if (after) parts.push("retravailler l'arrière-goût");
  if (mixed.length) parts.push(`avis partagés sur ${joinFr(mixed)}`);
  return `${letter} : ${parts.join(" ; ") || "rien à signaler"}.`;
}

/** Valeur lisible d'une réponse (pour l'export CSV). */
export function readableAnswer(q: Question, v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (q.kind === "jar") return JAR_FR[v as JarValue] ?? String(v);
  if (q.kind === "choice") {
    const arr = Array.isArray(v) ? v : [v];
    return arr.map((i) => loc(q.options[i as number], "fr")).join(" + ");
  }
  return String(v);
}
