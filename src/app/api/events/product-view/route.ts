import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { productViews, products } from "@/db/schema";
import { getCurrentReferralContext } from "@/features/referrals/attribution";
import { hasDatabaseUrl } from "@/lib/env";

const productViewSchema = z.object({
  productSlug: z.string().trim().min(1).max(240),
});

export async function POST(request: NextRequest) {
  const parsed = productViewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!hasDatabaseUrl) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const db = getDb();
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, parsed.data.productSlug))
    .limit(1);

  if (!product) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const referralContext = await getCurrentReferralContext();

  await db.insert(productViews).values({
    productId: product.id,
    visitorSessionId: referralContext.visitorSessionId,
    dealerId: referralContext.dealerId,
  });

  return NextResponse.json({ ok: true });
}
