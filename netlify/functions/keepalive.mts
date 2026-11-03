// Fonction planifiée Netlify : un petit appel quotidien à Supabase
// pour éviter que le projet gratuit ne soit mis en pause après 7 jours sans activité.
export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response("not configured", { status: 200 });
  const res = await fetch(`${url}/rest/v1/rpc/ping`, {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: "{}",
  });
  return new Response(res.ok ? "ok" : `error ${res.status}`, { status: res.ok ? 200 : 500 });
};

export const config = { schedule: "@daily" };
