"use client";
import { useState } from "react";
import { KIND_LABELS, MODULE_LABELS, MODULE_ORDER } from "@/lib/modules";
import type { Lang, Localized, Question, QuestionKind } from "@/lib/types";

const OTHER_LANGS: { id: Lang; name: string }[] = [
  { id: "en", name: "Anglais" },
  { id: "nl", name: "Néerlandais" },
  { id: "es", name: "Espagnol" },
];

export function emptyQuestion(module: string): Question {
  return { id: "", module, kind: "jar", key: null, label: {}, short: {}, options: [], multiple: false, default_on: true };
}

const KIND_HELP: Record<QuestionKind, string> = {
  jar: "Le client répond Pas assez / Juste bien / Trop. Idéal pour un critère à doser.",
  scale9: "Une note de 1 à 9.",
  choice: "Le client choisit parmi vos options.",
  text: "Réponse écrite libre (facultative pour le client).",
};

/** Formulaire d'une question (sur mesure ou bibliothèque). */
export function CustomQuestionEditor({
  value,
  onSave,
  onCancel,
  library = false,
  saving = false,
  error,
}: {
  value: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
  library?: boolean;
  saving?: boolean;
  error?: string | null;
}) {
  const [q, setQ] = useState<Question>(value);
  const [showTr, setShowTr] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const optionsText = (lang: Lang) => q.options.map((o) => o[lang] ?? "").join("\n");
  const setOptions = (lang: Lang, text: string) => {
    const lines = text.split("\n");
    const n = Math.max(lines.length, q.options.length);
    const opts: Localized[] = [];
    for (let i = 0; i < n; i++) opts.push({ ...(q.options[i] ?? {}), [lang]: lines[i] ?? "" });
    setQ({ ...q, options: opts });
  };
  const setLabel = (lang: Lang, v: string) => setQ({ ...q, label: { ...q.label, [lang]: v } });
  const setShort = (lang: Lang, v: string) => setQ({ ...q, short: { ...q.short, [lang]: v } });

  const submit = () => {
    if (!q.label.fr?.trim()) return setLocalError("Écrivez la question en français.");
    const options = q.options.filter((o) => o.fr?.trim());
    if (q.kind === "choice" && options.length < 2) return setLocalError("Ajoutez au moins 2 options (une par ligne).");
    setLocalError(null);
    onSave({
      ...q,
      options: q.kind === "choice" ? options : [],
      multiple: q.kind === "choice" ? q.multiple : false,
      short: { ...q.short, fr: q.short.fr?.trim() || q.label.fr.trim().toLowerCase() },
    });
  };

  return (
    <div className="rounded-2xl border border-rose/30 bg-blush/30 p-4 sm:p-5">
      <p className="label">Type de question</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de question">
        {(Object.keys(KIND_LABELS) as QuestionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={q.kind === k}
            onClick={() => setQ({ ...q, kind: k })}
            className={`min-h-9 rounded-full border px-3 text-sm font-medium ${
              q.kind === k ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/25"
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{KIND_HELP[q.kind]}</p>

      {library && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-module" className="label">
              Module
            </label>
            <select
              id="q-module"
              className="input"
              value={q.module}
              onChange={(e) => setQ({ ...q, module: e.target.value })}
            >
              {MODULE_ORDER.map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 self-end rounded-2xl border border-line bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={q.default_on !== false}
              onChange={(e) => setQ({ ...q, default_on: e.target.checked })}
              className="h-5 w-5 accent-[#E8457A]"
            />
            <span className="text-sm">Cochée par défaut dans les nouveaux questionnaires</span>
          </label>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div>
          <label htmlFor="q-label-fr" className="label">
            Question (français)
          </label>
          <input
            id="q-label-fr"
            className="input"
            placeholder={q.kind === "jar" ? "Ex. : La note de framboise" : "Ex. : Quel moment de consommation ?"}
            value={q.label.fr ?? ""}
            onChange={(e) => setLabel("fr", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="q-short-fr" className="label">
            Nom court <span className="font-normal text-faint">(synthèse)</span>
          </label>
          <input
            id="q-short-fr"
            className="input"
            placeholder="Ex. : framboise"
            value={q.short.fr ?? ""}
            onChange={(e) => setShort("fr", e.target.value)}
          />
        </div>
      </div>

      {q.kind === "choice" && (
        <div className="mt-4">
          <label htmlFor="q-opt-fr" className="label">
            Options <span className="font-normal text-faint">(une par ligne)</span>
          </label>
          <textarea
            id="q-opt-fr"
            className="input"
            rows={4}
            placeholder={"Apéritif\nRepas\nSport"}
            value={optionsText("fr")}
            onChange={(e) => setOptions("fr", e.target.value)}
          />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!q.multiple}
              onChange={(e) => setQ({ ...q, multiple: e.target.checked })}
              className="h-4 w-4 accent-[#E8457A]"
            />
            Plusieurs réponses possibles
          </label>
        </div>
      )}

      <button type="button" className="btn-ghost -ml-3 mt-3" onClick={() => setShowTr((v) => !v)} aria-expanded={showTr}>
        {showTr ? "Masquer les traductions" : "Traductions (EN, NL, ES) — sinon le français est affiché"}
      </button>
      {showTr && (
        <div className="mt-2 space-y-4">
          {OTHER_LANGS.map((l) => (
            <div key={l.id} className="rounded-2xl border border-line bg-white p-3">
              <p className="kicker mb-2">{l.name}</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                <input
                  className="input"
                  aria-label={`Question en ${l.name.toLowerCase()}`}
                  placeholder="Question"
                  value={q.label[l.id] ?? ""}
                  onChange={(e) => setLabel(l.id, e.target.value)}
                />
                <input
                  className="input"
                  aria-label={`Nom court en ${l.name.toLowerCase()}`}
                  placeholder="Nom court"
                  value={q.short[l.id] ?? ""}
                  onChange={(e) => setShort(l.id, e.target.value)}
                />
              </div>
              {q.kind === "choice" && (
                <textarea
                  className="input mt-2"
                  rows={3}
                  aria-label={`Options en ${l.name.toLowerCase()}`}
                  placeholder="Options, une par ligne, dans le même ordre"
                  value={optionsText(l.id)}
                  onChange={(e) => setOptions(l.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {(localError || error) && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose">
          {localError || error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-primary min-h-10 px-5 text-sm" onClick={submit} disabled={saving}>
          {saving ? "Enregistrement…" : "Valider la question"}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
