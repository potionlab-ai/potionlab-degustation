import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/backend/server";
import { USE_SUPABASE } from "@/lib/backend/config";
import LoginForm from "./LoginForm";

export const metadata = { title: "Connexion · Admin PotionLab" };

export default async function LoginPage() {
  const me = await getCurrentAdmin();
  if (me?.isAdmin) redirect("/admin");
  return (
    <main className="bg-lab-grid flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="PotionLab" className="mx-auto mb-8 h-8 w-auto" />
        <div className="card p-7">
          <p className="kicker">Espace équipe</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Connexion</h1>
          {me && !me.isAdmin && (
            <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-rose">
              Le compte {me.email} n&apos;a pas accès à l&apos;espace admin.
            </p>
          )}
          <LoginForm />
          {!USE_SUPABASE && (
            <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-xs leading-relaxed text-muted">
              Mode local (sans Supabase) : admin@potionlab.local / potionlab
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
