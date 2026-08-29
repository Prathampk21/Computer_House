import "server-only";

import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { getDb } from "@/db";
import {
  brands,
  categories,
  leadItems,
  offers,
  productImages,
  productOffers,
  productSpecificationValues,
  productViews,
  products,
  specificationDefinitions,
} from "@/db/schema";
import {
  brands as demoBrands,
  categories as demoCategories,
  demoProducts,
  type DemoProduct,
} from "@/features/catalog/demo-data";
import { hasDatabaseUrl } from "@/lib/env";

export type CatalogProduct = DemoProduct;

export type CatalogFilters = {
  q?: string;
  category?: string;
  brand?: string;
  condition?: string;
  sort?: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string | null;
  condition: CatalogProduct["condition"];
  conditionGrade: string | null;
  regularPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  stockStatus: CatalogProduct["stockStatus"];
  warranty: string | null;
  featured: boolean;
  shortDescription: string;
  detailedDescription: string | null;
  image: string | null;
  createdAt: Date;
};

function imageUrl(path: string | null) {
  if (!path) {
    return demoProducts[0]?.image ?? "/file.svg";
  }

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return path;
  }

  const cleanPath = path.replace(/^product-images\//, "");
  return `${supabaseUrl}/storage/v1/object/public/product-images/${cleanPath}`;
}

function applyFilters(productsList: CatalogProduct[], filters: CatalogFilters) {
  const query = filters.q?.toLowerCase().trim();

  const filtered = productsList.filter((product) => {
    const haystack = [
      product.name,
      product.sku,
      product.brand,
      product.category,
      product.subcategory,
      product.shortDescription,
      product.condition,
      ...product.specs.map((spec) => `${spec.label} ${spec.value}`),
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.brand || product.brand === filters.brand) &&
      (!filters.condition || product.condition === filters.condition)
    );
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === "price-asc") return a.sellingPrice - b.sellingPrice;
    if (filters.sort === "price-desc") return b.sellingPrice - a.sellingPrice;
    if (filters.sort === "popularity") return b.views - a.views;
    return Number(b.newArrival) - Number(a.newArrival);
  });
}

async function productStats(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      views: new Map<string, number>(),
      enquiries: new Map<string, number>(),
    };
  }

  const db = getDb();
  const [viewRows, enquiryRows] = await Promise.all([
    db
      .select({
        productId: productViews.productId,
        total: count(productViews.id),
      })
      .from(productViews)
      .where(inArray(productViews.productId, productIds))
      .groupBy(productViews.productId),
    db
      .select({
        productId: leadItems.productId,
        total: count(leadItems.id),
      })
      .from(leadItems)
      .where(inArray(leadItems.productId, productIds))
      .groupBy(leadItems.productId),
  ]);

  return {
    views: new Map(
      viewRows
        .filter((row) => row.productId)
        .map((row) => [row.productId!, Number(row.total)]),
    ),
    enquiries: new Map(
      enquiryRows
        .filter((row) => row.productId)
        .map((row) => [row.productId!, Number(row.total)]),
    ),
  };
}

async function productSpecs(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, CatalogProduct["specs"]>();
  }

  const rows = await getDb()
    .select({
      productId: productSpecificationValues.productId,
      key: specificationDefinitions.key,
      label: specificationDefinitions.label,
      value: productSpecificationValues.value,
      filterable: specificationDefinitions.filterable,
      comparable: specificationDefinitions.comparable,
      displayOrder: specificationDefinitions.displayOrder,
    })
    .from(productSpecificationValues)
    .innerJoin(
      specificationDefinitions,
      eq(
        productSpecificationValues.specificationDefinitionId,
        specificationDefinitions.id,
      ),
    )
    .where(inArray(productSpecificationValues.productId, productIds))
    .orderBy(specificationDefinitions.displayOrder);

  const specsByProduct = new Map<string, CatalogProduct["specs"]>();

  for (const row of rows) {
    const specs = specsByProduct.get(row.productId) ?? [];
    specs.push({
      key: row.key,
      label: row.label,
      value: row.value,
      filterable: row.filterable,
      comparable: row.comparable,
    });
    specsByProduct.set(row.productId, specs);
  }

  return specsByProduct;
}

async function activeOffers(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, string>();
  }

  const now = new Date();
  const rows = await getDb()
    .select({
      productId: productOffers.productId,
      title: offers.title,
      bannerText: offers.bannerText,
    })
    .from(productOffers)
    .innerJoin(offers, eq(productOffers.offerId, offers.id))
    .where(
      and(
        inArray(productOffers.productId, productIds),
        eq(offers.active, true),
        lte(offers.startsAt, now),
        gte(offers.endsAt, now),
      ),
    );

  return new Map(
    rows.map((row) => [row.productId, row.bannerText || row.title]),
  );
}

async function dbProductRows() {
  const rows = await getDb()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      category: categories.name,
      brand: brands.name,
      condition: products.condition,
      conditionGrade: products.conditionGrade,
      regularPrice: products.regularPrice,
      sellingPrice: products.sellingPrice,
      stockQuantity: products.stockQuantity,
      stockStatus: products.stockStatus,
      warranty: products.warranty,
      featured: products.featured,
      shortDescription: products.shortDescription,
      detailedDescription: products.detailedDescription,
      image: productImages.storagePath,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(eq(products.published, true))
    .orderBy(desc(products.createdAt));

  const byProduct = new Map<string, ProductRow>();

  for (const row of rows) {
    if (!byProduct.has(row.id)) {
      byProduct.set(row.id, row);
    }
  }

  return [...byProduct.values()];
}

async function mapDbProducts(rows: ProductRow[]): Promise<CatalogProduct[]> {
  const productIds = rows.map((row) => row.id);
  const [specsByProduct, offersByProduct, stats] = await Promise.all([
    productSpecs(productIds),
    activeOffers(productIds),
    productStats(productIds),
  ]);
  const newArrivalDate = new Date();
  newArrivalDate.setDate(newArrivalDate.getDate() - 30);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    category: row.category,
    subcategory: row.category,
    brand: row.brand ?? "Other",
    condition: row.condition,
    conditionGrade: row.conditionGrade ?? undefined,
    regularPrice: Number(row.regularPrice),
    sellingPrice: Number(row.sellingPrice),
    stockQuantity: row.stockQuantity,
    stockStatus: row.stockStatus,
    warranty: row.warranty ?? "Shop warranty as applicable",
    featured: row.featured,
    newArrival: row.createdAt >= newArrivalDate,
    offerText: offersByProduct.get(row.id),
    shortDescription: row.shortDescription,
    detailedDescription: row.detailedDescription ?? row.shortDescription,
    image: imageUrl(row.image),
    specs: specsByProduct.get(row.id) ?? [],
    views: stats.views.get(row.id) ?? 0,
    enquiries: stats.enquiries.get(row.id) ?? 0,
  }));
}

export async function listCatalogOptions() {
  if (!hasDatabaseUrl) {
    return { categories: demoCategories, brands: demoBrands };
  }

  const [categoryRows, brandRows] = await Promise.all([
    getDb()
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.displayOrder, categories.name),
    getDb()
      .select({ name: brands.name })
      .from(brands)
      .where(eq(brands.active, true))
      .orderBy(brands.name),
  ]).catch(() => [[], []] as const);

  return {
    categories: categoryRows.map((row) => row.name),
    brands: brandRows.map((row) => row.name),
  };
}

export async function listCatalogProducts(filters: CatalogFilters = {}) {
  if (!hasDatabaseUrl) {
    return applyFilters(demoProducts, filters);
  }

  try {
    const productsList = await mapDbProducts(await dbProductRows());
    return applyFilters(productsList, filters);
  } catch {
    return applyFilters(demoProducts, filters);
  }
}

export async function listFeaturedProducts() {
  const productsList = await listCatalogProducts();
  return productsList.filter((product) => product.featured);
}

export async function getCatalogProductBySlug(slug: string) {
  if (!hasDatabaseUrl) {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }

  const productsList = await mapDbProducts(
    (await dbProductRows()).filter((product) => product.slug === slug),
  ).catch(() => []);

  return productsList[0] ?? null;
}

export async function getCatalogProductsBySlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs)).slice(0, 4);

  if (!hasDatabaseUrl) {
    return uniqueSlugs
      .map((slug) => demoProducts.find((product) => product.slug === slug))
      .filter((product): product is CatalogProduct => Boolean(product));
  }

  const rows = await dbProductRows()
    .then((products) =>
      products.filter((product) => uniqueSlugs.includes(product.slug)),
    )
    .catch(() => []);
  const productsList = await mapDbProducts(rows).catch(() => []);

  return uniqueSlugs
    .map((slug) => productsList.find((product) => product.slug === slug))
    .filter((product): product is CatalogProduct => Boolean(product));
}

export async function getRelatedCatalogProducts(product: CatalogProduct) {
  const productsList = await listCatalogProducts({ category: product.category });
  return productsList
    .filter((candidate) => candidate.slug !== product.slug)
    .slice(0, 3);
}

export async function getDefaultCatalogProduct() {
  const productsList = await listCatalogProducts();
  return productsList[0] ?? demoProducts[0] ?? null;
}

export async function listOfferProducts() {
  const productsList = await listCatalogProducts();
  return productsList.filter((product) => product.offerText);
}
