"use server";

import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { canBootstrapOwner } from "@/features/auth/bootstrap";
import { hasDatabaseUrl, isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

const bootstrapOwnerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const passwordUpdateSchema = z
  .object({
    password: z.string().min(10).max(128),
    confirmPassword: z.string().min(10).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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
      .select({ role: profiles.role, active: profiles.active })
      .from(profiles)
      .where(eq(profiles.authUserId, data.user.id))
      .limit(1);

    if (!profile || !profile.active) {
      await supabase.auth.signOut();
      redirect("/login?error=inactive-account");
    }

    if (profile.role === "DEALER") redirect("/dealer");
    if (profile.role === "CUSTOMER") redirect("/account");
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

export async function requestPasswordReset(formData: FormData) {
  const parsed = passwordResetRequestSchema.parse({
    email: formData.get("email"),
  });
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/forgot-password?error=missing-supabase");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
    redirectTo: absoluteUrl("/auth/callback?next=/reset-password"),
  });

  if (error) {
    redirect("/forgot-password?error=request-failed");
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const parsed = passwordUpdateSchema.parse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/reset-password?error=missing-supabase");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=expired-link");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.password });

  if (error) {
    redirect("/reset-password?error=update-failed");
  }

  await supabase.auth.signOut();
  redirect("/login?password=updated");
}
