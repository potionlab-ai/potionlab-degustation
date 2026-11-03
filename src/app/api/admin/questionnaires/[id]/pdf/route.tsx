// Export PDF des résultats.
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { adminRpc } from "@/lib/backend/server";
import { summarize } from "@/lib/results";
import { ResultsPdf } from "@/lib/pdf/ResultsPdf";
import type { Questionnaire, ResponseRow } from "@/lib/types";

export const runtime = "nodejs";

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

  const buffer = await renderToBuffer(<ResultsPdf qn={qn} s={summarize(qn, data.responses)} />);
  const name = `PotionLab-${qn.client_name}-${qn.project_name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${name}.pdf"`,
    },
  });
}
