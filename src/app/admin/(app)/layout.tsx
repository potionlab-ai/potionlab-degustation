import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/backend/server";
import { USE_SUPABASE } from "@/lib/backend/config";
import { logoutAction } from "../actions";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin · PotionLab" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentAdmin();
  if (!me?.isAdmin) redirect("/admin/login");
  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="shrink-0" aria-label="Tableau de bord">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="PotionLab" className="h-7 w-auto" />
          </Link>
          <span className="hidden rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted sm:inline">
            Labo · admin
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted md:inline">{me.email}</span>
            <form action={logoutAction}>
              <button className="btn-ghost">Déconnexion</button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      {!USE_SUPABASE && (
        <div className="no-print bg-[#fff4ec] px-4 py-1.5 text-center text-xs text-[#b5521f]">
          Mode local de test : les données sont sur cet ordinateur, pas sur Supabase.
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
