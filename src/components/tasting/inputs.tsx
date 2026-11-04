"use client";
import { useId } from "react";
import { IconCheck } from "../icons";
import type { JarValue } from "@/lib/types";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/** Échelle 1 à 9 (appréciation globale, ou question sur mesure). */
export function NineScale({
  value,
  onChange,
  labels,
  lowLabel,
  highLabel,
  placeholder,
  invalid,
  labelledBy,
}: {
  value?: number;
  onChange: (v: number) => void;
  /** Libellé pour chaque note (échelle hédonique) */
  labels?: string[];
  lowLabel: string;
  highLabel: string;
  placeholder?: string;
  invalid?: boolean;
  labelledBy?: string;
}) {
  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={labels ? `${n} · ${labels[n - 1]}` : String(n)}
              onClick={() => onChange(n)}
              className={cx(
                "flex h-12 items-center justify-center rounded-xl border text-base font-medium tabular-nums transition duration-200 sm:h-14 sm:rounded-2xl sm:text-lg",
                selected
                  ? "bg-brand scale-[1.06] border-transparent text-white shadow-[0_8px_18px_-8px_rgb(232_69_122/0.8)]"
                  : invalid
                    ? "border-rose/40 bg-blush/60 text-ink"
                    : "border-line bg-white text-ink hover:border-ink/25",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        className="mt-3 h-1 rounded-full bg-gradient-to-r from-line via-coral/50 to-rose/80"
        aria-hidden
      />
      <div className="mt-2 flex justify-between gap-4 text-xs leading-tight text-muted">
        <span className="max-w-[45%]">1 · {lowLabel}</span>
        <span className="max-w-[45%] text-right">9 · {highLabel}</span>
      </div>
      {labels && (
        <p
          className={cx(
            "mt-3 min-h-6 text-center text-base font-medium",
            value ? "text-ink" : invalid ? "text-rose" : "text-faint",
          )}
          aria-live="polite"
        >
          {value ? labels[value - 1] : placeholder}
        </p>
      )}
    </div>
  );
}

/** Pas assez / Juste bien / Trop */
export function JarInput({
  label,
  value,
  onChange,
  options,
  invalid,
  requiredText,
}: {
  label: string;
  value?: JarValue;
  onChange: (v: JarValue) => void;
  options: Record<JarValue, string>;
  invalid?: boolean;
  requiredText: string;
}) {
  const id = useId();
  return (
    <div
      data-invalid={invalid || undefined}
      className={cx("rounded-2xl p-3 -mx-3 transition", invalid && "bg-blush/70")}
    >
      <p id={id} className="mb-2 text-[15px] font-medium text-ink">
        {label}
        {invalid && <span className="ml-2 text-xs font-normal text-rose">{requiredText}</span>}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-3 gap-1 rounded-full bg-ink/[0.05] p-1">
        {(["low", "ok", "high"] as JarValue[]).map((v) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(v)}
              className={cx(
                "min-h-11 rounded-full px-1 text-sm font-medium transition duration-200 sm:text-[15px]",
                selected
                  ? "bg-brand text-white shadow-[0_6px_14px_-8px_rgb(232_69_122/0.9)]"
                  : "text-muted hover:bg-white/80 hover:text-ink",
              )}
            >
              {options[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Choix (unique ou multiple). Valeur : index, ou liste d'index. */
export function ChoiceInput({
  label,
  options,
  multiple,
  value,
  onChange,
  invalid,
  requiredText,
  multipleHint,
}: {
  label: string;
  options: string[];
  multiple?: boolean;
  value?: number | number[];
  onChange: (v: number | number[]) => void;
  invalid?: boolean;
  requiredText: string;
  multipleHint: string;
}) {
  const id = useId();
  const selected = (i: number) => (Array.isArray(value) ? value.includes(i) : value === i);
  const toggle = (i: number) => {
    if (!multiple) return onChange(i);
    const cur = Array.isArray(value) ? value : [];
    onChange(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort());
  };
  return (
    <div data-invalid={invalid || undefined} className={cx("rounded-2xl p-3 -mx-3", invalid && "bg-blush/70")}>
      <p id={id} className="mb-2 text-[15px] font-medium text-ink">
        {label}
        {multiple && <span className="ml-2 text-xs font-normal text-muted">{multipleHint}</span>}
        {invalid && <span className="ml-2 text-xs font-normal text-rose">{requiredText}</span>}
      </p>
      <div role={multiple ? "group" : "radiogroup"} aria-labelledby={id} className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const on = selected(i);
          return (
            <button
              key={i}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => toggle(i)}
              className={cx(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition sm:text-[15px]",
                on ? "bg-brand border-transparent text-white" : "border-line bg-white text-ink hover:border-ink/25",
              )}
            >
              {on && multiple && <IconCheck width={16} height={16} />}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id?: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      className="input resize-y leading-relaxed"
      rows={rows}
      maxLength={2000}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
