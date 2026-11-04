import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/backend/server";
import { USE_SUPABASE } from "@/lib/backend/config";
import LoginForm from "./LoginForm";
import { CanIcon } from "@/components/icons";

export const metadata = { title: "Connexion · Admin PotionLab" };

export default async function LoginPage() {
  const me = await getCurrentAdmin();
  if (me?.isAdmin) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-rise">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="PotionLab" className="mx-auto mb-6 h-8 w-auto" />
        <div className="mb-[-14px] flex items-end justify-center gap-2" aria-hidden>
          {["A", "B", "C", "D"].map((l) => (
            <CanIcon key={l} letter={l} size={26} />
          ))}
        </div>
        <div className="card relative overflow-hidden p-7 pt-9">
          <div className="bg-dots absolute inset-x-0 top-0 h-3 opacity-80" aria-hidden />
          <p className="kicker kicker-bar">Espace équipe</p>
          <h1 className="display mt-4 text-3xl">Connexion</h1>
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
