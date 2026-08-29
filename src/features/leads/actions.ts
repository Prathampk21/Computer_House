"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import {
  customers,
  leadItems,
  leads,
  leadStatusHistory,
  products as productsTable,
  whatsappClickEvents,
} from "@/db/schema";
import { getProductBySlug } from "@/features/catalog/demo-data";
import { getCurrentReferralContext } from "@/features/referrals/attribution";
import { getShopSettings } from "@/features/shop/settings";
import { productEnquirySchema, quoteRequestSchema } from "@/features/leads/validation";
import { hasDatabaseUrl } from "@/lib/env";

function createLeadNumber() {
  const year = new Date().getFullYear();
  return `ENQ-${year}-${nanoid(8).toUpperCase()}`;
}

const duplicateWindowMs = 10 * 60 * 1000;

function buildWhatsAppUrl(input: {
  phoneNumber: string;
  productName: string;
  leadNumber: string;
}) {
  const message = [
    `Hello, I am interested in ${input.productName}.`,
    "",
    `Enquiry Reference: ${input.leadNumber}`,
    "",
    "Please share your best price and availability.",
  ].join("\n");

  return `https://wa.me/${input.phoneNumber}?text=${encodeURIComponent(message)}`;
}

export async function createProductEnquiry(formData: FormData) {
  const parsed = productEnquirySchema.parse({
    productSlug: formData.get("productSlug"),
    productName: formData.get("productName"),
    sku: formData.get("sku"),
    sellingPrice: formData.get("sellingPrice"),
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  const referralContext = await getCurrentReferralContext();
  let leadNumber = createLeadNumber();
  let productSnapshot = {
    id: null as string | null,
    name: parsed.productName,
    sku: parsed.sku,
    sellingPrice: parsed.sellingPrice,
  };

  if (hasDatabaseUrl) {
    const db = getDb();
    const [product] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        sellingPrice: productsTable.sellingPrice,
      })
      .from(productsTable)
      .where(eq(productsTable.slug, parsed.productSlug))
      .limit(1);

    if (!product) {
      throw new Error("Product not found.");
    }

    productSnapshot = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      sellingPrice: Number(product.sellingPrice),
    };

    await db.transaction(async (tx) => {
      const [existingCustomer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.mobile, parsed.mobile))
        .limit(1);

      const [customer] = existingCustomer
        ? await tx
            .update(customers)
            .set({
              name: parsed.name,
              email: parsed.email || null,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id))
            .returning({ id: customers.id })
        : await tx
            .insert(customers)
            .values({
              name: parsed.name,
              mobile: parsed.mobile,
              email: parsed.email || null,
              notificationConsent: false,
            })
            .returning({ id: customers.id });

      const duplicateWindowStart = new Date(Date.now() - duplicateWindowMs);
      const [recentLead] = await tx
        .select({ leadNumber: leads.leadNumber })
        .from(leads)
        .innerJoin(leadItems, eq(leads.id, leadItems.leadId))
        .where(
          and(
            eq(leads.customerId, customer.id),
            eq(leadItems.productId, productSnapshot.id!),
            gte(leads.createdAt, duplicateWindowStart),
          ),
        )
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (recentLead) {
        leadNumber = recentLead.leadNumber;
        return;
      }

      const [lead] = await tx
        .insert(leads)
        .values({
          leadNumber,
          customerId: customer.id,
          dealerId: referralContext.dealerId,
          visitorSessionId: referralContext.visitorSessionId,
          source: referralContext.dealerId ? "DEALER_REFERRAL" : "WHATSAPP",
          status: "NEW",
          message: parsed.message || null,
        })
        .returning({ id: leads.id });

      await tx.insert(leadItems).values({
        leadId: lead.id,
        productId: productSnapshot.id,
        productNameSnapshot: productSnapshot.name,
        skuSnapshot: productSnapshot.sku,
        sellingPriceSnapshot: String(productSnapshot.sellingPrice),
        quantity: 1,
      });

      await tx.insert(leadStatusHistory).values({
        leadId: lead.id,
        newStatus: "NEW",
        note: "Lead created from public WhatsApp enquiry.",
      });

      await tx.insert(whatsappClickEvents).values({
        productId: productSnapshot.id,
        leadId: lead.id,
        visitorSessionId: referralContext.visitorSessionId,
        dealerId: referralContext.dealerId,
      });
    });
  }

  const shopSettings = await getShopSettings();

  redirect(
    buildWhatsAppUrl({
      phoneNumber: shopSettings.whatsappNumber,
      productName: productSnapshot.name,
      leadNumber,
    }),
  );
}

export async function createQuotationRequest(formData: FormData) {
  const productSlugs = String(formData.get("productSlugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const parsed = quoteRequestSchema.parse({
    productSlugs,
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  const demoProducts = parsed.productSlugs
    .map((slug) => getProductBySlug(slug))
    .filter(Boolean);
  let leadNumber = createLeadNumber();
  let productName =
    demoProducts.length > 0
      ? demoProducts.map((product) => product!.name).join(", ")
      : "selected products";

  if (hasDatabaseUrl) {
    const db = getDb();
    const referralContext = await getCurrentReferralContext();
    const selectedProducts = await db
      .select({
        id: productsTable.id,
        slug: productsTable.slug,
        name: productsTable.name,
        sku: productsTable.sku,
        sellingPrice: productsTable.sellingPrice,
      })
      .from(productsTable)
      .where(inArray(productsTable.slug, parsed.productSlugs));

    if (selectedProducts.length === 0) {
      throw new Error("No valid products selected.");
    }

    productName = selectedProducts.map((product) => product.name).join(", ");

    await db.transaction(async (tx) => {
      const [existingCustomer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.mobile, parsed.mobile))
        .limit(1);

      const [customer] = existingCustomer
        ? await tx
            .update(customers)
            .set({
              name: parsed.name,
              email: parsed.email || null,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id))
            .returning({ id: customers.id })
        : await tx
            .insert(customers)
            .values({
              name: parsed.name,
              mobile: parsed.mobile,
              email: parsed.email || null,
              notificationConsent: false,
            })
            .returning({ id: customers.id });

      const duplicateWindowStart = new Date(Date.now() - duplicateWindowMs);
      const [recentLead] = await tx
        .select({ leadNumber: leads.leadNumber })
        .from(leads)
        .where(
          and(
            eq(leads.customerId, customer.id),
            gte(leads.createdAt, duplicateWindowStart),
          ),
        )
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (recentLead) {
        leadNumber = recentLead.leadNumber;
        return;
      }

      const [lead] = await tx
        .insert(leads)
        .values({
          leadNumber,
          customerId: customer.id,
          dealerId: referralContext.dealerId,
          visitorSessionId: referralContext.visitorSessionId,
          source: referralContext.dealerId ? "DEALER_REFERRAL" : "WEBSITE",
          status: "NEW",
          message: parsed.message || null,
        })
        .returning({ id: leads.id });

      await tx.insert(leadItems).values(
        selectedProducts.map((product) => ({
          leadId: lead.id,
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          sellingPriceSnapshot: product.sellingPrice,
          quantity: 1,
        })),
      );

      await tx.insert(leadStatusHistory).values({
        leadId: lead.id,
        newStatus: "NEW",
        note: "Quote request created from public enquiry basket.",
      });
    });
  }

  const shopSettings = await getShopSettings();

  redirect(
    buildWhatsAppUrl({
      phoneNumber: shopSettings.whatsappNumber,
      productName,
      leadNumber,
    }),
  );
}
