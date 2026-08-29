import "server-only";

import { count, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { hasDatabaseUrl, hasSupabaseBrowserConfig } from "@/lib/env";

export function canBootstrapOwner() {
  return hasDatabaseUrl && hasSupabaseBrowserConfig;
}

export async function hasOwnerProfile() {
  if (!canBootstrapOwner()) {
    return false;
  }

  const [owner] = await getDb()
    .select({ total: count(profiles.id) })
    .from(profiles)
    .where(eq(profiles.role, "OWNER"));

  return Number(owner?.total ?? 0) > 0;
}
