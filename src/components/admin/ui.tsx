import Link from "next/link";
import type { QuestionnaireStatus } from "@/lib/types";

export const STATUS_LABELS: Record<QuestionnaireStatus, string> = {
  sent: "Envoyé",
  started: "Commencé",
  done: "Terminé",
};

export function StatusBadge({ status, archived }: { status: QuestionnaireStatus; archived?: boolean }) {
  if (archived)
    return <span className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-muted">Archivé</span>;
  const styles: Record<QuestionnaireStatus, string> = {
    sent: "bg-paper text-muted border-line",
    started: "bg-[#fff4ec] text-[#b5521f] border-[#f6d5bf]",
    done: "bg-[#eaf6f0] text-[#1f7a58] border-[#cbe9db]",
  };
  const dot: Record<QuestionnaireStatus, string> = {
    sent: "bg-faint",
    started: "bg-coral",
    done: "bg-[#2f9e78]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
  back,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm text-muted hover:text-ink">
            ← {back.label}
          </Link>
        )}
        {kicker && <p className="kicker kicker-bar">{kicker}</p>}
        <h1 className="display mt-4 text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function formatDate(d: string | null | undefined, withTime = false) {
  if (!d) return "–";
  return new Date(d).toLocaleString("fr-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Brussels",
  });
}
