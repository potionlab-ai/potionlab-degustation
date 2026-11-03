// Appelée chaque jour par Vercel (voir vercel.json) pour garder la base Supabase éveillée.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, USE_SUPABASE } from "@/lib/backend/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!USE_SUPABASE) return NextResponse.json({ ok: true, mode: "local" });
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("ping");
  return NextResponse.json({ ok: !error && data === "ok" }, { status: error ? 500 : 200 });
}
