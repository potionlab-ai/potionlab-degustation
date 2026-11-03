import Link from "next/link";
import { notFound } from "next/navigation";
import { adminRpc } from "@/lib/backend/server";
import { formatCode } from "@/lib/code";
import { beverageLabel } from "@/lib/modules";
import { fmtNum, respondentName, summarize, type CanSummary } from "@/lib/results";
import { loc, type Questionnaire, type QuestionnaireStatus, type ResponseRow } from "@/lib/types";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { JarBar, JarLegend, MeterBar } from "@/components/admin/charts";
import { ArchiveButton, CopyButton, DeleteResponseButton } from "@/components/admin/actions-client";
import { CanIcon, IconDownload, IconEdit, IconExternal } from "@/components/icons";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const data = await adminRpc<{ questionnaire: Questionnaire | null; responses: ResponseRow[] }>("admin_get_results", {
    p_id: id,
  });
  const qn = data.questionnaire;
  if (!qn) notFound();
  const s = summarize(qn, data.responses);
  const status: QuestionnaireStatus = s.nSubmitted > 0 ? "done" : data.responses.length > 0 ? "started" : "sent";

  return (
    <>
      <PageHeader
        kicker={`${qn.client_name} · ${beverageLabel(qn.beverage_type)}`}
        title={qn.project_name}
        back={{ href: "/admin", label: "Tableau de bord" }}
      >
        <Link href={`/admin/questionnaires/${id}/edit`} className="btn-secondary min-h-10 px-4 text-sm">
          <IconEdit width={18} height={18} /> Modifier
        </Link>
        <Link href={`/admin/questionnaires/new?from=${id}`} className="btn-secondary min-h-10 px-4 text-sm">
          Dupliquer
        </Link>
        <a href={`/api/admin/questionnaires/${id}/pdf`} className="btn-primary min-h-10 px-4 text-sm">
          <IconDownload width={18} height={18} /> PDF
        </a>
        <a href={`/api/admin/questionnaires/${id}/csv`} className="btn-secondary min-h-10 px-4 text-sm">
          <IconDownload width={18} height={18} /> CSV
        </a>
      </PageHeader>

      {/* Code d'accès ------------------------------------------------------ */}
      <section className={`card mb-6 p-5 sm:p-7 ${nouveau ? "border-rose/40 ring-4 ring-rose/10" : ""}`}>
        {nouveau && (
          <p className="mb-4 rounded-2xl bg-blush px-4 py-2.5 text-sm font-medium text-rose">
            Questionnaire créé. Recopiez ce code au stylo sur la carte de la boîte.
          </p>
        )}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Code d&apos;accès client</p>
            <p className="text-brand mt-1 font-mono text-5xl font-bold tracking-[0.12em] sm:text-6xl">
              {formatCode(qn.access_code)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Sans 0/O ni 1/I/L · le client peut le taper en minuscules, avec ou sans tiret.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StatusBadge status={status} archived={qn.archived} />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={formatCode(qn.access_code)} label="Copier le code" />
              <a
                href={`/?code=${qn.access_code}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary min-h-10 px-4 text-sm"
              >
                <IconExternal width={18} height={18} /> Voir comme le client
              </a>
            </div>
            <p className="text-xs text-faint">
              Créé le {formatDate(qn.created_at)}
              {qn.created_by && qn.created_by !== "demo" ? ` par ${qn.created_by}` : ""} ·{" "}
              <ArchiveButton id={qn.id} archived={qn.archived} />
            </p>
          </div>
        </div>
      </section>

      {s.nSubmitted === 0 ? (
        <section className="card px-6 py-14 text-center">
          <div className="mx-auto flex w-fit gap-2" aria-hidden>
            {qn.iterations.map((it) => (
              <CanIcon key={it.letter} letter={it.letter} size={26} filled={false} />
            ))}
          </div>
          <h2 className="mt-5 text-xl font-semibold">Pas encore de réponse envoyée</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {s.nInProgress > 0
              ? `${s.nInProgress} dégustateur(s) ont commencé le questionnaire. Les résultats s'afficheront dès le premier envoi.`
              : "Dès que le client aura envoyé ses réponses, vous verrez ici les graphiques et la synthèse."}
          </p>
        </section>
      ) : (
        <>
          {/* Synthèse --------------------------------------------------------- */}
          <section className="card mb-6 overflow-hidden">
            <div className="bg-lab-grid border-b border-line px-5 py-5 sm:px-7">
              <p className="kicker">Synthèse automatique · {s.nSubmitted} réponse(s)</p>
              {s.headline && <h2 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">{s.headline}</h2>}
              {s.recipe.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Piste pour la prochaine itération :</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink/85">
                    {s.recipe.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0">
              {s.cans.map((c, i) => (
                <li
                  key={c.letter}
                  className={`flex gap-3 px-5 py-4 sm:px-7 ${i >= 2 ? "md:border-t md:border-line" : ""} ${i % 2 === 1 ? "md:border-l md:border-line" : ""}`}
                >
                  <CanIcon letter={c.letter} size={26} filled={c.letter === s.best} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {c.keep.map((k) => (
                        <span key={k} className="rounded-full bg-[#eaf6f0] px-2 py-0.5 text-xs font-medium text-[#1f7a58]">
                          ✓ {k}
                        </span>
                      ))}
                      {c.fix.map((f) => (
                        <span
                          key={f.label}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            f.action === "increase"
                              ? "bg-[#e9effb] text-[#2f57ad]"
                              : f.action === "mixed"
                                ? "bg-paper text-muted"
                                : "bg-[#fdece6] text-[#b23f1c]"
                          }`}
                        >
                          {f.action === "increase" ? "↑" : f.action === "mixed" ? "≈" : f.action === "reduce" ? "↓" : "!"} {f.label}{" "}
                          {f.pct} %
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm leading-snug text-muted">{c.sentence}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Vue d'ensemble -------------------------------------------------- */}
          <section className="card mb-6 p-5 sm:p-7">
            <h2 className="mb-4 font-semibold">Appréciation et classement</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2 font-medium">Canette</th>
                    <th className="pb-2 font-medium">Note moyenne /9</th>
                    <th className="pb-2 text-center font-medium">Classée 1re</th>
                    <th className="pb-2 text-center font-medium">Rang moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.cans.map((c) => (
                    <tr key={c.letter}>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <CanIcon letter={c.letter} size={20} filled={c.letter === s.best} /> {c.letter}
                        </span>
                      </td>
                      <td className="w-1/2 py-3 pr-6">
                        <div className="flex items-center gap-3">
                          <MeterBar
                            value={c.overallMean}
                            max={9}
                            highlight={c.letter === s.best}
                            label={`Note moyenne ${fmtNum(c.overallMean)} sur 9`}
                          />
                          <span className="w-8 text-right font-semibold tabular-nums">{fmtNum(c.overallMean)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center tabular-nums">
                        {c.rankCounts[0]} / {s.nSubmitted}
                      </td>
                      <td className="py-3 text-center tabular-nums">{fmtNum(c.meanRank)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {s.bestByCriterion.length > 0 && (
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-ink">Le plus « juste » par critère : </span>
                {s.bestByCriterion.map((b) => `${b.label} → ${b.letter} (${b.ok} %)`).join(" · ")}
              </p>
            )}
          </section>

          {/* Détail par canette --------------------------------------------- */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Détail par canette</h2>
            <JarLegend />
          </div>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {s.cans.map((c) => (
              <CanCard key={c.letter} c={c} best={c.letter === s.best} />
            ))}
          </div>

          {s.generalComments.length > 0 && (
            <section className="card mb-6 p-5 sm:p-7">
              <h2 className="mb-4 font-semibold">Commentaires généraux</h2>
              <ul className="space-y-3">
                {s.generalComments.map((g, i) => (
                  <li key={i} className="rounded-2xl bg-paper px-4 py-3">
                    <p className="leading-relaxed">« {g.text} »</p>
                    <p className="mt-1 text-xs text-muted">
                      {g.who} · {formatDate(g.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Dégustateurs -------------------------------------------------------- */}
      {data.responses.length > 0 && (
        <section className="card p-5 sm:p-7">
          <h2 className="mb-3 font-semibold">Dégustateurs</h2>
          <ul className="divide-y divide-line">
            {data.responses.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{respondentName(r, i)}</span>
                  {r.respondent_email && <span className="text-muted"> · {r.respondent_email}</span>}
                  {r.lang && <span className="ml-2 text-xs uppercase text-faint">{r.lang}</span>}
                </span>
                <span className="hidden text-muted sm:inline">
                  {r.submitted_at ? `Envoyé le ${formatDate(r.submitted_at, true)}` : `En cours · ${formatDate(r.updated_at, true)}`}
                </span>
                <StatusBadge status={r.submitted_at ? "done" : "started"} />
                <DeleteResponseButton questionnaireId={qn.id} responseId={r.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function CanCard({ c, best }: { c: CanSummary; best: boolean }) {
  return (
    <section className={`card p-5 sm:p-6 ${best ? "border-rose/40" : ""}`}>
      <div className="mb-4 flex items-start gap-3">
        <CanIcon letter={c.letter} size={34} filled={best} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">
              Canette {c.letter}
              {best && <span className="ml-2 align-middle text-xs font-semibold text-rose">PRÉFÉRÉE</span>}
            </h3>
            <p className="shrink-0 text-sm text-muted">
              <span className="text-xl font-semibold tabular-nums text-ink">{fmtNum(c.overallMean)}</span>/9
            </p>
          </div>
          {c.change && <p className="text-sm leading-snug text-muted">{c.change}</p>}
        </div>
      </div>
      <div className="space-y-4">
        {c.stats.map((st) => {
          const label = loc(st.question.label, "fr");
          if (st.kind === "jar") return <JarBar key={st.question.id} stat={st} label={label} />;
          if (st.kind === "choice")
            return (
              <div key={st.question.id}>
                <p className="mb-1.5 text-sm font-medium">{label}</p>
                <ul className="space-y-1">
                  {st.question.options.map((o, i) => (
                    <li key={i} className="grid grid-cols-[110px_1fr_42px] items-center gap-2 text-xs">
                      <span className="truncate text-muted">{loc(o, "fr")}</span>
                      <MeterBar value={st.pct[i]} max={100} label={`${loc(o, "fr")} ${st.pct[i]} %`} />
                      <span className="text-right font-semibold tabular-nums">{st.pct[i]} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          if (st.kind === "scale9")
            return (
              <div key={st.question.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="font-semibold tabular-nums">{fmtNum(st.mean)}/9</span>
                </div>
                <MeterBar value={st.mean} max={9} label={`${label} ${fmtNum(st.mean)} sur 9`} />
              </div>
            );
          return (
            <div key={st.question.id}>
              <p className="mb-1 text-sm font-medium">{label}</p>
              {st.texts.length === 0 ? (
                <p className="text-xs text-faint">Pas de réponse.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {st.texts.map((t, i) => (
                    <li key={i}>
                      « {t.text} » <span className="text-xs text-faint">— {t.who}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {(c.comments.length > 0 || c.keeps.length > 0) && (
        <div className="mt-5 space-y-2 border-t border-line pt-4">
          {c.keeps.map((k, i) => (
            <p key={`k${i}`} className="text-sm">
              <span className="font-medium text-[#1f7a58]">À garder : </span>
              {k.text} <span className="text-xs text-faint">— {k.who}</span>
            </p>
          ))}
          {c.comments.map((k, i) => (
            <p key={`c${i}`} className="text-sm leading-relaxed">
              « {k.text} » <span className="text-xs text-faint">— {k.who}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
