"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/questionnaires/new", label: "Nouveau questionnaire" },
  { href: "/admin/questions", label: "Bibliothèque de questions" },
  { href: "/admin/aide", label: "Mode d'emploi" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-5" aria-label="Navigation admin">
      {LINKS.map((l) => {
        const active = l.exact ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {l.label}
            {active && <span className="bg-brand absolute inset-x-3 bottom-0 h-0.5 rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
