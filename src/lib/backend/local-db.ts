import "server-only";
// Base PostgreSQL locale, utilisée UNIQUEMENT en développement (sans Supabase).
// Reproduit le comportement de Supabase : rôle anon/authenticated + "jeton" de connexion.
import { Pool } from "pg";

const globalForPg = globalThis as unknown as { __plPool?: Pool };

function pool(): Pool {
  globalForPg.__plPool ??= new Pool({
    connectionString: process.env.LOCAL_DATABASE_URL || "postgres://postgres@localhost:54329/potionlab",
    max: 5,
  });
  return globalForPg.__plPool;
}

export async function localRpc<T>(
  role: "anon" | "authenticated",
  claims: Record<string, unknown>,
  headers: Record<string, string>,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!/^[a-z_]+$/.test(fn)) throw new Error("invalid function");
  const names = Object.keys(args);
  for (const n of names) if (!/^p(_[a-z]+)?$/.test(n)) throw new Error("invalid argument");
  const values = names.map((n) => {
    const v = args[n];
    return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
  });
  const params = names.map((n, i) => `${n} => $${i + 1}`).join(", ");
  const sql = `select public.${fn}(${params}) as r`;
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role === "anon" ? "anon" : "authenticated"}`);
    await client.query(
      "select set_config('request.jwt.claims', $1, true), set_config('request.headers', $2, true)",
      [JSON.stringify(claims), JSON.stringify(headers)],
    );
    const { rows } = await client.query(sql, values);
    await client.query("commit");
    return rows[0]?.r as T;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
