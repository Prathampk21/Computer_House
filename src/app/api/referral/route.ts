import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import {
  ATTRIBUTION_COOKIE,
  VISITOR_COOKIE,
  createAttribution,
  decodeAttribution,
  encodeAttribution,
  isAttributionActive,
  recordReferralClick,
  referralCodeSchema,
  resolveDealerByReferralCode,
  upsertVisitorSession,
} from "@/features/referrals/attribution";
import { getShopSettings } from "@/features/shop/settings";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawReferralCode = url.searchParams.get("ref") ?? "";
  const parsed = referralCodeSchema.safeParse(rawReferralCode);
  const homeUrl = new URL("/", request.url);
  const response = NextResponse.redirect(homeUrl);

  if (!parsed.success) {
    return response;
  }

  const referralCode = parsed.data;
  const [dealer, shopSettings] = await Promise.all([
    resolveDealerByReferralCode(referralCode),
    getShopSettings(),
  ]);

  if (!dealer) {
    await recordReferralClick({
      dealer,
      referralCode,
      landingPath: "/",
    });

    return response;
  }

  const existing = decodeAttribution(
    request.cookies.get(ATTRIBUTION_COOKIE)?.value,
  );
  const attribution = isAttributionActive(existing)
    ? existing!
    : createAttribution(dealer, shopSettings.defaultAttributionDays);

  const visitorToken =
    request.cookies.get(VISITOR_COOKIE)?.value ?? `v_${nanoid(32)}`;
  const visitorSessionId = await upsertVisitorSession({
    request,
    visitorToken,
    attribution,
    shouldPreserveExistingAttribution: isAttributionActive(existing),
  });
  await recordReferralClick({
    dealer,
    referralCode,
    landingPath: "/",
    visitorSessionId,
  });
  const maxAge = shopSettings.defaultAttributionDays * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(VISITOR_COOKIE, visitorToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  response.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution(attribution), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });

  return response;
}
