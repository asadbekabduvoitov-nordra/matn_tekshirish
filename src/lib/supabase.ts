import { createClient } from "@supabase/supabase-js";
import { env } from "../config/index.js";
import type { Database } from "../types/database.types.js";

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export type SupabaseClient = typeof supabase;
