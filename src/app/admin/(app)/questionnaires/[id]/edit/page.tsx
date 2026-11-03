import { notFound } from "next/navigation";
import { adminRpc } from "@/lib/backend/server";
import type { Question, Questionnaire, ResponseRow } from "@/lib/types";
import QuestionnaireForm from "@/components/admin/QuestionnaireForm";
import { PageHeader } from "@/components/admin/ui";

export default async function EditQuestionnaire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [library, data] = await Promise.all([
    adminRpc<Question[]>("admin_list_questions"),
    adminRpc<{ questionnaire: Questionnaire | null; responses: ResponseRow[] }>("admin_get_results", { p_id: id }),
  ]);
  if (!data.questionnaire) notFound();
  return (
    <>
      <PageHeader
        kicker="Modifier"
        title={`${data.questionnaire.client_name} · ${data.questionnaire.project_name}`}
        back={{ href: `/admin/questionnaires/${id}`, label: "Résultats" }}
      />
      <QuestionnaireForm
        library={library}
        initial={data.questionnaire}
        mode="edit"
        hasResponses={data.responses.length > 0}
      />
    </>
  );
}
