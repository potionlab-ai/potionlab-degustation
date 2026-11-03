// Export CSV : une ligne par dégustateur et par canette. Séparateur « ; » (Excel belge/français).
import { NextResponse } from "next/server";
import { adminRpc } from "@/lib/backend/server";
import { readableAnswer, respondentName } from "@/lib/results";
import { LETTERS, loc, type Answers, type Questionnaire, type ResponseRow } from "@/lib/types";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: { questionnaire: Questionnaire | null; responses: ResponseRow[] };
  try {
    data = await adminRpc("admin_get_results", { p_id: id });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const qn = data.questionnaire;
  if (!qn) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const header = [
    "Client",
    "Projet",
    "Code",
    "Dégustateur",
    "Email",
    "Statut",
    "Date",
    "Langue",
    "Canette",
    "Ce qui change",
    "Appréciation globale (1-9)",
    ...qn.questions.map((q) => loc(q.label, "fr")),
    "Commentaire canette",
    "Rang (1 = préférée)",
    "À garder",
    "Commentaire général",
  ];
  const rows: unknown[][] = [];
  data.responses.forEach((r, i) => {
    const a = (r.answers ?? {}) as Answers;
    for (const l of LETTERS) {
      const c = a.cans?.[l];
      const rank = a.ranking ? a.ranking.indexOf(l) + 1 : "";
      rows.push([
        qn.client_name,
        qn.project_name,
        qn.access_code,
        respondentName(r, i),
        r.respondent_email ?? "",
        r.submitted_at ? "Envoyé" : "En cours",
        (r.submitted_at ?? r.updated_at)?.slice(0, 16).replace("T", " "),
        r.lang ?? "",
        l,
        qn.iterations.find((x) => x.letter === l)?.change ?? "",
        c?.overall ?? "",
        ...qn.questions.map((q) => readableAnswer(q, c?.q?.[q.id])),
        c?.comment ?? "",
        rank || "",
        a.keep?.[l] ?? "",
        l === "A" ? (a.general_comment ?? "") : "",
      ]);
    }
  });
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const name = `potionlab-${qn.client_name}-${qn.project_name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
