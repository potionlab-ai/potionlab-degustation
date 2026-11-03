"use client";
import { useState, useTransition } from "react";
import { deleteResponseAction, setArchivedAction } from "@/app/admin/actions";
import { IconCheck, IconCopy, IconTrash } from "../icons";

export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary min-h-10 px-4 text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {}
      }}
    >
      {done ? <IconCheck width={18} height={18} /> : <IconCopy width={18} height={18} />}
      {done ? "Copié" : label}
    </button>
  );
}

export function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn-ghost"
      disabled={pending}
      onClick={() => {
        if (!archived && !confirm("Archiver ce questionnaire ? Le code ne fonctionnera plus pour le client.")) return;
        start(() => setArchivedAction(id, !archived));
      }}
    >
      {archived ? "Réactiver" : "Archiver"}
    </button>
  );
}

export function DeleteResponseButton({ questionnaireId, responseId }: { questionnaireId: string; responseId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn-ghost hover:text-rose"
      disabled={pending}
      aria-label="Supprimer cette réponse"
      title="Supprimer cette réponse (ex. un test)"
      onClick={() => {
        if (!confirm("Supprimer définitivement cette réponse ?")) return;
        start(() => deleteResponseAction(questionnaireId, responseId));
      }}
    >
      <IconTrash width={18} height={18} />
    </button>
  );
}
