export const hasSupabaseBrowserConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const isDemoMode =
  process.env.APP_DEMO_MODE === "true" ||
  (!hasSupabaseBrowserConfig && process.env.NODE_ENV !== "production");

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
