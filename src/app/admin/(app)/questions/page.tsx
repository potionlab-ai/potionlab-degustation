import { adminRpc } from "@/lib/backend/server";
import type { Question } from "@/lib/types";
import { PageHeader } from "@/components/admin/ui";
import QuestionLibrary from "@/components/admin/QuestionLibrary";

export default async function QuestionsPage() {
  const library = await adminRpc<Question[]>("admin_list_questions");
  return (
    <>
      <PageHeader kicker="Réglages" title="Bibliothèque de questions" />
      <p className="-mt-3 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        Les questions proposées à la création d&apos;un questionnaire. Les modifier ici ne change pas les
        questionnaires déjà envoyés (ils gardent leur version).
      </p>
      <QuestionLibrary library={library} />
    </>
  );
}
