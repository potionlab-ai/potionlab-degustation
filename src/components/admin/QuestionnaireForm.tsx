"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BEVERAGE_TYPES, KIND_LABELS, MODULE_LABELS, MODULE_ORDER } from "@/lib/modules";
import { LETTERS, type Localized, type Question, type QuestionKind, type Questionnaire } from "@/lib/types";
import { saveQuestionnaireAction } from "@/app/admin/actions";
import { CanIcon, IconPlus, IconTrash } from "../icons";
import { CustomQuestionEditor, emptyQuestion } from "./QuestionEditor";

type Props = {
  library: Question[];
  initial?: Questionnaire | null;
  mode: "create" | "edit" | "duplicate";
  hasResponses?: boolean;
};

const snapshot = (q: Question): Question => ({
  id: q.id,
  module: q.module,
  kind: q.kind,
  key: q.key ?? null,
  label: q.label,
  short: q.short ?? {},
  options: q.options ?? [],
  multiple: !!q.multiple,
  ...(q.custom ? { custom: true } : {}),
});

export default function QuestionnaireForm({ library, initial, mode, hasResponses }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const libIds = useMemo(() => new Set(library.map((q) => q.id)), [library]);
  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [projectName, setProjectName] = useState(initial?.project_name ?? "");
  const [beverage, setBeverage] = useState(initial?.beverage_type ?? "");
  const [changes, setChanges] = useState<Record<string, string>>(
    Object.fromEntries(LETTERS.map((l) => [l, initial?.iterations?.find((i) => i.letter === l)?.change ?? ""])),
  );
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (initial) return new Set(initial.questions.filter((q) => libIds.has(q.id)).map((q) => q.id));
    return new Set(library.filter((q) => q.module === "base" && q.default_on).map((q) => q.id));
  });
  const [customs, setCustoms] = useState<Question[]>(
    () => initial?.questions.filter((q) => !libIds.has(q.id)).map((q) => ({ ...q, custom: true })) ?? [],
  );
  const [draft, setDraft] = useState<Question | null>(null);
  const [showOtherModules, setShowOtherModules] = useState(false);

  const byModule = useMemo(() => {
    const m: Record<string, Question[]> = {};
    for (const q of library) (m[q.module] ??= []).push(q);
    return m;
  }, [library]);

  // Choix du type de boisson : ajoute automatiquement les questions du module
  const pickBeverage = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const q of byModule[beverage] ?? []) next.delete(q.id);
      for (const q of byModule[id] ?? []) if (q.default_on) next.add(q.id);
      return next;
    });
    setBeverage(id);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const finalQuestions = (): Question[] => {
    const ordered = [...library]
      .filter((q) => selected.has(q.id))
      .sort(
        (a, b) =>
          MODULE_ORDER.indexOf(a.module) - MODULE_ORDER.indexOf(b.module) || (a.position ?? 0) - (b.position ?? 0),
      );
    return [...ordered, ...customs].map(snapshot);
  };

  const save = () => {
    setError(null);
    if (!clientName.trim() || !projectName.trim()) {
      setError("Indiquez le nom du client et le nom du projet.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!beverage) {
      setError("Choisissez le type de boisson.");
      return;
    }
    startTransition(async () => {
      const res = await saveQuestionnaireAction({
        id: mode === "edit" ? initial?.id : undefined,
        client_name: clientName,
        project_name: projectName,
        beverage_type: beverage,
        iterations: LETTERS.map((l) => ({ letter: l, change: changes[l]?.trim() ?? "" })),
        questions: finalQuestions(),
      });
      if (res.error || !res.id) {
        setError(res.error ?? "Erreur inconnue.");
        return;
      }
      router.push(`/admin/questionnaires/${res.id}${mode === "edit" ? "" : "?nouveau=1"}`);
      router.refresh();
    });
  };

  const otherModules = MODULE_ORDER.filter((m) => m !== "base" && m !== beverage && byModule[m]?.length);
  const count = selected.size + customs.length;

  return (
    <div className="space-y-6 pb-28">
      {mode === "duplicate" && initial && (
        <p className="rounded-2xl border border-coral/30 bg-[#fff4ec] px-4 py-3 text-sm text-[#9a4518]">
          Copie de « {initial.project_name} » ({initial.client_name}). Adaptez le client et les versions : un
          nouveau code sera créé.
        </p>
      )}
      {mode === "edit" && hasResponses && (
        <p className="rounded-2xl border border-coral/30 bg-[#fff4ec] px-4 py-3 text-sm text-[#9a4518]">
          Ce questionnaire a déjà des réponses. Retirer une question masquera ses résultats ; en ajouter une ne
          concernera que les prochaines réponses.
        </p>
      )}

      {/* 1. Client ---------------------------------------------------------- */}
      <Block n={1} title="Le client et le projet">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="client" className="label">
              Nom du client
            </label>
            <input
              id="client"
              className="input"
              placeholder="Ex. : Brasserie du Val"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="project" className="label">
              Nom du projet
            </label>
            <input
              id="project"
              className="input"
              placeholder="Ex. : IPA agrumes"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
        </div>
        <p className="label mt-5">Type de boisson</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de boisson">
          {BEVERAGE_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={beverage === b.id}
              onClick={() => pickBeverage(b.id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${
                beverage === b.id ? "bg-brand border-transparent text-white" : "border-line bg-white hover:border-ink/25"
              }`}
            >
              {b.label.fr}
            </button>
          ))}
        </div>
        {beverage && (byModule[beverage]?.length ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted">
            Les questions « {MODULE_LABELS[beverage]} » ont été ajoutées automatiquement (étape 3).
          </p>
        )}
      </Block>

      {/* 2. Versions -------------------------------------------------------- */}
      <Block n={2} title="Ce qui change dans chaque canette" hint="Le client le lit avant de goûter. Phrases courtes.">
        <div className="space-y-3">
          {LETTERS.map((l) => (
            <div key={l} className="flex items-start gap-3">
              <CanIcon letter={l} size={30} className="mt-1" />
              <textarea
                aria-label={`Ce qui change pour ${l}`}
                className="input min-h-[52px] resize-y py-3"
                rows={1}
                placeholder={l === "A" ? "Ex. : recette de référence" : "Ex. : sucre réduit de 10 %"}
                value={changes[l]}
                onChange={(e) => setChanges((c) => ({ ...c, [l]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </Block>

      {/* 3. Questions ------------------------------------------------------- */}
      <Block
        n={3}
        title="Les questions"
        hint="Posées pour chaque canette, en plus de l'appréciation globale (1 à 9) et du commentaire libre, toujours présents."
      >
        <ModuleList title="Base commune" questions={byModule.base ?? []} selected={selected} toggle={toggle} />
        {beverage && byModule[beverage] && (
          <ModuleList
            title={`Module ${MODULE_LABELS[beverage]}`}
            questions={byModule[beverage]}
            selected={selected}
            toggle={toggle}
          />
        )}
        {otherModules.length > 0 && (
          <div className="mt-5">
            <button type="button" className="btn-ghost -ml-3" onClick={() => setShowOtherModules((v) => !v)}>
              {showOtherModules ? "Masquer" : "Piocher dans"} les autres modules ({otherModules.length})
            </button>
            {showOtherModules &&
              otherModules.map((m) => (
                <ModuleList key={m} title={MODULE_LABELS[m]} questions={byModule[m]} selected={selected} toggle={toggle} />
              ))}
          </div>
        )}
      </Block>

      {/* 4. Sur mesure ------------------------------------------------------ */}
      <Block n={4} title="Questions sur mesure" hint="Uniquement pour ce client. Facultatif.">
        {customs.length > 0 && (
          <ul className="mb-4 divide-y divide-line rounded-2xl border border-line">
            {customs.map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{q.label.fr}</p>
                  <p className="text-xs text-muted">
                    {KIND_LABELS[q.kind]}
                    {q.kind === "choice" && ` : ${q.options.map((o) => o.fr).join(" / ")}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDraft(q)}
                  aria-label={`Modifier ${q.label.fr}`}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="btn-ghost hover:text-rose"
                  aria-label={`Supprimer ${q.label.fr}`}
                  onClick={() => setCustoms((c) => c.filter((x) => x.id !== q.id))}
                >
                  <IconTrash width={18} height={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {draft ? (
          <CustomQuestionEditor
            value={draft}
            onCancel={() => setDraft(null)}
            onSave={(q) => {
              setCustoms((c) => (c.some((x) => x.id === q.id) ? c.map((x) => (x.id === q.id ? q : x)) : [...c, q]));
              setDraft(null);
            }}
          />
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDraft({ ...emptyQuestion("custom"), id: crypto.randomUUID(), custom: true })}
          >
            <IconPlus /> Ajouter une question sur mesure
          </button>
        )}
      </Block>

      {/* Barre d'enregistrement ------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{count}</span> question{count > 1 ? "s" : ""} par canette
            <span className="hidden sm:inline"> + appréciation globale + commentaire</span>
          </p>
          {error && (
            <p role="alert" className="text-sm font-medium text-rose">
              {error}
            </p>
          )}
          <button type="button" className="btn-primary ml-auto" onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : mode === "edit" ? "Enregistrer les modifications" : "Créer et générer le code"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="bg-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
          {n}
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-7">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ModuleList({
  title,
  questions,
  selected,
  toggle,
}: {
  title: string;
  questions: Question[];
  selected: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <fieldset className="mt-4 first:mt-0">
      <legend className="kicker mb-2">{title}</legend>
      <div className="divide-y divide-line rounded-2xl border border-line">
        {questions.map((q) => (
          <label key={q.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-paper/60">
            <input
              type="checkbox"
              checked={selected.has(q.id)}
              onChange={() => toggle(q.id)}
              className="h-5 w-5 shrink-0 accent-[#E8457A]"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium leading-snug">{(q.label as Localized).fr}</span>
              <span className="text-xs text-muted">
                {KIND_LABELS[q.kind as QuestionKind]}
                {q.kind === "choice" && ` : ${q.options.map((o) => o.fr).join(" / ")}`}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
