import "server-only";

import { createClient } from "@supabase/supabase-js";

import { hasSupabaseAdminConfig, requireEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig) {
    throw new Error(
      "Supabase admin credentials are required for account management.",
    );
  }

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function createSupabaseProvisioningClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    hasSupabaseAdminConfig
      ? requireEnv("SUPABASE_SERVICE_ROLE_KEY")
      : requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
