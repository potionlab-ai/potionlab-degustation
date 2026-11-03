// Développement local uniquement : relaie les appels du parcours client vers la base locale.
// En production (Supabase configuré), cette route est désactivée.
import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_FUNCTIONS, USE_SUPABASE, type ClientFunction } from "@/lib/backend/config";
import { localRpc } from "@/lib/backend/local-db";

export async function POST(req: NextRequest) {
  if (USE_SUPABASE || process.env.VERCEL || process.env.NETLIFY) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const { fn, args } = (await req.json()) as { fn: ClientFunction; args: Record<string, unknown> };
  if (!CLIENT_FUNCTIONS.includes(fn)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  try {
    const data = await localRpc("anon", {}, { "x-forwarded-for": ip }, fn, args);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
