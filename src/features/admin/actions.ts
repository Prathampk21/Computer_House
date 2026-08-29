"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import {
  auditLogs,
  brands,
  categories,
  dealers,
  leadStatusHistory,
  leads,
  productImages,
  products,
  sales,
  saleItems,
  shopSettings,
  specificationDefinitions,
} from "@/db/schema";
import { createCommissionForWonSale } from "@/features/commissions/service";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";
import { slugify } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().or(z.literal("")),
});

const brandSchema = z.object({
  name: z.string().trim().min(2),
});

const dealerSchema = z.object({
  businessName: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  mobile: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal("")),
  commissionValue: z.coerce.number().min(0).max(100),
});

const specSchema = z.object({
  categoryName: z.string().trim().min(2),
  key: z.string().trim().min(2).max(120),
  label: z.string().trim().min(2).max(160),
  dataType: z.enum(["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"]),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  filterable: z.coerce.boolean().optional(),
  comparable: z.coerce.boolean().optional(),
  required: z.coerce.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2).max(80),
  categoryName: z.string().trim().min(2),
  brandName: z.string().trim().min(2),
  shortDescription: z.string().trim().min(5),
  detailedDescription: z.string().trim().optional().or(z.literal("")),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]),
  conditionGrade: z.string().trim().max(40).optional().or(z.literal("")),
  regularPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative(),
  stockStatus: z.enum([
    "IN_STOCK",
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "SOLD",
    "COMING_SOON",
  ]),
  warranty: z.string().trim().optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
});

const leadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "NEGOTIATING",
    "WON",
    "LOST",
    "CANCELLED",
  ]),
  note: z.string().trim().optional().or(z.literal("")),
});

const attributionOverrideSchema = z.object({
  leadId: z.string().uuid(),
  dealerId: z.string().uuid().nullable().optional(),
  reason: z.string().trim().min(8),
});

const saleSchema = z.object({
  leadId: z.string().uuid(),
  productName: z.string().trim().min(2),
  sku: z.string().trim().min(2),
  saleAmount: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().default(1),
  invoiceReference: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

const settingsSchema = z.object({
  businessName: z.string().trim().min(2),
  shortName: z.string().trim().min(2),
  phone: z.string().trim().min(5),
  whatsappNumber: z.string().trim().min(8),
  email: z.string().trim().email(),
  address: z.string().trim().min(5),
  currency: z.string().trim().min(3).max(3),
  timezone: z.string().trim().min(3),
  defaultAttributionDays: z.coerce.number().int().positive(),
});

async function getOrCreateCategoryId(name: string) {
  const db = getDb();
  const slug = slugify(name);
  const [inserted] = await db
    .insert(categories)
    .values({ name, slug })
    .onConflictDoNothing()
    .returning({ id: categories.id });

  if (inserted) {
    return inserted.id;
  }

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!existing) {
    throw new Error(`Unable to create category ${name}.`);
  }

  return existing.id;
}

async function getOrCreateBrandId(name: string) {
  const db = getDb();
  const slug = slugify(name);
  const [inserted] = await db
    .insert(brands)
    .values({ name, slug })
    .onConflictDoNothing()
    .returning({ id: brands.id });

  if (inserted) {
    return inserted.id;
  }

  const [existing] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);

  if (!existing) {
    throw new Error(`Unable to create brand ${name}.`);
  }

  return existing.id;
}

export async function createCategory(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (hasDatabaseUrl) {
    await getDb().insert(categories).values({
      name: parsed.name,
      slug: slugify(parsed.name),
      description: parsed.description || null,
    });
  }

  void actor;
  revalidatePath("/admin/catalog/categories");
}

export async function createBrand(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = brandSchema.parse({ name: formData.get("name") });

  if (hasDatabaseUrl) {
    await getDb().insert(brands).values({
      name: parsed.name,
      slug: slugify(parsed.name),
    });
  }

  revalidatePath("/admin/catalog/brands");
}

export async function createDealer(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = dealerSchema.parse({
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName"),
    mobile: formData.get("mobile"),
    email: formData.get("email"),
    commissionValue: formData.get("commissionValue"),
  });
  const referralCode = `DLR-${nanoid(8).toUpperCase()}`;

  if (hasDatabaseUrl) {
    const [dealer] = await getDb()
      .insert(dealers)
      .values({
        businessName: parsed.businessName,
        contactName: parsed.contactName,
        mobile: parsed.mobile,
        email: parsed.email || null,
        referralCode,
        active: true,
        defaultCommissionType: "PERCENTAGE",
        defaultCommissionValue: String(parsed.commissionValue),
        activatedAt: new Date(),
      })
      .returning({ id: dealers.id });

    await getDb().insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "DEALER_CREATED",
      entityType: "dealer",
      entityId: dealer.id,
      newValues: { referralCode, businessName: parsed.businessName },
    });
  }

  revalidatePath("/admin/dealers");
}

export async function createSpecificationDefinition(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = specSchema.parse({
    categoryName: formData.get("categoryName"),
    key: formData.get("key"),
    label: formData.get("label"),
    dataType: formData.get("dataType"),
    unit: formData.get("unit"),
    filterable: formData.get("filterable") === "on",
    comparable: formData.get("comparable") === "on",
    required: formData.get("required") === "on",
  });

  if (hasDatabaseUrl) {
    const categoryId = await getOrCreateCategoryId(parsed.categoryName);

    await getDb().insert(specificationDefinitions).values({
      categoryId,
      key: slugify(parsed.key).replaceAll("-", "_"),
      label: parsed.label,
      dataType: parsed.dataType,
      unit: parsed.unit || null,
      filterable: Boolean(parsed.filterable),
      comparable: parsed.comparable ?? true,
      required: Boolean(parsed.required),
    });
  }

  revalidatePath("/admin/catalog/specifications");
}

export async function createProduct(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryName: formData.get("categoryName"),
    brandName: formData.get("brandName"),
    shortDescription: formData.get("shortDescription"),
    detailedDescription: formData.get("detailedDescription"),
    condition: formData.get("condition"),
    conditionGrade: formData.get("conditionGrade"),
    regularPrice: formData.get("regularPrice"),
    sellingPrice: formData.get("sellingPrice"),
    stockQuantity: formData.get("stockQuantity"),
    stockStatus: formData.get("stockStatus"),
    warranty: formData.get("warranty"),
    imageUrl: formData.get("imageUrl"),
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });

  if (hasDatabaseUrl) {
    const [categoryId, brandId] = await Promise.all([
      getOrCreateCategoryId(parsed.categoryName),
      getOrCreateBrandId(parsed.brandName),
    ]);

    const [product] = await getDb()
      .insert(products)
      .values({
      name: parsed.name,
      slug: slugify(parsed.name),
      sku: parsed.sku,
      categoryId,
      brandId,
      shortDescription: parsed.shortDescription,
      detailedDescription: parsed.detailedDescription || null,
      condition: parsed.condition,
      conditionGrade: parsed.conditionGrade || null,
      regularPrice: String(parsed.regularPrice),
      sellingPrice: String(parsed.sellingPrice),
      stockQuantity: parsed.stockQuantity,
      stockStatus: parsed.stockStatus,
      warranty: parsed.warranty || null,
      featured: Boolean(parsed.featured),
      published: Boolean(parsed.published),
      })
      .returning({ id: products.id });

    if (parsed.imageUrl) {
      await getDb().insert(productImages).values({
        productId: product.id,
        storagePath: parsed.imageUrl,
        altText: parsed.name,
        isPrimary: true,
      });
    }
  }

  revalidatePath("/admin/catalog/products");
}

export async function updateLeadStatus(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = leadStatusSchema.parse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [lead] = await db
      .select({ status: leads.status })
      .from(leads)
      .where(eq(leads.id, parsed.leadId))
      .limit(1);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(leads)
        .set({ status: parsed.status, updatedAt: new Date() })
        .where(eq(leads.id, parsed.leadId));

      await tx.insert(leadStatusHistory).values({
        leadId: parsed.leadId,
        previousStatus: lead.status,
        newStatus: parsed.status,
        changedByProfileId: actor.id,
        note: parsed.note || null,
      });

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "LEAD_STATUS_CHANGED",
        entityType: "lead",
        entityId: parsed.leadId,
        previousValues: { status: lead.status },
        newValues: { status: parsed.status },
        reason: parsed.note || null,
      });
    });
  }

  revalidatePath("/admin/crm/leads");
}

export async function overrideLeadAttribution(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = attributionOverrideSchema.parse({
    leadId: formData.get("leadId"),
    dealerId: formData.get("dealerId") || null,
    reason: formData.get("reason"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [lead] = await db
      .select({ dealerId: leads.dealerId })
      .from(leads)
      .where(eq(leads.id, parsed.leadId))
      .limit(1);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(leads)
        .set({
          dealerId: parsed.dealerId ?? null,
          attributionOverrideReason: parsed.reason,
          attributedByProfileId: actor.id,
          attributedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, parsed.leadId));

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "LEAD_ATTRIBUTION_OVERRIDDEN",
        entityType: "lead",
        entityId: parsed.leadId,
        previousValues: { dealerId: lead.dealerId },
        newValues: { dealerId: parsed.dealerId ?? null },
        reason: parsed.reason,
      });
    });
  }

  revalidatePath("/admin/crm/leads");
}

export async function recordSale(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = saleSchema.parse({
    leadId: formData.get("leadId"),
    productName: formData.get("productName"),
    sku: formData.get("sku"),
    saleAmount: formData.get("saleAmount"),
    quantity: formData.get("quantity") ?? 1,
    invoiceReference: formData.get("invoiceReference"),
    notes: formData.get("notes"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [lead] = await db
      .select({
        id: leads.id,
        customerId: leads.customerId,
        dealerId: leads.dealerId,
        status: leads.status,
      })
      .from(leads)
      .where(eq(leads.id, parsed.leadId))
      .limit(1);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const [sale] = await db.transaction(async (tx) => {
      await tx
        .update(leads)
        .set({ status: "WON", updatedAt: new Date() })
        .where(eq(leads.id, parsed.leadId));

      await tx.insert(leadStatusHistory).values({
        leadId: parsed.leadId,
        previousStatus: lead.status,
        newStatus: "WON",
        changedByProfileId: actor.id,
        note: "Sale recorded and lead marked WON.",
      });

      const [createdSale] = await tx
        .insert(sales)
        .values({
          leadId: parsed.leadId,
          customerId: lead.customerId,
          dealerId: lead.dealerId,
          saleAmount: String(parsed.saleAmount),
          saleDate: new Date(),
          invoiceReference: parsed.invoiceReference || null,
          notes: parsed.notes || null,
        })
        .returning({ id: sales.id });

      await tx.insert(saleItems).values({
        saleId: createdSale.id,
        productNameSnapshot: parsed.productName,
        skuSnapshot: parsed.sku,
        unitPriceSnapshot: String(parsed.saleAmount),
        quantity: parsed.quantity,
      });

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "SALE_RECORDED",
        entityType: "lead",
        entityId: parsed.leadId,
        newValues: { saleId: createdSale.id, saleAmount: parsed.saleAmount },
      });

      return [createdSale];
    });

    await createCommissionForWonSale({ leadId: parsed.leadId, saleId: sale.id });
  }

  revalidatePath("/admin/sales");
}

export async function updateShopSettings(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = settingsSchema.parse({
    businessName: formData.get("businessName"),
    shortName: formData.get("shortName"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    email: formData.get("email"),
    address: formData.get("address"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    defaultAttributionDays: formData.get("defaultAttributionDays"),
  });

  if (hasDatabaseUrl) {
    await getDb()
      .insert(shopSettings)
      .values({
        key: "business",
        value: parsed,
        description: "Business branding and operational settings.",
      })
      .onConflictDoUpdate({
        target: shopSettings.key,
        set: { value: parsed, updatedAt: new Date() },
      });

    await getDb().insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "SHOP_SETTINGS_CHANGED",
      entityType: "shop_settings",
      newValues: parsed,
    });
  }

  revalidatePath("/admin/settings");
}
