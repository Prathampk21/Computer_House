"use server";

import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { canBootstrapOwner } from "@/features/auth/bootstrap";
import { hasDatabaseUrl, isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bootstrapOwnerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export async function signInWithPassword(formData: FormData) {
  if (isDemoMode) {
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=missing-supabase");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  if (data.user && hasDatabaseUrl) {
    const [profile] = await getDb()
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.authUserId, data.user.id))
      .limit(1);

    if (profile?.role === "DEALER") {
      redirect("/dealer");
    }
  }

  redirect("/admin");
}

export async function createBootstrapOwner(formData: FormData) {
  if (!canBootstrapOwner()) {
    redirect("/setup?error=missing-config");
  }

  const parsed = bootstrapOwnerSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const allowedEmail = process.env.BOOTSTRAP_OWNER_EMAIL?.toLowerCase();

  if (allowedEmail && parsed.email !== allowedEmail) {
    redirect("/setup?error=email-not-allowed");
  }

  const db = getDb();
  const [owner] = await db
    .select({ total: count(profiles.id) })
    .from(profiles)
    .where(eq(profiles.role, "OWNER"));

  if (Number(owner?.total ?? 0) > 0) {
    redirect("/login?setup=exists");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase!.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        full_name: parsed.fullName,
      },
    },
  });

  if (error || !data.user) {
    redirect("/setup?error=signup-failed");
  }

  await db
    .insert(profiles)
    .values({
      authUserId: data.user.id,
      email: parsed.email,
      fullName: parsed.fullName,
      role: "OWNER",
      active: true,
    })
    .onConflictDoNothing();

  redirect("/login?setup=created");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
