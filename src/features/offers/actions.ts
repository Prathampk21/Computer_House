"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import {
  auditLogs,
  offers,
  productChangeEvents,
  productOffers,
  products,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";

const optionalAmount = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().nonnegative().optional(),
);

const offerSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    offerType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "BUNDLE", "CUSTOM"]),
    discountValue: optionalAmount,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    active: z.boolean(),
    bannerText: z.string().trim().max(220).optional().or(z.literal("")),
    productIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Offer end must be after its start.",
    path: ["endsAt"],
  });

function parseOfferForm(formData: FormData) {
  return offerSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    offerType: formData.get("offerType"),
    discountValue: formData.get("discountValue"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    active: formData.get("active") === "on",
    bannerText: formData.get("bannerText"),
    productIds: formData.getAll("productIds").map(String),
  });
}

function revalidateOfferPages() {
  revalidatePath("/");
  revalidatePath("/offers");
  revalidatePath("/compare");
  revalidatePath("/admin/catalog/offers");
}

export async function createOffer(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = parseOfferForm(formData);

  if (!hasDatabaseUrl) return;

  const [offer] = await getDb().transaction(async (tx) => {
    const selectedProducts = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.published, true));
    const allowedIds = new Set(selectedProducts.map((product) => product.id));
    const productIds = [...new Set(parsed.productIds)].filter((id) => allowedIds.has(id));

    if (productIds.length !== [...new Set(parsed.productIds)].length) {
      throw new Error("One or more selected products are unavailable.");
    }

    const [createdOffer] = await tx
      .insert(offers)
      .values({
        title: parsed.title,
        description: parsed.description || null,
        offerType: parsed.offerType,
        discountValue:
          parsed.discountValue === undefined ? null : parsed.discountValue.toFixed(2),
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        active: parsed.active,
        bannerText: parsed.bannerText || null,
      })
      .returning({ id: offers.id });

    await tx.insert(productOffers).values(
      productIds.map((productId) => ({ productId, offerId: createdOffer.id })),
    );

    await tx.insert(productChangeEvents).values(
      productIds.map((productId) => ({
        productId,
        eventType: "OFFER_STARTED" as const,
        newValues: { offerId: createdOffer.id, title: parsed.title },
        createdByProfileId: actor.id,
      })),
    );

    await tx.insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "OFFER_CREATED",
      entityType: "offer",
      entityId: createdOffer.id,
      newValues: { title: parsed.title, productIds, active: parsed.active },
    });

    return [createdOffer];
  });

  revalidateOfferPages();
  redirect(`/admin/catalog/offers/${offer.id}?created=1`);
}

export async function updateOffer(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const offerId = z.string().uuid().parse(formData.get("offerId"));
  const parsed = parseOfferForm(formData);

  if (!hasDatabaseUrl) return;

  const db = getDb();
  const [current] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);

  if (!current) throw new Error("Offer not found.");

  await db.transaction(async (tx) => {
    await tx
      .update(offers)
      .set({
        title: parsed.title,
        description: parsed.description || null,
        offerType: parsed.offerType,
        discountValue:
          parsed.discountValue === undefined ? null : parsed.discountValue.toFixed(2),
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        active: parsed.active,
        bannerText: parsed.bannerText || null,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId));

    await tx.delete(productOffers).where(eq(productOffers.offerId, offerId));
    await tx.insert(productOffers).values(
      [...new Set(parsed.productIds)].map((productId) => ({ productId, offerId })),
    );

    await tx.insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "OFFER_UPDATED",
      entityType: "offer",
      entityId: offerId,
      previousValues: {
        title: current.title,
        active: current.active,
        startsAt: current.startsAt,
        endsAt: current.endsAt,
      },
      newValues: {
        title: parsed.title,
        active: parsed.active,
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        productIds: parsed.productIds,
      },
    });
  });

  revalidateOfferPages();
  revalidatePath(`/admin/catalog/offers/${offerId}`);
  redirect(`/admin/catalog/offers/${offerId}?saved=1`);
}

export async function setOfferActive(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const offerId = z.string().uuid().parse(formData.get("offerId"));
  const active = formData.get("active") === "true";

  if (hasDatabaseUrl) {
    await getDb().transaction(async (tx) => {
      await tx
        .update(offers)
        .set({ active, updatedAt: new Date() })
        .where(eq(offers.id, offerId));
      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: active ? "OFFER_ACTIVATED" : "OFFER_DEACTIVATED",
        entityType: "offer",
        entityId: offerId,
        newValues: { active },
      });
    });
  }

  revalidateOfferPages();
  revalidatePath(`/admin/catalog/offers/${offerId}`);
}
