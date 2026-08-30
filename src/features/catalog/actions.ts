"use server";

import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/db";
import {
  auditLogs,
  notificationJobs,
  productChangeEvents,
  customerSubscriptions,
  products,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";

export async function updateProductPrice(input: {
  productId: string;
  newSellingPrice: string;
  reason: string;
}) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);

  if (!hasDatabaseUrl) {
    return {
      ok: true,
      demo: true,
      message:
        "Database is not configured, so no live product price update was saved.",
    };
  }

  const db = getDb();
  const [product] = await db
    .select({
      id: products.id,
      sellingPrice: products.sellingPrice,
      name: products.name,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (!product) {
    throw new Error("Product not found.");
  }

  const [event] = await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        sellingPrice: input.newSellingPrice,
        updatedAt: new Date(),
      })
      .where(eq(products.id, input.productId));

    const [createdEvent] = await tx
      .insert(productChangeEvents)
      .values({
        productId: input.productId,
        eventType: "PRICE_CHANGED",
        oldValues: { sellingPrice: product.sellingPrice },
        newValues: { sellingPrice: input.newSellingPrice },
        createdByProfileId: actor.id,
      })
      .returning();

    const subscriptions = await tx
      .select({
        id: customerSubscriptions.id,
        email: customerSubscriptions.email,
        mobile: customerSubscriptions.mobile,
        eventTypes: customerSubscriptions.eventTypes,
      })
      .from(customerSubscriptions)
      .where(
        and(
          eq(customerSubscriptions.active, true),
          eq(customerSubscriptions.consentGiven, true),
          or(
            eq(customerSubscriptions.productId, input.productId),
            eq(customerSubscriptions.categoryId, product.categoryId),
          ),
        ),
      );
    const eligibleJobs = subscriptions
      .filter((subscription) =>
        subscription.eventTypes.includes("PRICE_CHANGED"),
      )
      .flatMap((subscription) => {
        const recipient = subscription.email ?? subscription.mobile;

        if (!recipient) {
          return [];
        }

        return {
          productChangeEventId: createdEvent.id,
          customerSubscriptionId: subscription.id,
          recipient,
          channel: subscription.email ? "EMAIL" : "WHATSAPP",
          payload: {
            productId: input.productId,
            productName: product.name,
            eventType: "PRICE_CHANGED",
            oldSellingPrice: product.sellingPrice,
            newSellingPrice: input.newSellingPrice,
          },
        } as const;
      });

    if (eligibleJobs.length > 0) {
      await tx.insert(notificationJobs).values(eligibleJobs);
    }

    await tx.insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "PRODUCT_PRICE_CHANGED",
      entityType: "product",
      entityId: input.productId,
      previousValues: { sellingPrice: product.sellingPrice },
      newValues: { sellingPrice: input.newSellingPrice },
      reason: input.reason,
    });

    return [createdEvent];
  });

  return { ok: true, eventId: event.id };
}
