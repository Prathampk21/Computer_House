import "server-only";

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { dealers, referralClicks, visitorSessions } from "@/db/schema";
import { demoDealers } from "@/features/catalog/demo-data";
import { hasDatabaseUrl } from "@/lib/env";
import { defaultShopSettings } from "@/lib/shop-config";

export const VISITOR_COOKIE = "csw_visitor";
export const ATTRIBUTION_COOKIE = "csw_attribution";

export const referralCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/i)
  .transform((value) => value.toUpperCase());

export type ReferralAttribution = {
  dealerId: string;
  referralCode: string;
  startedAt: string;
  expiresAt: string;
  firstTouch: true;
};

export type PublicDealer = {
  id: string;
  referralCode: string;
  businessName: string;
  active: boolean;
};

export function encodeAttribution(attribution: ReferralAttribution) {
  return Buffer.from(JSON.stringify(attribution)).toString("base64url");
}

export function decodeAttribution(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as ReferralAttribution;
  } catch {
    return null;
  }
}

export function isAttributionActive(attribution: ReferralAttribution | null) {
  return Boolean(attribution && new Date(attribution.expiresAt) > new Date());
}

export async function readAttributionFromCookies() {
  const cookieStore = await cookies();
  return decodeAttribution(cookieStore.get(ATTRIBUTION_COOKIE)?.value);
}

export async function readVisitorTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(VISITOR_COOKIE)?.value ?? null;
}

export async function resolveDealerByReferralCode(
  referralCode: string,
): Promise<PublicDealer | null> {
  const parsed = referralCodeSchema.safeParse(referralCode);

  if (!parsed.success) {
    return null;
  }

  if (!hasDatabaseUrl) {
    return (
      demoDealers.find(
        (dealer) =>
          dealer.referralCode === parsed.data.toUpperCase() && dealer.active,
      ) ?? null
    );
  }

  const [dealer] = await getDb()
    .select({
      id: dealers.id,
      referralCode: dealers.referralCode,
      businessName: dealers.businessName,
      active: dealers.active,
    })
    .from(dealers)
    .where(eq(dealers.referralCode, parsed.data))
    .limit(1);

  return dealer?.active ? dealer : null;
}

export function createAttribution(
  dealer: PublicDealer,
  attributionDays = defaultShopSettings.defaultAttributionDays,
) {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setDate(startedAt.getDate() + attributionDays);

  return {
    dealerId: dealer.id,
    referralCode: dealer.referralCode,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    firstTouch: true,
  } satisfies ReferralAttribution;
}

export async function recordReferralClick(input: {
  dealer: PublicDealer | null;
  referralCode: string;
  landingPath: string;
  visitorSessionId?: string | null;
}) {
  if (!hasDatabaseUrl) {
    return;
  }

  await getDb().insert(referralClicks).values({
    dealerId: input.dealer?.id,
    visitorSessionId: input.visitorSessionId,
    referralCode: input.referralCode,
    landingPath: input.landingPath,
  });
}

function hashIp(value: string | null) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
}

export async function upsertVisitorSession(input: {
  request: NextRequest;
  visitorToken: string;
  attribution: ReferralAttribution;
  shouldPreserveExistingAttribution: boolean;
}) {
  if (!hasDatabaseUrl) {
    return null;
  }

  const forwardedFor = input.request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
  const db = getDb();
  const now = new Date();

  const [inserted] = await db
    .insert(visitorSessions)
    .values({
      visitorToken: input.visitorToken,
      firstDealerId: input.attribution.dealerId,
      currentDealerId: input.attribution.dealerId,
      attributionStartedAt: new Date(input.attribution.startedAt),
      attributionExpiresAt: new Date(input.attribution.expiresAt),
      userAgent: input.request.headers.get("user-agent"),
      ipHash: hashIp(ipAddress),
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: visitorSessions.visitorToken,
      set: input.shouldPreserveExistingAttribution
        ? {
            userAgent: input.request.headers.get("user-agent"),
            ipHash: hashIp(ipAddress),
            lastSeenAt: now,
            updatedAt: now,
          }
        : {
            firstDealerId: input.attribution.dealerId,
            currentDealerId: input.attribution.dealerId,
            attributionStartedAt: new Date(input.attribution.startedAt),
            attributionExpiresAt: new Date(input.attribution.expiresAt),
            userAgent: input.request.headers.get("user-agent"),
            ipHash: hashIp(ipAddress),
            lastSeenAt: now,
            updatedAt: now,
          },
    })
    .returning({ id: visitorSessions.id });

  return inserted?.id ?? null;
}

export async function getCurrentReferralContext() {
  const [attribution, visitorToken] = await Promise.all([
    readAttributionFromCookies(),
    readVisitorTokenFromCookies(),
  ]);
  const activeAttribution = isAttributionActive(attribution) ? attribution : null;

  if (!hasDatabaseUrl || !visitorToken) {
    return {
      dealerId: activeAttribution?.dealerId ?? null,
      visitorSessionId: null,
      referralCode: activeAttribution?.referralCode ?? null,
    };
  }

  const [session] = await getDb()
    .select({
      id: visitorSessions.id,
      currentDealerId: visitorSessions.currentDealerId,
      attributionExpiresAt: visitorSessions.attributionExpiresAt,
    })
    .from(visitorSessions)
    .where(eq(visitorSessions.visitorToken, visitorToken))
    .limit(1);

  const sessionDealerActive =
    session?.currentDealerId &&
    session.attributionExpiresAt &&
    session.attributionExpiresAt > new Date();

  return {
    dealerId:
      activeAttribution?.dealerId ??
      (sessionDealerActive ? session.currentDealerId : null),
    visitorSessionId: session?.id ?? null,
    referralCode: activeAttribution?.referralCode ?? null,
  };
}
