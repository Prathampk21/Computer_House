import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  brands,
  categories,
  commissions,
  commissionPayouts,
  customerSubscriptions,
  customers,
  dealers,
  leadItems,
  leadNotes,
  leadStatusHistory,
  leads,
  notificationJobs,
  productChangeEvents,
  productImages,
  productSpecificationValues,
  products,
  profiles,
  referralClicks,
  sales,
  specificationDefinitions,
} from "@/db/schema";
import { adminMetrics as demoAdminMetrics } from "@/features/analytics/demo";
import {
  demoLeadRows,
  demoNotificationJobs,
  demoSubscriptions,
} from "@/features/admin/demo";
import {
  brands as demoBrands,
  categories as demoCategories,
  demoDealers,
  demoProducts,
} from "@/features/catalog/demo-data";
import { hasDatabaseUrl } from "@/lib/env";
import { formatCurrency, slugify } from "@/lib/utils";

export type AdminLeadRow = {
  id: string;
  leadNumber: string;
  customer: string;
  mobile: string;
  product: string;
  dealer: string;
  source: string;
  status: string;
  amount: string | number;
  createdAt?: Date;
  saleRecorded?: boolean;
};

export type AdminSaleRow = {
  id: string;
  leadNumber: string;
  customer: string;
  dealer: string;
  amount: string;
  invoiceReference: string | null;
  saleDate: Date;
};

export type AdminCommissionRow = {
  id: string;
  leadNumber: string;
  dealer: string;
  baseSaleAmount: string;
  commissionValue: string;
  finalAmount: string;
  status: string;
  createdAt: Date;
};

export type AdminPayoutRow = {
  id: string;
  dealer: string;
  amount: string;
  paymentReference: string | null;
  paidAt: Date | null;
};

export type AdminLeadDetail = {
  id: string;
  leadNumber: string;
  status: string;
  source: string;
  message: string | null;
  createdAt: Date;
  customer: {
    name: string;
    mobile: string;
    email: string | null;
  };
  dealer: {
    id: string;
    businessName: string;
  } | null;
  items: Array<{
    id: string;
    productId: string | null;
    productName: string;
    sku: string;
    price: string;
    quantity: number;
  }>;
  history: Array<{
    id: string;
    previousStatus: string | null;
    newStatus: string;
    note: string | null;
    changedBy: string | null;
    createdAt: Date;
  }>;
  notes: Array<{
    id: string;
    note: string;
    dealerVisible: boolean;
    author: string | null;
    createdAt: Date;
  }>;
};

export type AdminDealerRow = {
  id: string;
  businessName: string;
  contactName: string;
  referralCode: string;
  mobile: string;
  email: string | null;
  active: boolean;
  commissionValue: string | number | null;
  hasLogin: boolean;
};

export type AdminDealerDetail = AdminDealerRow & {
  referralClicks: number;
  leads: number;
  commissions: number;
};

export type AdminSimpleRow = {
  id: string;
  name: string;
  slug: string;
  active?: boolean;
};

export type AdminSpecRow = {
  id: string;
  category: string;
  key: string;
  label: string;
  filterable: boolean;
};

export type AdminSubscriptionRow = {
  id: string;
  contact: string;
  target: string;
  events: string;
  consent: string;
};

export type AdminNotificationJobRow = {
  id: string;
  recipient: string;
  channel: string;
  event: string;
  status: string;
  attempts: number;
  errorMessage: string | null;
  createdAt: Date;
  sentAt: Date | null;
  failedAt: Date | null;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  condition: string;
  regularPrice: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  stockStatus: string;
  featured: boolean;
  published: boolean;
  image: string | null;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  brandId: string | null;
  brandName: string | null;
  shortDescription: string;
  detailedDescription: string | null;
  condition: "NEW" | "USED" | "REFURBISHED";
  conditionGrade: string | null;
  regularPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  stockStatus:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "SOLD"
    | "COMING_SOON";
  warranty: string | null;
  featured: boolean;
  published: boolean;
  images: Array<{
    id: string;
    storagePath: string;
    altText: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  specifications: Array<{
    id: string;
    key: string;
    label: string;
    unit: string | null;
    required: boolean;
    value: string;
  }>;
};

function firstTotal(rows: Array<{ total: number | string }>) {
  return Number(rows[0]?.total ?? 0);
}

async function commissionTotal(status: "PENDING" | "APPROVED" | "PAID") {
  const [row] = await getDb()
    .select({
      total: sql<string>`coalesce(sum(${commissions.finalAmount}), 0)`,
    })
    .from(commissions)
    .where(eq(commissions.status, status));

  return Number(row?.total ?? 0);
}

export async function getAdminDashboardMetrics() {
  if (!hasDatabaseUrl) {
    return demoAdminMetrics;
  }

  const db = getDb();
  const [
    totalProducts,
    inStock,
    lowStock,
    outOfStock,
    customerCount,
    dealerCount,
    activeDealerCount,
    clickCount,
    leadCount,
    saleCount,
    pendingCommission,
    approvedCommission,
    paidCommission,
  ] = await Promise.all([
    db.select({ total: count(products.id) }).from(products),
    db
      .select({ total: count(products.id) })
      .from(products)
      .where(eq(products.stockStatus, "IN_STOCK")),
    db
      .select({ total: count(products.id) })
      .from(products)
      .where(eq(products.stockStatus, "LOW_STOCK")),
    db
      .select({ total: count(products.id) })
      .from(products)
      .where(eq(products.stockStatus, "OUT_OF_STOCK")),
    db.select({ total: count(customers.id) }).from(customers),
    db.select({ total: count(dealers.id) }).from(dealers),
    db
      .select({ total: count(dealers.id) })
      .from(dealers)
      .where(eq(dealers.active, true)),
    db.select({ total: count(referralClicks.id) }).from(referralClicks),
    db.select({ total: count(leads.id) }).from(leads),
    db.select({ total: count(sales.id) }).from(sales),
    commissionTotal("PENDING"),
    commissionTotal("APPROVED"),
    commissionTotal("PAID"),
  ]);

  const productTotal = firstTotal(totalProducts);
  const inStockTotal = firstTotal(inStock);
  const leadsTotal = firstTotal(leadCount);
  const salesTotal = firstTotal(saleCount);
  const clicksTotal = firstTotal(clickCount);

  return [
    {
      label: "Total Products",
      value: String(productTotal),
      delta: "Live catalogue",
    },
    {
      label: "In Stock",
      value: String(inStockTotal),
      delta: productTotal
        ? `${Math.round((inStockTotal / productTotal) * 100)}% catalogue`
        : "No products",
    },
    {
      label: "Low Stock",
      value: String(firstTotal(lowStock)),
      delta: "Needs attention",
    },
    {
      label: "Out of Stock",
      value: String(firstTotal(outOfStock)),
      delta: "Restock queue",
    },
    {
      label: "Customers",
      value: String(firstTotal(customerCount)),
      delta: "Captured contacts",
    },
    {
      label: "Dealers",
      value: String(firstTotal(dealerCount)),
      delta: `${firstTotal(activeDealerCount)} active`,
    },
    {
      label: "Referral Clicks",
      value: String(clicksTotal),
      delta: "Clicks only",
    },
    {
      label: "Qualified Leads",
      value: String(leadsTotal),
      delta: clicksTotal
        ? `${((leadsTotal / clicksTotal) * 100).toFixed(1)}% click-to-lead`
        : "Lead pipeline",
    },
    {
      label: "Sales",
      value: String(salesTotal),
      delta: leadsTotal
        ? `${((salesTotal / leadsTotal) * 100).toFixed(1)}% lead win`
        : "Verified sales",
    },
    {
      label: "Pending Commission",
      value: formatCurrency(pendingCommission),
      delta: "Approval needed",
    },
    {
      label: "Approved Commission",
      value: formatCurrency(approvedCommission),
      delta: "Ready payout",
    },
    {
      label: "Paid Commission",
      value: formatCurrency(paidCommission),
      delta: "Closed payouts",
    },
  ];
}

export async function listAdminLeads(limit = 50): Promise<AdminLeadRow[]> {
  if (!hasDatabaseUrl) {
    return demoLeadRows.slice(0, limit);
  }

  const rows = await getDb()
    .select({
      id: leads.id,
      leadNumber: leads.leadNumber,
      customer: customers.name,
      mobile: customers.mobile,
      product: leadItems.productNameSnapshot,
      dealer: dealers.businessName,
      source: leads.source,
      status: leads.status,
      amount: leadItems.sellingPriceSnapshot,
      saleId: sales.id,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(dealers, eq(leads.dealerId, dealers.id))
    .leftJoin(leadItems, eq(leads.id, leadItems.leadId))
    .leftJoin(sales, eq(leads.id, sales.leadId))
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  const byLead = new Map<string, AdminLeadRow>();

  for (const row of rows) {
    if (!byLead.has(row.id)) {
      byLead.set(row.id, {
        id: row.id,
        leadNumber: row.leadNumber,
        customer: row.customer,
        mobile: row.mobile,
        product: row.product ?? "Multiple products",
        dealer: row.dealer ?? "Direct",
        source: row.source,
        status: row.status,
        amount: row.amount ?? 0,
        createdAt: row.createdAt,
        saleRecorded: Boolean(row.saleId),
      });
    }
  }

  return [...byLead.values()];
}

export async function getAdminLeadById(
  leadId: string,
): Promise<AdminLeadDetail | null> {
  if (!hasDatabaseUrl) {
    const lead = demoLeadRows.find((item) => item.id === leadId);

    if (!lead) return null;

    return {
      id: lead.id,
      leadNumber: lead.leadNumber,
      status: lead.status,
      source: lead.source,
      message: null,
      createdAt: new Date(),
      customer: { name: lead.customer, mobile: lead.mobile, email: null },
      dealer: lead.dealer === "Direct" ? null : { id: "dealer_a", businessName: lead.dealer },
      items: [
        {
          id: `${lead.id}-item`,
          productId: null,
          productName: lead.product,
          sku: "DEMO",
          price: String(lead.amount),
          quantity: 1,
        },
      ],
      history: [],
      notes: [],
    };
  }

  const db = getDb();
  const [lead] = await db
    .select({
      id: leads.id,
      leadNumber: leads.leadNumber,
      status: leads.status,
      source: leads.source,
      message: leads.message,
      createdAt: leads.createdAt,
      customerName: customers.name,
      customerMobile: customers.mobile,
      customerEmail: customers.email,
      dealerId: dealers.id,
      dealerName: dealers.businessName,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(dealers, eq(leads.dealerId, dealers.id))
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead) return null;

  const [items, historyRows, noteRows] = await Promise.all([
    db
      .select({
        id: leadItems.id,
        productId: leadItems.productId,
        productName: leadItems.productNameSnapshot,
        sku: leadItems.skuSnapshot,
        price: leadItems.sellingPriceSnapshot,
        quantity: leadItems.quantity,
      })
      .from(leadItems)
      .where(eq(leadItems.leadId, leadId)),
    db
      .select({
        id: leadStatusHistory.id,
        previousStatus: leadStatusHistory.previousStatus,
        newStatus: leadStatusHistory.newStatus,
        note: leadStatusHistory.note,
        changedBy: profiles.fullName,
        createdAt: leadStatusHistory.createdAt,
      })
      .from(leadStatusHistory)
      .leftJoin(profiles, eq(leadStatusHistory.changedByProfileId, profiles.id))
      .where(eq(leadStatusHistory.leadId, leadId))
      .orderBy(desc(leadStatusHistory.createdAt)),
    db
      .select({
        id: leadNotes.id,
        note: leadNotes.note,
        dealerVisible: leadNotes.dealerVisible,
        author: profiles.fullName,
        createdAt: leadNotes.createdAt,
      })
      .from(leadNotes)
      .leftJoin(profiles, eq(leadNotes.authorProfileId, profiles.id))
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt)),
  ]);

  return {
    id: lead.id,
    leadNumber: lead.leadNumber,
    status: lead.status,
    source: lead.source,
    message: lead.message,
    createdAt: lead.createdAt,
    customer: {
      name: lead.customerName,
      mobile: lead.customerMobile,
      email: lead.customerEmail,
    },
    dealer:
      lead.dealerId && lead.dealerName
        ? { id: lead.dealerId, businessName: lead.dealerName }
        : null,
    items,
    history: historyRows,
    notes: noteRows,
  };
}

export async function listWonAdminLeads() {
  return (await listAdminLeads(100)).filter(
    (lead) => lead.status === "WON" && !lead.saleRecorded,
  );
}

export async function listAdminSales(): Promise<AdminSaleRow[]> {
  if (!hasDatabaseUrl) return [];

  return getDb()
    .select({
      id: sales.id,
      leadNumber: leads.leadNumber,
      customer: customers.name,
      dealer: dealers.businessName,
      amount: sales.saleAmount,
      invoiceReference: sales.invoiceReference,
      saleDate: sales.saleDate,
    })
    .from(sales)
    .innerJoin(leads, eq(sales.leadId, leads.id))
    .innerJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(dealers, eq(sales.dealerId, dealers.id))
    .orderBy(desc(sales.saleDate))
    .then((rows) =>
      rows.map((row) => ({ ...row, dealer: row.dealer ?? "Direct" })),
    );
}

export async function listAdminCommissions(): Promise<AdminCommissionRow[]> {
  if (!hasDatabaseUrl) return [];

  return getDb()
    .select({
      id: commissions.id,
      leadNumber: leads.leadNumber,
      dealer: dealers.businessName,
      baseSaleAmount: commissions.baseSaleAmount,
      commissionValue: commissions.commissionValue,
      finalAmount: commissions.finalAmount,
      status: commissions.status,
      createdAt: commissions.createdAt,
    })
    .from(commissions)
    .innerJoin(leads, eq(commissions.leadId, leads.id))
    .innerJoin(dealers, eq(commissions.dealerId, dealers.id))
    .orderBy(desc(commissions.createdAt));
}

export async function listAdminPayouts(): Promise<AdminPayoutRow[]> {
  if (!hasDatabaseUrl) return [];

  return getDb()
    .select({
      id: commissionPayouts.id,
      dealer: dealers.businessName,
      amount: commissionPayouts.amount,
      paymentReference: commissionPayouts.paymentReference,
      paidAt: commissionPayouts.paidAt,
    })
    .from(commissionPayouts)
    .innerJoin(dealers, eq(commissionPayouts.dealerId, dealers.id))
    .orderBy(desc(commissionPayouts.createdAt));
}

export async function listAdminDealers(): Promise<AdminDealerRow[]> {
  if (!hasDatabaseUrl) {
    return demoDealers.map((dealer) => ({
      id: dealer.id,
      businessName: dealer.businessName,
      contactName: dealer.contactName,
      referralCode: dealer.referralCode,
      mobile: dealer.mobile,
      email: null,
      active: dealer.active,
      commissionValue: dealer.commissionRate,
      hasLogin: true,
    }));
  }

  const rows = await getDb()
    .select({
      id: dealers.id,
      businessName: dealers.businessName,
      contactName: dealers.contactName,
      referralCode: dealers.referralCode,
      mobile: dealers.mobile,
      email: dealers.email,
      active: dealers.active,
      commissionValue: dealers.defaultCommissionValue,
      profileId: profiles.id,
    })
    .from(dealers)
    .leftJoin(profiles, eq(dealers.profileId, profiles.id))
    .orderBy(desc(dealers.createdAt));

  return rows.map(({ profileId, ...dealer }) => ({
    ...dealer,
    hasLogin: Boolean(profileId),
  }));
}

export async function getAdminDealerById(
  dealerId: string,
): Promise<AdminDealerDetail | null> {
  if (!hasDatabaseUrl) {
    const dealer = (await listAdminDealers()).find((item) => item.id === dealerId);

    return dealer
      ? { ...dealer, referralClicks: 0, leads: 0, commissions: 0 }
      : null;
  }

  const db = getDb();
  const [dealer] = await db
    .select({
      id: dealers.id,
      businessName: dealers.businessName,
      contactName: dealers.contactName,
      referralCode: dealers.referralCode,
      mobile: dealers.mobile,
      email: dealers.email,
      active: dealers.active,
      commissionValue: dealers.defaultCommissionValue,
      profileId: profiles.id,
    })
    .from(dealers)
    .leftJoin(profiles, eq(dealers.profileId, profiles.id))
    .where(eq(dealers.id, dealerId))
    .limit(1);

  if (!dealer) return null;

  const [clickRows, leadRows, commissionRows] = await Promise.all([
    db
      .select({ total: count(referralClicks.id) })
      .from(referralClicks)
      .where(eq(referralClicks.dealerId, dealerId)),
    db
      .select({ total: count(leads.id) })
      .from(leads)
      .where(eq(leads.dealerId, dealerId)),
    db
      .select({ total: count(commissions.id) })
      .from(commissions)
      .where(eq(commissions.dealerId, dealerId)),
  ]);

  const { profileId, ...detail } = dealer;

  return {
    ...detail,
    hasLogin: Boolean(profileId),
    referralClicks: firstTotal(clickRows),
    leads: firstTotal(leadRows),
    commissions: firstTotal(commissionRows),
  };
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  if (!hasDatabaseUrl) {
    return demoProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      condition: product.condition,
      regularPrice: product.regularPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      featured: product.featured,
      published: true,
      image: product.image,
    }));
  }

  const rows = await getDb()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      category: categories.name,
      brand: brands.name,
      condition: products.condition,
      regularPrice: products.regularPrice,
      sellingPrice: products.sellingPrice,
      stockQuantity: products.stockQuantity,
      stockStatus: products.stockStatus,
      featured: products.featured,
      published: products.published,
      image: productImages.storagePath,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(
      productImages,
      sql`${productImages.productId} = ${products.id} and ${productImages.isPrimary} = true`,
    )
    .orderBy(desc(products.createdAt));

  const byProduct = new Map<string, AdminProductRow>();

  for (const row of rows) {
    if (!byProduct.has(row.id)) {
      byProduct.set(row.id, {
        ...row,
        brand: row.brand ?? "Other",
      });
    }
  }

  return [...byProduct.values()];
}

export async function getAdminProductById(
  productId: string,
): Promise<AdminProductDetail | null> {
  if (!hasDatabaseUrl) {
    const product = demoProducts.find((item) => item.id === productId);

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      categoryId: slugify(product.category),
      categoryName: product.category,
      brandId: slugify(product.brand),
      brandName: product.brand,
      shortDescription: product.shortDescription,
      detailedDescription: product.detailedDescription,
      condition: product.condition,
      conditionGrade: product.conditionGrade ?? null,
      regularPrice: String(product.regularPrice),
      sellingPrice: String(product.sellingPrice),
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      warranty: product.warranty,
      featured: product.featured,
      published: true,
      images: [
        {
          id: `${product.id}-image`,
          storagePath: product.image,
          altText: product.name,
          isPrimary: true,
          displayOrder: 0,
        },
      ],
      specifications: product.specs.map((spec) => ({
        id: spec.key,
        key: spec.key,
        label: spec.label,
        unit: null,
        required: false,
        value: spec.value,
      })),
    };
  }

  const db = getDb();
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      categoryId: products.categoryId,
      categoryName: categories.name,
      brandId: products.brandId,
      brandName: brands.name,
      shortDescription: products.shortDescription,
      detailedDescription: products.detailedDescription,
      condition: products.condition,
      conditionGrade: products.conditionGrade,
      regularPrice: products.regularPrice,
      sellingPrice: products.sellingPrice,
      stockQuantity: products.stockQuantity,
      stockStatus: products.stockStatus,
      warranty: products.warranty,
      featured: products.featured,
      published: products.published,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return null;

  const [images, specificationRows] = await Promise.all([
    db
      .select({
        id: productImages.id,
        storagePath: productImages.storagePath,
        altText: productImages.altText,
        isPrimary: productImages.isPrimary,
        displayOrder: productImages.displayOrder,
      })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.displayOrder, productImages.createdAt),
    db
      .select({
        id: specificationDefinitions.id,
        key: specificationDefinitions.key,
        label: specificationDefinitions.label,
        unit: specificationDefinitions.unit,
        required: specificationDefinitions.required,
        value: productSpecificationValues.value,
      })
      .from(specificationDefinitions)
      .leftJoin(
        productSpecificationValues,
        sql`${productSpecificationValues.specificationDefinitionId} = ${specificationDefinitions.id} and ${productSpecificationValues.productId} = ${productId}`,
      )
      .where(eq(specificationDefinitions.categoryId, product.categoryId))
      .orderBy(
        specificationDefinitions.displayOrder,
        specificationDefinitions.label,
      ),
  ]);

  return {
    ...product,
    images,
    specifications: specificationRows.map((specification) => ({
      ...specification,
      value: specification.value ?? "",
    })),
  };
}

export async function listAdminCategories(): Promise<AdminSimpleRow[]> {
  if (!hasDatabaseUrl) {
    return demoCategories.map((category) => ({
      id: slugify(category),
      name: category,
      slug: slugify(category),
      active: true,
    }));
  }

  return getDb()
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      active: categories.active,
    })
    .from(categories)
    .orderBy(categories.displayOrder, categories.name);
}

export async function listAdminBrands(): Promise<AdminSimpleRow[]> {
  if (!hasDatabaseUrl) {
    return demoBrands.map((brand) => ({
      id: slugify(brand),
      name: brand,
      slug: slugify(brand),
      active: true,
    }));
  }

  return getDb()
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      active: brands.active,
    })
    .from(brands)
    .orderBy(brands.name);
}

export async function listAdminSpecifications(): Promise<AdminSpecRow[]> {
  if (!hasDatabaseUrl) {
    return demoProducts.flatMap((product) =>
      product.specs.map((spec) => ({
        id: `${product.category}-${spec.key}`,
        category: product.category,
        key: spec.key,
        label: spec.label,
        filterable: Boolean(spec.filterable),
      })),
    );
  }

  return getDb()
    .select({
      id: specificationDefinitions.id,
      category: categories.name,
      key: specificationDefinitions.key,
      label: specificationDefinitions.label,
      filterable: specificationDefinitions.filterable,
    })
    .from(specificationDefinitions)
    .innerJoin(
      categories,
      eq(specificationDefinitions.categoryId, categories.id),
    )
    .orderBy(categories.name, specificationDefinitions.displayOrder);
}

export async function listAdminSubscriptions(): Promise<
  AdminSubscriptionRow[]
> {
  if (!hasDatabaseUrl) {
    return demoSubscriptions;
  }

  const rows = await getDb()
    .select({
      id: customerSubscriptions.id,
      email: customerSubscriptions.email,
      mobile: customerSubscriptions.mobile,
      eventTypes: customerSubscriptions.eventTypes,
      consentGiven: customerSubscriptions.consentGiven,
      productName: products.name,
      categoryName: categories.name,
    })
    .from(customerSubscriptions)
    .leftJoin(products, eq(customerSubscriptions.productId, products.id))
    .leftJoin(categories, eq(customerSubscriptions.categoryId, categories.id))
    .orderBy(desc(customerSubscriptions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    contact: row.email ?? row.mobile ?? "No contact",
    target: row.productName ?? row.categoryName ?? "General catalogue",
    events: row.eventTypes.join(", "),
    consent: row.consentGiven ? "Yes" : "No",
  }));
}

export async function listAdminNotificationJobs(): Promise<
  AdminNotificationJobRow[]
> {
  if (!hasDatabaseUrl) {
    return demoNotificationJobs.map((job) => ({
      ...job,
      errorMessage: null,
      createdAt: new Date(),
      sentAt: job.status === "SENT" ? new Date() : null,
      failedAt: job.status === "FAILED" ? new Date() : null,
    }));
  }

  const rows = await getDb()
    .select({
      id: notificationJobs.id,
      recipient: notificationJobs.recipient,
      channel: notificationJobs.channel,
      status: notificationJobs.status,
      attempts: notificationJobs.attempts,
      payload: notificationJobs.payload,
      errorMessage: notificationJobs.errorMessage,
      createdAt: notificationJobs.createdAt,
      sentAt: notificationJobs.sentAt,
      failedAt: notificationJobs.failedAt,
      event: productChangeEvents.eventType,
    })
    .from(notificationJobs)
    .leftJoin(
      productChangeEvents,
      eq(notificationJobs.productChangeEventId, productChangeEvents.id),
    )
    .orderBy(desc(notificationJobs.createdAt));

  return rows.map((row) => ({
    id: row.id,
    recipient: row.recipient,
    channel: row.channel,
    event:
      row.event ??
      (typeof row.payload.eventType === "string"
        ? row.payload.eventType
        : "MANUAL"),
    status: row.status,
    attempts: row.attempts,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    sentAt: row.sentAt,
    failedAt: row.failedAt,
  }));
}
