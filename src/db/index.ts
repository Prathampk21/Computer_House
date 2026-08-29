import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { hasDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!hasDatabaseUrl) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  client ??= postgres(process.env.DATABASE_URL!, {
    max: 5,
    prepare: false,
  });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
