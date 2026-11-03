import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, USE_SUPABASE } from "./config";
import { localRpc } from "./local-db";

// ---------------------------------------------------------------------------
// Supabase (production)
// ---------------------------------------------------------------------------
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le proxy se charge du rafraîchissement.
        }
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Session locale (développement uniquement)
// ---------------------------------------------------------------------------
const LOCAL_COOKIE = "pl_local_admin";
const localSecret = () => process.env.LOCAL_SESSION_SECRET || "potionlab-local-dev-secret";
const sign = (v: string) => createHmac("sha256", localSecret()).update(v).digest("hex");

async function localSessionEmail(): Promise<string | null> {
  const raw = (await cookies()).get(LOCAL_COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const email = raw.slice(0, i);
  const sig = Buffer.from(raw.slice(i + 1));
  const expected = Buffer.from(sign(email));
  return sig.length === expected.length && timingSafeEqual(sig, expected) ? email : null;
}

// ---------------------------------------------------------------------------
// API commune
// ---------------------------------------------------------------------------
export class AdminError extends Error {}

/** Appelle une fonction admin de la base, avec les droits de l'utilisateur connecté. */
export async function adminRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (USE_SUPABASE) {
    const sb = await supabaseServer();
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new AdminError(error.message);
    return data as T;
  }
  const email = await localSessionEmail();
  if (!email) throw new AdminError("not_authenticated");
  return localRpc<T>("authenticated", { email, role: "authenticated" }, {}, fn, args);
}

export type CurrentAdmin = { email: string; isAdmin: boolean };

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  try {
    if (USE_SUPABASE) {
      const sb = await supabaseServer();
      const { data } = await sb.auth.getUser();
      if (!data.user) return null;
    } else if (!(await localSessionEmail())) {
      return null;
    }
    const who = await adminRpc<{ email: string; is_admin: boolean }>("admin_whoami");
    return { email: who.email, isAdmin: who.is_admin };
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  email = email.trim().toLowerCase();
  if (USE_SUPABASE) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { error: "invalid_credentials" } : {};
  }
  const expectedEmail = (process.env.LOCAL_ADMIN_EMAIL || "admin@potionlab.local").toLowerCase();
  const expectedPassword = process.env.LOCAL_ADMIN_PASSWORD || "potionlab";
  if (email !== expectedEmail || password !== expectedPassword) return { error: "invalid_credentials" };
  (await cookies()).set(LOCAL_COOKIE, `${email}.${sign(email)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return {};
}

export async function signOut() {
  if (USE_SUPABASE) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  } else {
    (await cookies()).delete(LOCAL_COOKIE);
  }
}
