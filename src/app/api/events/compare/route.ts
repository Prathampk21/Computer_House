import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { comparisonEvents, products } from "@/db/schema";
import { getCurrentReferralContext } from "@/features/referrals/attribution";
import { hasDatabaseUrl } from "@/lib/env";

const compareSchema = z.object({
  productSlugs: z.array(z.string().trim().min(1).max(240)).min(2).max(4),
});

export async function POST(request: NextRequest) {
  const parsed = compareSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!hasDatabaseUrl) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const selectedProducts = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.slug, parsed.data.productSlugs));

  if (selectedProducts.length < 2) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const referralContext = await getCurrentReferralContext();

  await getDb().insert(comparisonEvents).values({
    visitorSessionId: referralContext.visitorSessionId,
    dealerId: referralContext.dealerId,
    productIds: selectedProducts.map((product) => product.id),
  });

  return NextResponse.json({ ok: true });
}
