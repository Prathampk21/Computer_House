import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import {
  brands,
  categories,
  dealers,
  featureFlags,
  productImages,
  productSpecificationValues,
  products,
  shopSettings,
  specificationDefinitions,
} from "../src/db/schema";
import { demoDealers, demoProducts } from "../src/features/catalog/demo-data";
import {
  defaultFeatureFlags,
  defaultShopSettings,
} from "../src/lib/shop-config";
import { slugify } from "../src/lib/utils";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  await db
    .insert(shopSettings)
    .values({
      key: "business",
      value: defaultShopSettings,
      description: "Default Computer House business settings.",
    })
    .onConflictDoNothing();

  await db
    .insert(featureFlags)
    .values(
      Object.entries(defaultFeatureFlags).map(([key, enabled]) => ({
        key,
        enabled,
        description: `Feature flag for ${key}.`,
      })),
    )
    .onConflictDoNothing();

  const categoryRows = await db
    .insert(categories)
    .values(
      Array.from(new Set(demoProducts.map((product) => product.category))).map(
        (name, index) => ({
          name,
          slug: slugify(name),
          displayOrder: index,
        }),
      ),
    )
    .onConflictDoNothing()
    .returning();

  const brandRows = await db
    .insert(brands)
    .values(
      Array.from(new Set(demoProducts.map((product) => product.brand))).map(
        (name) => ({
          name,
          slug: slugify(name),
        }),
      ),
    )
    .onConflictDoNothing()
    .returning();

  await db
    .insert(dealers)
    .values(
      demoDealers.map((dealer) => ({
        businessName: dealer.businessName,
        contactName: dealer.contactName,
        referralCode: dealer.referralCode,
        mobile: dealer.mobile,
        active: dealer.active,
        defaultCommissionValue: String(dealer.commissionRate),
      })),
    )
    .onConflictDoNothing();

  for (const product of demoProducts) {
    const category =
      categoryRows.find((row) => row.name === product.category) ??
      (
        await db
          .select()
          .from(categories)
          .where(eq(categories.slug, slugify(product.category)))
          .limit(1)
      )[0];
    const brand =
      brandRows.find((row) => row.name === product.brand) ??
      (
        await db
          .select()
          .from(brands)
          .where(eq(brands.slug, slugify(product.brand)))
          .limit(1)
      )[0];

    if (!category || !brand) {
      throw new Error(`Missing category or brand for ${product.name}.`);
    }

    const [createdProduct] = await db
      .insert(products)
      .values({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: category.id,
        brandId: brand.id,
        shortDescription: product.shortDescription,
        detailedDescription: product.detailedDescription,
        condition: product.condition,
        conditionGrade: product.conditionGrade,
        regularPrice: String(product.regularPrice),
        sellingPrice: String(product.sellingPrice),
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        warranty: product.warranty,
        featured: product.featured,
        published: true,
      })
      .onConflictDoNothing()
      .returning();

    const productId =
      createdProduct?.id ??
      (
        await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.slug, product.slug))
          .limit(1)
      )[0]?.id;

    if (!productId) {
      continue;
    }

    await db
      .insert(productImages)
      .values({
        productId,
        storagePath: product.image,
        altText: product.name,
        displayOrder: 0,
        isPrimary: true,
      })
      .onConflictDoNothing();

    for (const [index, spec] of product.specs.entries()) {
      const [definition] = await db
        .insert(specificationDefinitions)
        .values({
          categoryId: category.id,
          key: spec.key,
          label: spec.label,
          dataType: "TEXT",
          displayOrder: index,
          filterable: Boolean(spec.filterable),
          comparable: spec.comparable ?? true,
        })
        .onConflictDoNothing()
        .returning();

      const definitionId =
        definition?.id ??
        (
          await db
            .select({ id: specificationDefinitions.id })
            .from(specificationDefinitions)
            .where(
              and(
                eq(specificationDefinitions.categoryId, category.id),
                eq(specificationDefinitions.key, spec.key),
              ),
            )
            .limit(1)
        )[0]?.id;

      if (!definitionId) {
        continue;
      }

      await db
        .insert(productSpecificationValues)
        .values({
          productId,
          specificationDefinitionId: definitionId,
          value: spec.value,
          normalizedValue: spec.value.toLowerCase(),
        })
        .onConflictDoNothing();
    }
  }
}

main()
  .then(async () => {
    await client.end();
    console.log("Seed data created.");
  })
  .catch(async (error) => {
    await client.end();
    console.error(error);
    process.exit(1);
  });
