"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminRpc, signIn, signOut } from "@/lib/backend/server";
import type { Question, Questionnaire } from "@/lib/types";

export async function loginAction(_prev: { error?: string } | null, form: FormData) {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Indiquez votre email et votre mot de passe." };
  const res = await signIn(email, password);
  if (res.error) return { error: "Email ou mot de passe incorrect." };
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}

// --- Questionnaires --------------------------------------------------------
export type QuestionnaireInput = {
  id?: string;
  client_name: string;
  project_name: string;
  beverage_type: string;
  iterations: { letter: string; change: string }[];
  questions: Question[];
};

export async function saveQuestionnaireAction(input: QuestionnaireInput): Promise<{ id?: string; error?: string }> {
  if (!input.client_name.trim() || !input.project_name.trim()) {
    return { error: "Le nom du client et le nom du projet sont obligatoires." };
  }
  try {
    const saved = await adminRpc<Questionnaire>("admin_save_questionnaire", { p: input });
    revalidatePath("/admin");
    return { id: saved.id };
  } catch (e) {
    return { error: `Enregistrement impossible (${(e as Error).message}).` };
  }
}

export async function setArchivedAction(id: string, archived: boolean) {
  await adminRpc("admin_set_questionnaire_archived", { p_id: id, p_archived: archived });
  revalidatePath("/admin");
  revalidatePath(`/admin/questionnaires/${id}`);
}

export async function deleteResponseAction(questionnaireId: string, responseId: string) {
  await adminRpc("admin_delete_response", { p_id: responseId });
  revalidatePath(`/admin/questionnaires/${questionnaireId}`);
}

// --- Bibliothèque de questions ----------------------------------------------
export async function saveQuestionAction(q: Partial<Question>): Promise<{ question?: Question; error?: string }> {
  if (!q.label?.fr?.trim()) return { error: "Le libellé en français est obligatoire." };
  if (q.kind === "choice" && (!q.options || q.options.filter((o) => o.fr?.trim()).length < 2)) {
    return { error: "Un choix multiple a besoin d'au moins 2 options." };
  }
  try {
    const question = await adminRpc<Question>("admin_save_question", { p: q });
    revalidatePath("/admin/questions");
    return { question };
  } catch (e) {
    return { error: `Enregistrement impossible (${(e as Error).message}).` };
  }
}

export async function archiveQuestionAction(id: string) {
  await adminRpc("admin_archive_question", { p_id: id });
  revalidatePath("/admin/questions");
}
