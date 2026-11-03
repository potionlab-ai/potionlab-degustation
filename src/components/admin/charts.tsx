// Graphiques simples et lisibles (HTML/CSS, pas de bibliothèque).
import type { JarStat } from "@/lib/results";
import { JAR_FR } from "@/lib/results";

export const JAR_COLORS = { low: "var(--color-jar-low)", ok: "var(--color-jar-ok)", high: "var(--color-jar-high)" };

export function JarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {(["low", "ok", "high"] as const).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: JAR_COLORS[k] }} aria-hidden />
          {JAR_FR[k]}
        </span>
      ))}
    </div>
  );
}

const VERDICT: Record<NonNullable<JarStat["verdict"]>, { text: string; cls: string }> = {
  keep: { text: "✓ À garder", cls: "bg-[#eaf6f0] text-[#1f7a58]" },
  reduce: { text: "↓ Réduire", cls: "bg-[#fdece6] text-[#b23f1c]" },
  increase: { text: "↑ Augmenter", cls: "bg-[#e9effb] text-[#2f57ad]" },
  mixed: { text: "≈ Partagé", cls: "bg-paper text-muted" },
};

export function VerdictChip({ verdict }: { verdict: JarStat["verdict"] }) {
  if (!verdict) return null;
  const v = VERDICT[verdict];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.cls}`}>{v.text}</span>;
}

/** Barre empilée Pas assez / Juste bien / Trop pour un critère. */
export function JarBar({ stat, label }: { stat: JarStat; label: string }) {
  const parts = (["low", "ok", "high"] as const).filter((k) => stat.counts[k] > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <VerdictChip verdict={stat.verdict} />
      </div>
      {stat.n === 0 ? (
        <div className="h-3 rounded-full bg-paper" />
      ) : (
        <div
          className="flex h-3 gap-[2px] overflow-hidden rounded-full"
          role="img"
          aria-label={`${label} : ${JAR_FR.low} ${stat.pct.low} %, ${JAR_FR.ok} ${stat.pct.ok} %, ${JAR_FR.high} ${stat.pct.high} %`}
        >
          {parts.map((k) => (
            <div
              key={k}
              title={`${JAR_FR[k]} : ${stat.pct[k]} % (${stat.counts[k]}/${stat.n})`}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${stat.pct[k]}%`, background: JAR_COLORS[k] }}
            />
          ))}
        </div>
      )}
      <div className="mt-1 grid grid-cols-3 text-xs tabular-nums text-muted">
        <span>
          {JAR_FR.low} <b className="font-semibold text-ink">{stat.pct.low} %</b>
        </span>
        <span className="text-center">
          {JAR_FR.ok} <b className="font-semibold text-ink">{stat.pct.ok} %</b>
        </span>
        <span className="text-right">
          {JAR_FR.high} <b className="font-semibold text-ink">{stat.pct.high} %</b>
        </span>
      </div>
    </div>
  );
}

/** Barre horizontale simple (note sur 9, ou pourcentage). */
export function MeterBar({
  value,
  max,
  highlight,
  label,
}: {
  value: number | null;
  max: number;
  highlight?: boolean;
  label: string;
}) {
  const w = value == null ? 0 : Math.max(2, (value / max) * 100);
  return (
    <div className="h-2.5 w-full rounded-full bg-paper" role="img" aria-label={label} title={label}>
      <div
        className={`h-full rounded-full ${highlight ? "bg-brand" : "bg-ink/25"}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}
