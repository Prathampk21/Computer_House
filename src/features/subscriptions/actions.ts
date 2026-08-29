"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import {
  customerSubscriptions,
  customers,
  products,
} from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";

const productSubscriptionSchema = z.object({
  productSlug: z.string().trim().min(1),
  name: z.string().trim().min(2),
  mobile: z.string().trim().min(8).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  eventTypes: z.array(z.string()).min(1),
  consent: z.literal("on"),
});

export async function createProductSubscription(formData: FormData) {
  const parsed = productSubscriptionSchema.parse({
    productSlug: formData.get("productSlug"),
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email"),
    eventTypes: formData.getAll("eventTypes").map(String),
    consent: formData.get("consent"),
  });

  if (!parsed.email && !parsed.mobile) {
    throw new Error("Email or mobile is required for notifications.");
  }

  if (hasDatabaseUrl) {
    const db = getDb();
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, parsed.productSlug))
      .limit(1);

    if (!product) {
      throw new Error("Product not found.");
    }

    await db.transaction(async (tx) => {
      const lookupValue = parsed.mobile || parsed.email!;
      const [existingCustomer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(
          parsed.mobile
            ? eq(customers.mobile, parsed.mobile)
            : eq(customers.email, lookupValue),
        )
        .limit(1);
      const [customer] = existingCustomer
        ? await tx
            .update(customers)
            .set({
              name: parsed.name,
              email: parsed.email || null,
              notificationConsent: true,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id))
            .returning({ id: customers.id })
        : await tx
            .insert(customers)
            .values({
              name: parsed.name,
              mobile: parsed.mobile || parsed.email!,
              email: parsed.email || null,
              notificationConsent: true,
            })
            .returning({ id: customers.id });

      await tx.insert(customerSubscriptions).values({
        customerId: customer.id,
        productId: product.id,
        email: parsed.email || null,
        mobile: parsed.mobile || null,
        eventTypes: parsed.eventTypes,
        consentGiven: true,
        active: true,
      });
    });
  }

  revalidatePath(`/products/${parsed.productSlug}`);
}
