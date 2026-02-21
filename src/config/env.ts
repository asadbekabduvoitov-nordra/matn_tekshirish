import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  WEBHOOK_DOMAIN: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  GROUP_CHAT_ID: z.coerce.number().default(-1003764470027),
  PAYMENT_CHAT_ID: z.coerce.number().default(-1003787344965),

  REQUIRED_CHANNEL: z.string().default("@ANORAMAHKAMOVA1"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
