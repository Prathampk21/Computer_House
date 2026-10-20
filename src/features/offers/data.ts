import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { offers, productOffers, products } from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";

export type AdminOffer = {
  id: string;
  title: string;
  description: string | null;
  offerType: string;
  discountValue: string | null;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  bannerText: string | null;
  products: Array<{ id: string; name: string; sku: string }>;
};

export async function listAdminOffers(): Promise<AdminOffer[]> {
  if (!hasDatabaseUrl) return [];

  const rows = await getDb()
    .select({
      id: offers.id,
      title: offers.title,
      description: offers.description,
      offerType: offers.offerType,
      discountValue: offers.discountValue,
      startsAt: offers.startsAt,
      endsAt: offers.endsAt,
      active: offers.active,
      bannerText: offers.bannerText,
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
    })
    .from(offers)
    .leftJoin(productOffers, eq(offers.id, productOffers.offerId))
    .leftJoin(products, eq(productOffers.productId, products.id))
    .orderBy(desc(offers.createdAt), products.name);

  const result = new Map<string, AdminOffer>();

  for (const row of rows) {
    const offer = result.get(row.id) ?? {
      id: row.id,
      title: row.title,
      description: row.description,
      offerType: row.offerType,
      discountValue: row.discountValue,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      active: row.active,
      bannerText: row.bannerText,
      products: [],
    };

    if (row.productId && row.productName && row.productSku) {
      offer.products.push({
        id: row.productId,
        name: row.productName,
        sku: row.productSku,
      });
    }

    result.set(row.id, offer);
  }

  return [...result.values()];
}

export async function getAdminOfferById(offerId: string) {
  const offersList = await listAdminOffers();
  return offersList.find((offer) => offer.id === offerId) ?? null;
}
