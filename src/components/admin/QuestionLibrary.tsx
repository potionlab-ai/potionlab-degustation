"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIND_LABELS, MODULE_LABELS, MODULE_ORDER } from "@/lib/modules";
import { LANGS, type Question } from "@/lib/types";
import { archiveQuestionAction, saveQuestionAction } from "@/app/admin/actions";
import { IconEdit, IconPlus, IconTrash } from "../icons";
import { CustomQuestionEditor, emptyQuestion } from "./QuestionEditor";

export default function QuestionLibrary({ library }: { library: Question[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ q: Question; isNew: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (q: Question) => {
    setError(null);
    startTransition(async () => {
      const { id, ...rest } = q;
      const res = await saveQuestionAction(editing?.isNew ? rest : { ...rest, id });
      if (res.error) return setError(res.error);
      setEditing(null);
      router.refresh();
    });
  };
  const archive = (q: Question) => {
    if (!confirm(`Retirer « ${q.label.fr} » de la bibliothèque ?\nLes questionnaires existants ne sont pas modifiés.`)) return;
    startTransition(async () => {
      await archiveQuestionAction(q.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {MODULE_ORDER.map((m) => {
        const qs = library.filter((q) => q.module === m);
        const adding = editing?.isNew && editing.q.module === m;
        return (
          <section key={m} className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold">{MODULE_LABELS[m]}</h2>
                <p className="text-xs text-muted">
                  {m === "base" ? "Posées à tout le monde" : `Ajoutées automatiquement pour le type « ${MODULE_LABELS[m]} »`}
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setError(null);
                  setEditing({ q: { ...emptyQuestion(m), id: crypto.randomUUID() }, isNew: true });
                }}
              >
                <IconPlus width={18} height={18} /> Ajouter
              </button>
            </div>
            {qs.length === 0 && !adding && <p className="px-5 py-4 text-sm text-faint">Aucune question.</p>}
            <ul className="divide-y divide-line">
              {qs.map((q) =>
                editing && !editing.isNew && editing.q.id === q.id ? (
                  <li key={q.id} className="p-4">
                    <CustomQuestionEditor
                      library
                      value={editing.q}
                      onSave={save}
                      onCancel={() => setEditing(null)}
                      saving={pending}
                      error={error}
                    />
                  </li>
                ) : (
                  <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{q.label.fr}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span>{KIND_LABELS[q.kind]}</span>
                        {q.kind === "choice" && <span>· {q.options.map((o) => o.fr).join(" / ")}</span>}
                        {!q.default_on && (
                          <span className="rounded-full bg-paper px-2 py-0.5">non cochée par défaut</span>
                        )}
                        <span className="text-faint">
                          · {LANGS.filter((l) => q.label[l]).map((l) => l.toUpperCase()).join(" ")}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label={`Modifier ${q.label.fr}`}
                      onClick={() => {
                        setError(null);
                        setEditing({ q, isNew: false });
                      }}
                    >
                      <IconEdit width={18} height={18} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost hover:text-rose"
                      aria-label={`Retirer ${q.label.fr}`}
                      onClick={() => archive(q)}
                    >
                      <IconTrash width={18} height={18} />
                    </button>
                  </li>
                ),
              )}
              {adding && editing && (
                <li className="p-4">
                  <CustomQuestionEditor
                    library
                    value={editing.q}
                    onSave={save}
                    onCancel={() => setEditing(null)}
                    saving={pending}
                    error={error}
                  />
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
