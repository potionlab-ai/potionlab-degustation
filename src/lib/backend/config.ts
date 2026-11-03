// Mode de fonctionnement : Supabase (production) ou base locale (développement).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const CLIENT_FUNCTIONS = ["client_open", "client_save", "client_submit"] as const;
export type ClientFunction = (typeof CLIENT_FUNCTIONS)[number];
