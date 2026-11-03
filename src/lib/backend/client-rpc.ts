// Appels du parcours client (navigateur). En production : directement à Supabase,
// avec la clé publique (le code d'accès est vérifié dans la base).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, USE_SUPABASE, type ClientFunction } from "./config";

let sb: SupabaseClient | null = null;

export async function clientRpc<T>(fn: ClientFunction, args: Record<string, unknown>): Promise<T> {
  if (USE_SUPABASE) {
    sb ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(error.message || "network");
    return data as T;
  }
  const res = await fetch("/api/local-rpc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fn, args }),
  });
  if (!res.ok) throw new Error("network");
  return (await res.json()) as T;
}
