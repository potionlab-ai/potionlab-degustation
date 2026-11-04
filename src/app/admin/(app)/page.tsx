import Link from "next/link";
import { adminRpc, getCurrentAdmin } from "@/lib/backend/server";
import { formatCode } from "@/lib/code";
import { beverageLabel } from "@/lib/modules";
import type { Letter, QuestionnaireListItem } from "@/lib/types";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { IconPlus } from "@/components/icons";

type Feedback = {
  id: string;
  submitted_at: string;
  respondent_name: string | null;
  general_comment: string | null;
  ranking: Letter[] | null;
  questionnaire_id: string;
  client_name: string;
  project_name: string;
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const showArchived = vue === "archives";
  const [all, feedback, me] = await Promise.all([
    adminRpc<QuestionnaireListItem[]>("admin_list_questionnaires"),
    adminRpc<Feedback[]>("admin_recent_feedback", { p_limit: 6 }),
    getCurrentAdmin(),
  ]);
  const local = (me?.email ?? "").split("@")[0].split(/[._-]/)[0];
  const firstName = local && !["admin", "production", "info", "hello"].includes(local)
    ? local.charAt(0).toUpperCase() + local.slice(1)
    : "";
  const active = all.filter((q) => !q.archived);
  const list = showArchived ? all.filter((q) => q.archived) : active;
  const done = active.filter((q) => q.status === "done").length;
  const started = active.filter((q) => q.status === "started").length;
  const rate = active.length ? Math.round((done / active.length) * 100) : 0;
  const totalResponses = active.reduce((s, q) => s + q.submitted, 0);

  return (
    <>
      <PageHeader
        kicker="Tableau de bord"
        title={firstName ? `Bonjour ${firstName}` : "Bonjour"}
        subtitle="Voici où en sont vos boîtes test et les derniers retours de vos clients."
      >
        <Link href="/admin/questionnaires/new" className="btn-primary">
          <IconPlus /> Nouveau questionnaire
        </Link>
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Taux de réponse" value={`${rate} %`} hint={`${done} terminé(s) sur ${active.length}`} ring={rate} />
        <Stat label="Questionnaires actifs" value={active.length} hint="boîtes envoyées" />
        <Stat label="En cours" value={started} hint="commencés, pas encore envoyés" />
        <Stat label="Réponses reçues" value={totalResponses} hint="dégustateurs au total" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="font-semibold">Questionnaires</h2>
            <div className="flex rounded-full border border-line bg-paper p-0.5 text-sm">
              <Link
                href="/admin"
                className={`rounded-full px-3 py-1 ${!showArchived ? "bg-white font-medium shadow-sm" : "text-muted"}`}
              >
                Actifs
              </Link>
              <Link
                href="/admin?vue=archives"
                className={`rounded-full px-3 py-1 ${showArchived ? "bg-white font-medium shadow-sm" : "text-muted"}`}
              >
                Archivés
              </Link>
            </div>
          </div>
          {list.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-muted">
                {showArchived ? "Aucun questionnaire archivé." : "Aucun questionnaire pour l'instant."}
              </p>
              {!showArchived && (
                <Link href="/admin/questionnaires/new" className="btn-secondary mt-4">
                  Créer le premier
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/admin/questionnaires/${q.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-paper/70 md:grid-cols-[1fr_110px_120px_110px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{q.client_name}</p>
                      <p className="truncate text-sm text-muted">
                        {q.project_name} · {beverageLabel(q.beverage_type)}
                      </p>
                    </div>
                    <span className="hidden font-mono text-sm tracking-wider text-muted md:block">
                      {formatCode(q.access_code)}
                    </span>
                    <span className="hidden text-sm text-muted md:block">
                      {q.submitted} réponse{q.submitted > 1 ? "s" : ""}
                      {q.in_progress > 0 && <span className="text-faint"> · {q.in_progress} en cours</span>}
                    </span>
                    <span className="justify-self-end">
                      <StatusBadge status={q.status} archived={q.archived} />
                    </span>
                    <p className="col-span-2 text-xs text-faint md:hidden">
                      <span className="font-mono tracking-wider">{formatCode(q.access_code)}</span> · {q.submitted} réponse(s)
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card h-fit p-5">
          <h2 className="mb-4 font-semibold">Derniers retours</h2>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted">Les réponses envoyées par vos clients apparaîtront ici.</p>
          ) : (
            <ul className="space-y-4">
              {feedback.map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/questionnaires/${f.questionnaire_id}`} className="group block">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium group-hover:text-rose">{f.client_name}</p>
                      <span className="shrink-0 text-xs text-faint">{formatDate(f.submitted_at)}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {f.respondent_name || "Anonyme"}
                      {f.ranking?.[0] && (
                        <>
                          {" "}
                          · préférée : <span className="font-semibold text-ink">{f.ranking[0]}</span>
                        </>
                      )}
                    </p>
                    {f.general_comment && (
                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink/80">« {f.general_comment} »</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, hint, ring }: { label: string; value: string | number; hint: string; ring?: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="card flex items-center gap-4 p-4 sm:p-5">
      {ring != null && (
        <svg width="56" height="56" viewBox="0 0 56 56" className="hidden shrink-0 -rotate-90 sm:block" aria-hidden>
          <defs>
            <linearGradient id="ring-g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#E8457A" />
              <stop offset="1" stopColor="#F28C5B" />
            </linearGradient>
          </defs>
          <circle cx="28" cy="28" r={r} fill="none" stroke="#EFEAE5" strokeWidth="6" />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke="url(#ring-g)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(c * Math.min(100, Math.max(0, ring))) / 100} ${c}`}
          />
        </svg>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className={`mt-0.5 text-3xl font-semibold tabular-nums tracking-tight ${ring != null ? "text-brand" : ""}`}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-faint">{hint}</p>
      </div>
    </div>
  );
}
