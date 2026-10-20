"use server";

import { and, count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import {
  auditLogs,
  brands,
  categories,
  commissionPayouts,
  commissions,
  dealers,
  leadNotes,
  leadStatusHistory,
  leads,
  productImages,
  productChangeEvents,
  productSpecificationValues,
  profiles,
  products,
  sales,
  saleItems,
  shopSettings,
  specificationDefinitions,
} from "@/db/schema";
import { updateProductPrice } from "@/features/catalog/actions";
import { createCommissionForWonSale } from "@/features/commissions/service";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl, hasSupabaseAdminConfig } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseProvisioningClient,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl, slugify } from "@/lib/utils";

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
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  temporaryPassword: z.string().min(10).max(128),
  commissionValue: z.coerce.number().min(0).max(100),
});

const dealerUpdateSchema = z.object({
  dealerId: z.string().uuid(),
  businessName: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  mobile: z.string().trim().min(8),
  commissionValue: z.coerce.number().min(0).max(100),
});

const dealerPasswordSchema = z.object({
  dealerId: z.string().uuid(),
  temporaryPassword: z.string().max(128).optional().or(z.literal("")),
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
  productId: z.string().uuid(),
  saleAmount: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().default(1),
  invoiceReference: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

const leadNoteSchema = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(2).max(2000),
  dealerVisible: z.coerce.boolean().optional(),
});

const commissionUpdateSchema = z.object({
  commissionId: z.string().uuid(),
  finalAmount: z.coerce.number().nonnegative(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

const commissionPayoutSchema = z.object({
  commissionId: z.string().uuid(),
  paymentReference: z.string().trim().min(2).max(160),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const productPriceUpdateSchema = z.object({
  productId: z.string().uuid(),
  sellingPrice: z.coerce.number().nonnegative(),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

const productUpdateSchema = productSchema.extend({
  productId: z.string().uuid(),
});

const productImageSchema = z.object({
  productId: z.string().uuid(),
  storagePath: z.string().trim().min(1).max(2000),
  altText: z.string().trim().min(2).max(220),
});

const productImageMutationSchema = z.object({
  productId: z.string().uuid(),
  imageId: z.string().uuid(),
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
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  defaultAttributionDays: z.coerce.number().int().positive(),
  footerText: z.string().trim().min(10),
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
    await getDb()
      .insert(categories)
      .values({
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
    await getDb()
      .insert(brands)
      .values({
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
    temporaryPassword: formData.get("temporaryPassword"),
    commissionValue: formData.get("commissionValue"),
  });
  const referralCode = `DLR-${nanoid(8).toUpperCase()}`;

  if (hasDatabaseUrl) {
    const provisioningClient = createSupabaseProvisioningClient();
    const { data, error } = hasSupabaseAdminConfig
      ? await provisioningClient.auth.admin.createUser({
          email: parsed.email,
          password: parsed.temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: parsed.contactName,
            role: "DEALER",
          },
        })
      : await provisioningClient.auth.signUp({
          email: parsed.email,
          password: parsed.temporaryPassword,
          options: {
            emailRedirectTo: absoluteUrl("/auth/callback?next=/login"),
            data: { full_name: parsed.contactName, role: "DEALER" },
          },
        });

    if (error || !data.user || data.user.identities?.length === 0) {
      throw new Error(error?.message ?? "Unable to create dealer login.");
    }
    const authUser = data.user;

    let dealerId: string;

    try {
      const [dealer] = await getDb().transaction(async (tx) => {
        const [profile] = await tx
          .insert(profiles)
          .values({
            authUserId: authUser.id,
            email: parsed.email,
            fullName: parsed.contactName,
            role: "DEALER",
            mobile: parsed.mobile,
            active: true,
          })
          .returning({ id: profiles.id });

        const [createdDealer] = await tx
          .insert(dealers)
          .values({
            profileId: profile.id,
            businessName: parsed.businessName,
            contactName: parsed.contactName,
            mobile: parsed.mobile,
            email: parsed.email,
            referralCode,
            active: true,
            defaultCommissionType: "PERCENTAGE",
            defaultCommissionValue: String(parsed.commissionValue),
            activatedAt: new Date(),
          })
          .returning({ id: dealers.id });

        await tx.insert(auditLogs).values({
          actorProfileId: actor.id,
          action: "DEALER_CREATED",
          entityType: "dealer",
          entityId: createdDealer.id,
          newValues: {
            referralCode,
            businessName: parsed.businessName,
            email: parsed.email,
          },
        });

        return [createdDealer];
      });
      dealerId = dealer.id;
    } catch (databaseError) {
      if (hasSupabaseAdminConfig) {
        await provisioningClient.auth.admin.deleteUser(authUser.id);
      }
      throw databaseError;
    }

    revalidatePath("/admin/dealers");
    redirect(`/admin/dealers/${dealerId}?created=1`);
  }

  revalidatePath("/admin/dealers");
}

export async function updateDealer(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = dealerUpdateSchema.parse({
    dealerId: formData.get("dealerId"),
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName"),
    mobile: formData.get("mobile"),
    commissionValue: formData.get("commissionValue"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [dealer] = await db
      .select({ profileId: dealers.profileId })
      .from(dealers)
      .where(eq(dealers.id, parsed.dealerId))
      .limit(1);

    if (!dealer) throw new Error("Dealer not found.");

    await db.transaction(async (tx) => {
      await tx
        .update(dealers)
        .set({
          businessName: parsed.businessName,
          contactName: parsed.contactName,
          mobile: parsed.mobile,
          defaultCommissionValue: parsed.commissionValue.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(dealers.id, parsed.dealerId));

      if (dealer.profileId) {
        await tx
          .update(profiles)
          .set({
            fullName: parsed.contactName,
            mobile: parsed.mobile,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, dealer.profileId));
      }

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "DEALER_UPDATED",
        entityType: "dealer",
        entityId: parsed.dealerId,
        newValues: {
          businessName: parsed.businessName,
          contactName: parsed.contactName,
          commissionValue: parsed.commissionValue,
        },
      });
    });
  }

  revalidatePath("/admin/dealers");
  revalidatePath(`/admin/dealers/${parsed.dealerId}`);
  redirect(`/admin/dealers/${parsed.dealerId}?saved=1`);
}

export async function setDealerActive(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const dealerId = z.string().uuid().parse(formData.get("dealerId"));
  const active = formData.get("active") === "true";

  if (hasDatabaseUrl) {
    const db = getDb();
    const [dealer] = await db
      .select({ profileId: dealers.profileId })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) throw new Error("Dealer not found.");

    await db.transaction(async (tx) => {
      await tx
        .update(dealers)
        .set({
          active,
          activatedAt: active ? new Date() : null,
          deactivatedAt: active ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dealers.id, dealerId));

      if (dealer.profileId) {
        await tx
          .update(profiles)
          .set({ active, updatedAt: new Date() })
          .where(eq(profiles.id, dealer.profileId));
      }

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: active ? "DEALER_ACTIVATED" : "DEALER_DEACTIVATED",
        entityType: "dealer",
        entityId: dealerId,
        newValues: { active },
      });
    });
  }

  revalidatePath("/admin/dealers");
  revalidatePath(`/admin/dealers/${dealerId}`);
}

export async function resetDealerPassword(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = dealerPasswordSchema.parse({
    dealerId: formData.get("dealerId"),
    temporaryPassword: formData.get("temporaryPassword"),
  });

  if (hasDatabaseUrl) {
    const [dealer] = await getDb()
      .select({ authUserId: profiles.authUserId, email: profiles.email })
      .from(dealers)
      .innerJoin(profiles, eq(dealers.profileId, profiles.id))
      .where(eq(dealers.id, parsed.dealerId))
      .limit(1);

    if (!dealer) throw new Error("Dealer login is not linked.");

    const { error } = hasSupabaseAdminConfig
      ? await createSupabaseAdminClient().auth.admin.updateUserById(
          dealer.authUserId,
          {
            password: z
              .string()
              .min(10)
              .max(128)
              .parse(parsed.temporaryPassword),
          },
        )
      : await createSupabaseProvisioningClient().auth.resetPasswordForEmail(
          dealer.email,
          { redirectTo: absoluteUrl("/auth/callback?next=/reset-password") },
        );

    if (error) throw new Error(error.message);

    await getDb().insert(auditLogs).values({
      actorProfileId: actor.id,
      action: hasSupabaseAdminConfig
        ? "DEALER_PASSWORD_RESET"
        : "DEALER_PASSWORD_RESET_REQUESTED",
      entityType: "dealer",
      entityId: parsed.dealerId,
    });
  }

  revalidatePath(`/admin/dealers/${parsed.dealerId}`);
  redirect(
    `/admin/dealers/${parsed.dealerId}?password=${
      hasSupabaseAdminConfig ? "reset" : "emailed"
    }`,
  );
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

    await getDb()
      .insert(specificationDefinitions)
      .values({
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
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
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

    const db = getDb();
    const [product] = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
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
        await tx.insert(productImages).values({
          productId: createdProduct.id,
          storagePath: parsed.imageUrl,
          altText: parsed.name,
          isPrimary: true,
        });
      }

      await tx.insert(productChangeEvents).values({
        productId: createdProduct.id,
        eventType: "NEW_ARRIVAL",
        newValues: {
          name: parsed.name,
          sku: parsed.sku,
          sellingPrice: parsed.sellingPrice,
          stockStatus: parsed.stockStatus,
        },
        createdByProfileId: actor.id,
      });

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "PRODUCT_CREATED",
        entityType: "product",
        entityId: createdProduct.id,
        newValues: { name: parsed.name, sku: parsed.sku },
      });

      return [createdProduct];
    });

    revalidatePath("/");
    revalidatePath("/admin/catalog/products");
    redirect(`/admin/catalog/products/${product.id}?created=1`);
  }

  revalidatePath("/admin/catalog/products");
}

export async function updateProduct(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = productUpdateSchema.parse({
    productId: formData.get("productId"),
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
    imageUrl: "",
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });

  if (!hasDatabaseUrl) {
    revalidatePath(`/admin/catalog/products/${parsed.productId}`);
    return;
  }

  const db = getDb();
  const [current] = await db
    .select()
    .from(products)
    .where(eq(products.id, parsed.productId))
    .limit(1);

  if (!current) {
    throw new Error("Product not found.");
  }

  const [categoryId, brandId] = await Promise.all([
    getOrCreateCategoryId(parsed.categoryName),
    getOrCreateBrandId(parsed.brandName),
  ]);
  const newValues = {
    name: parsed.name,
    sku: parsed.sku,
    categoryId,
    brandId,
    shortDescription: parsed.shortDescription,
    detailedDescription: parsed.detailedDescription || null,
    condition: parsed.condition,
    conditionGrade: parsed.conditionGrade || null,
    regularPrice: parsed.regularPrice.toFixed(2),
    stockQuantity: parsed.stockQuantity,
    stockStatus: parsed.stockStatus,
    warranty: parsed.warranty || null,
    featured: Boolean(parsed.featured),
    published: Boolean(parsed.published),
    updatedAt: new Date(),
  } as const;

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set(newValues)
      .where(eq(products.id, parsed.productId));

    if (current.categoryId !== categoryId) {
      await tx
        .delete(productSpecificationValues)
        .where(eq(productSpecificationValues.productId, parsed.productId));
    }

    await tx.insert(productChangeEvents).values({
      productId: parsed.productId,
      eventType: "PRODUCT_UPDATED",
      oldValues: {
        name: current.name,
        sku: current.sku,
        stockQuantity: current.stockQuantity,
        stockStatus: current.stockStatus,
        published: current.published,
      },
      newValues: {
        name: parsed.name,
        sku: parsed.sku,
        stockQuantity: parsed.stockQuantity,
        stockStatus: parsed.stockStatus,
        published: Boolean(parsed.published),
      },
      createdByProfileId: actor.id,
    });

    await tx.insert(auditLogs).values({
      actorProfileId: actor.id,
      action: "PRODUCT_UPDATED",
      entityType: "product",
      entityId: parsed.productId,
      previousValues: {
        name: current.name,
        sku: current.sku,
        stockStatus: current.stockStatus,
      },
      newValues: {
        name: parsed.name,
        sku: parsed.sku,
        stockStatus: parsed.stockStatus,
      },
    });
  });

  if (Number(current.sellingPrice) !== parsed.sellingPrice) {
    await updateProductPrice({
      productId: parsed.productId,
      newSellingPrice: parsed.sellingPrice.toFixed(2),
      reason: "Product details updated from admin.",
    });
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/offers");
  revalidatePath("/admin/catalog/products");
  revalidatePath(`/admin/catalog/products/${parsed.productId}`);
  revalidatePath(`/products/${current.slug}`);
  redirect(`/admin/catalog/products/${parsed.productId}?saved=1`);
}

export async function updateProductSpecifications(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const productId = z.string().uuid().parse(formData.get("productId"));

  if (hasDatabaseUrl) {
    const db = getDb();
    const [product] = await db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) throw new Error("Product not found.");

    const definitions = await db
      .select({ id: specificationDefinitions.id })
      .from(specificationDefinitions)
      .where(eq(specificationDefinitions.categoryId, product.categoryId));
    const values = definitions
      .map((definition) => ({
        specificationDefinitionId: definition.id,
        value: String(formData.get(`spec:${definition.id}`) ?? "").trim(),
      }))
      .filter((item) => item.value.length > 0);

    await db.transaction(async (tx) => {
      await tx
        .delete(productSpecificationValues)
        .where(eq(productSpecificationValues.productId, productId));

      if (values.length > 0) {
        await tx.insert(productSpecificationValues).values(
          values.map((value) => ({
            productId,
            specificationDefinitionId: value.specificationDefinitionId,
            value: value.value,
            normalizedValue: value.value.toLowerCase(),
          })),
        );
      }

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "PRODUCT_SPECIFICATIONS_UPDATED",
        entityType: "product",
        entityId: productId,
        newValues: { values: values.length },
      });
    });
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath(`/admin/catalog/products/${productId}`);
}

export async function archiveProduct(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const productId = z.string().uuid().parse(formData.get("productId"));

  if (hasDatabaseUrl) {
    await getDb().transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          published: false,
          featured: false,
          stockStatus: "OUT_OF_STOCK",
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "PRODUCT_ARCHIVED",
        entityType: "product",
        entityId: productId,
      });
    });
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/offers");
  revalidatePath("/admin/catalog/products");
  redirect("/admin/catalog/products?archived=1");
}

export async function registerProductImage(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = productImageSchema.parse({
    productId: formData.get("productId"),
    storagePath: formData.get("storagePath"),
    altText: formData.get("altText"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [total] = await db
      .select({ total: count(productImages.id) })
      .from(productImages)
      .where(eq(productImages.productId, parsed.productId));

    if (Number(total?.total ?? 0) >= 8) {
      throw new Error("A product can have up to 8 images.");
    }

    const isExternal = /^https?:\/\//i.test(parsed.storagePath);
    if (!isExternal && !parsed.storagePath.startsWith(`${parsed.productId}/`)) {
      throw new Error("Invalid product image path.");
    }

    await db.insert(productImages).values({
      productId: parsed.productId,
      storagePath: parsed.storagePath,
      altText: parsed.altText,
      displayOrder: Number(total?.total ?? 0),
      isPrimary: Number(total?.total ?? 0) === 0,
    });
  }

  revalidatePath("/");
  revalidatePath(`/admin/catalog/products/${parsed.productId}`);
}

export async function setPrimaryProductImage(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = productImageMutationSchema.parse({
    productId: formData.get("productId"),
    imageId: formData.get("imageId"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, parsed.productId));
      await tx
        .update(productImages)
        .set({ isPrimary: true })
        .where(
          and(
            eq(productImages.id, parsed.imageId),
            eq(productImages.productId, parsed.productId),
          ),
        );
    });
  }

  revalidatePath("/");
  revalidatePath(`/admin/catalog/products/${parsed.productId}`);
}

export async function removeProductImage(formData: FormData) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = productImageMutationSchema.parse({
    productId: formData.get("productId"),
    imageId: formData.get("imageId"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [image] = await db
      .select({
        storagePath: productImages.storagePath,
        isPrimary: productImages.isPrimary,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.id, parsed.imageId),
          eq(productImages.productId, parsed.productId),
        ),
      )
      .limit(1);

    if (!image) throw new Error("Product image not found.");

    await db.transaction(async (tx) => {
      await tx
        .delete(productImages)
        .where(eq(productImages.id, parsed.imageId));

      if (image.isPrimary) {
        const [nextImage] = await tx
          .select({ id: productImages.id })
          .from(productImages)
          .where(eq(productImages.productId, parsed.productId))
          .orderBy(productImages.displayOrder, productImages.createdAt)
          .limit(1);

        if (nextImage) {
          await tx
            .update(productImages)
            .set({ isPrimary: true })
            .where(eq(productImages.id, nextImage.id));
        }
      }
    });

    if (!/^https?:\/\//i.test(image.storagePath)) {
      const supabase = await createSupabaseServerClient();
      await supabase?.storage.from("product-images").remove([image.storagePath]);
    }
  }

  revalidatePath("/");
  revalidatePath(`/admin/catalog/products/${parsed.productId}`);
}

export async function updateProductPriceFromAdmin(formData: FormData) {
  const parsed = productPriceUpdateSchema.parse({
    productId: formData.get("productId"),
    sellingPrice: formData.get("sellingPrice"),
    reason: formData.get("reason"),
  });

  await updateProductPrice({
    productId: parsed.productId,
    newSellingPrice: parsed.sellingPrice.toFixed(2),
    reason: parsed.reason || "Admin product price update.",
  });

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/offers");
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
  revalidatePath(`/admin/crm/leads/${parsed.leadId}`);
}

export async function addLeadNote(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = leadNoteSchema.parse({
    leadId: formData.get("leadId"),
    note: formData.get("note"),
    dealerVisible: formData.get("dealerVisible") === "on",
  });

  if (hasDatabaseUrl) {
    await getDb().insert(leadNotes).values({
      leadId: parsed.leadId,
      authorProfileId: actor.id,
      note: parsed.note,
      dealerVisible: Boolean(parsed.dealerVisible),
    });
  }

  revalidatePath(`/admin/crm/leads/${parsed.leadId}`);
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
  revalidatePath(`/admin/crm/leads/${parsed.leadId}`);
}

export async function recordSale(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const parsed = saleSchema.parse({
    leadId: formData.get("leadId"),
    productId: formData.get("productId"),
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

    if (lead.status !== "WON") {
      throw new Error("Mark the lead as won before recording a sale.");
    }

    const [existingSale] = await db
      .select({ id: sales.id })
      .from(sales)
      .where(eq(sales.leadId, parsed.leadId))
      .limit(1);

    if (existingSale) {
      throw new Error("A sale has already been recorded for this lead.");
    }

    const [product] = await db
      .select({ name: products.name, sku: products.sku })
      .from(products)
      .where(eq(products.id, parsed.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found.");
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
        productId: parsed.productId,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
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

    await createCommissionForWonSale({
      leadId: parsed.leadId,
      saleId: sale.id,
    });
  }

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/crm/leads/${parsed.leadId}`);
  redirect("/admin/sales?recorded=1");
}

export async function updateCommission(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = commissionUpdateSchema.parse({
    commissionId: formData.get("commissionId"),
    finalAmount: formData.get("finalAmount"),
    status: formData.get("status"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [commission] = await db
      .select({ status: commissions.status, finalAmount: commissions.finalAmount })
      .from(commissions)
      .where(eq(commissions.id, parsed.commissionId))
      .limit(1);

    if (!commission) throw new Error("Commission not found.");
    if (commission.status === "PAID") {
      throw new Error("Paid commissions cannot be changed.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(commissions)
        .set({
          finalAmount: parsed.finalAmount.toFixed(2),
          status: parsed.status,
          approvedAt: parsed.status === "APPROVED" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(commissions.id, parsed.commissionId));

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "COMMISSION_UPDATED",
        entityType: "commission",
        entityId: parsed.commissionId,
        previousValues: commission,
        newValues: {
          finalAmount: parsed.finalAmount,
          status: parsed.status,
        },
      });
    });
  }

  revalidatePath("/admin/sales");
  revalidatePath("/dealer");
  revalidatePath("/dealer/commissions");
}

export async function recordCommissionPayout(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const parsed = commissionPayoutSchema.parse({
    commissionId: formData.get("commissionId"),
    paymentReference: formData.get("paymentReference"),
    notes: formData.get("notes"),
  });

  if (hasDatabaseUrl) {
    const db = getDb();
    const [commission] = await db
      .select({
        dealerId: commissions.dealerId,
        finalAmount: commissions.finalAmount,
        status: commissions.status,
      })
      .from(commissions)
      .where(eq(commissions.id, parsed.commissionId))
      .limit(1);

    if (!commission) throw new Error("Commission not found.");
    if (commission.status !== "APPROVED") {
      throw new Error("Approve the commission before recording payment.");
    }

    await db.transaction(async (tx) => {
      const paidAt = new Date();
      const [payout] = await tx
        .insert(commissionPayouts)
        .values({
          dealerId: commission.dealerId,
          amount: commission.finalAmount,
          paymentReference: parsed.paymentReference,
          paidAt,
          notes: parsed.notes || null,
        })
        .returning({ id: commissionPayouts.id });

      await tx
        .update(commissions)
        .set({ status: "PAID", paidAt, updatedAt: paidAt })
        .where(eq(commissions.id, parsed.commissionId));

      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "COMMISSION_PAID",
        entityType: "commission",
        entityId: parsed.commissionId,
        newValues: {
          payoutId: payout.id,
          amount: commission.finalAmount,
          paymentReference: parsed.paymentReference,
        },
      });
    });
  }

  revalidatePath("/admin/sales");
  revalidatePath("/dealer");
  revalidatePath("/dealer/commissions");
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
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    defaultAttributionDays: formData.get("defaultAttributionDays"),
    footerText: formData.get("footerText"),
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
