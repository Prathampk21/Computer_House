import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabaseBrowserConfig, requireEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!hasSupabaseBrowserConfig) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies. Actions and
            // Route Handlers use the same helper and can update them.
          }
        },
      },
    },
  );
}
