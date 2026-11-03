import { adminRpc } from "@/lib/backend/server";
import type { Question, Questionnaire } from "@/lib/types";
import QuestionnaireForm from "@/components/admin/QuestionnaireForm";
import { PageHeader } from "@/components/admin/ui";

export default async function NewQuestionnaire({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const [library, source] = await Promise.all([
    adminRpc<Question[]>("admin_list_questions"),
    from ? adminRpc<Questionnaire | null>("admin_get_questionnaire", { p_id: from }).catch(() => null) : null,
  ]);
  return (
    <>
      <PageHeader
        kicker={source ? "Dupliquer" : "Nouveau"}
        title="Créer un questionnaire"
        back={{ href: "/admin", label: "Tableau de bord" }}
      />
      <QuestionnaireForm library={library} initial={source} mode={source ? "duplicate" : "create"} />
    </>
  );
}
