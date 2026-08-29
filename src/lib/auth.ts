import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { hasDatabaseUrl, isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "OWNER" | "ADMIN" | "STAFF" | "DEALER" | "CUSTOMER";

export type AuthProfile = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: AppRole;
};

const demoProfiles: Record<AppRole, AuthProfile> = {
  OWNER: {
    id: "demo_owner",
    authUserId: "demo_owner_auth",
    email: "owner@example.com",
    fullName: "Demo Owner",
    role: "OWNER",
  },
  ADMIN: {
    id: "demo_admin",
    authUserId: "demo_admin_auth",
    email: "admin@example.com",
    fullName: "Demo Admin",
    role: "ADMIN",
  },
  STAFF: {
    id: "demo_staff",
    authUserId: "demo_staff_auth",
    email: "staff@example.com",
    fullName: "Demo Staff",
    role: "STAFF",
  },
  DEALER: {
    id: "demo_dealer",
    authUserId: "demo_dealer_auth",
    email: "dealer@example.com",
    fullName: "Dealer A",
    role: "DEALER",
  },
  CUSTOMER: {
    id: "demo_customer",
    authUserId: "demo_customer_auth",
    email: "customer@example.com",
    fullName: "Demo Customer",
    role: "CUSTOMER",
  },
};

export const getCurrentProfile = cache(async (): Promise<AuthProfile | null> => {
  if (isDemoMode) {
    return demoProfiles.OWNER;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user || !hasDatabaseUrl) {
    return null;
  }

  const [profile] = await getDb()
    .select({
      id: profiles.id,
      authUserId: profiles.authUserId,
      email: profiles.email,
      fullName: profiles.fullName,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  return profile ?? null;
});

export async function requireRole(allowedRoles: AppRole[]) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect("/access-denied");
  }

  return profile;
}

export function canManageCatalog(role: AppRole) {
  return role === "OWNER" || role === "ADMIN" || role === "STAFF";
}

export function canManageCommissions(role: AppRole) {
  return role === "OWNER" || role === "ADMIN";
}
