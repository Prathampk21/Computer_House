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
  notificationJobs,
  products as productsTable,
} from "@/db/schema";
import { getProductBySlug } from "@/features/catalog/demo-data";
import { getCurrentReferralContext } from "@/features/referrals/attribution";
import { getShopSettings } from "@/features/shop/settings";
import {
  productEnquirySchema,
  quoteRequestSchema,
} from "@/features/leads/validation";
import { processNotificationJob } from "@/features/notifications/processor";
import { hasDatabaseUrl } from "@/lib/env";

function createLeadNumber() {
  const year = new Date().getFullYear();
  return `ENQ-${year}-${nanoid(8).toUpperCase()}`;
}

const duplicateWindowMs = 10 * 60 * 1000;

function cleanPhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

function shopNotificationChannel(): "WHATSAPP" | "IN_APP" {
  return process.env.WHATSAPP_PROVIDER_WEBHOOK_URL ? "WHATSAPP" : "IN_APP";
}

function redirectToSuccess(leadNumber: string) {
  redirect(`/enquiry/success?ref=${encodeURIComponent(leadNumber)}`);
}

async function dispatchShopNotification(jobId: string | null) {
  if (!jobId || !process.env.WHATSAPP_PROVIDER_WEBHOOK_URL) {
    return;
  }

  try {
    await processNotificationJob(jobId);
  } catch (error) {
    console.error("Unable to dispatch shop WhatsApp notification", error);
  }
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
  const shopSettings = await getShopSettings();
  const shopRecipient = cleanPhoneNumber(shopSettings.whatsappNumber);
  let notificationJobId: string | null = null;

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
          source: referralContext.dealerId ? "DEALER_REFERRAL" : "WEBSITE",
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
        note: "Lead created from public product enquiry.",
      });

      const [notificationJob] = await tx
        .insert(notificationJobs)
        .values({
          recipient: shopRecipient,
          channel: shopNotificationChannel(),
          payload: {
            eventType: "NEW_PRODUCT_ENQUIRY",
            leadNumber,
            customerName: parsed.name,
            customerMobile: parsed.mobile,
            customerEmail: parsed.email || null,
            productName: productSnapshot.name,
            sku: productSnapshot.sku,
            sellingPrice: productSnapshot.sellingPrice,
            message: parsed.message || null,
            requestedChannel: "WHATSAPP",
            shopWhatsAppNumber: shopRecipient,
          },
        })
        .returning({ id: notificationJobs.id });

      notificationJobId = notificationJob.id;
    });
  }

  await dispatchShopNotification(notificationJobId);
  redirectToSuccess(leadNumber);
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
  const shopSettings = await getShopSettings();
  const shopRecipient = cleanPhoneNumber(shopSettings.whatsappNumber);
  let notificationJobId: string | null = null;

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

      const [notificationJob] = await tx
        .insert(notificationJobs)
        .values({
          recipient: shopRecipient,
          channel: shopNotificationChannel(),
          payload: {
            eventType: "NEW_QUOTE_REQUEST",
            leadNumber,
            customerName: parsed.name,
            customerMobile: parsed.mobile,
            customerEmail: parsed.email || null,
            productName,
            products: selectedProducts.map((product) => ({
              name: product.name,
              sku: product.sku,
              sellingPrice: Number(product.sellingPrice),
            })),
            message: parsed.message || null,
            requestedChannel: "WHATSAPP",
            shopWhatsAppNumber: shopRecipient,
          },
        })
        .returning({ id: notificationJobs.id });

      notificationJobId = notificationJob.id;
    });
  }

  await dispatchShopNotification(notificationJobId);
  redirectToSuccess(leadNumber);
}
