import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  brands,
  categories,
  commissions,
  customerSubscriptions,
  customers,
  dealers,
  leadItems,
  leads,
  notificationJobs,
  productChangeEvents,
  products,
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
    { label: "Total Products", value: String(productTotal), delta: "Live catalogue" },
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
    { label: "Referral Clicks", value: String(clicksTotal), delta: "Clicks only" },
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
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(dealers, eq(leads.dealerId, dealers.id))
    .leftJoin(leadItems, eq(leads.id, leadItems.leadId))
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
      });
    }
  }

  return [...byLead.values()];
}

export async function listWonAdminLeads() {
  return (await listAdminLeads(100)).filter((lead) => lead.status === "WON");
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
    }));
  }

  return getDb()
    .select({
      id: dealers.id,
      businessName: dealers.businessName,
      contactName: dealers.contactName,
      referralCode: dealers.referralCode,
      mobile: dealers.mobile,
      email: dealers.email,
      active: dealers.active,
      commissionValue: dealers.defaultCommissionValue,
    })
    .from(dealers)
    .orderBy(desc(dealers.createdAt));
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
    .innerJoin(categories, eq(specificationDefinitions.categoryId, categories.id))
    .orderBy(categories.name, specificationDefinitions.displayOrder);
}

export async function listAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
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
    return demoNotificationJobs;
  }

  const rows = await getDb()
    .select({
      id: notificationJobs.id,
      recipient: notificationJobs.recipient,
      channel: notificationJobs.channel,
      status: notificationJobs.status,
      attempts: notificationJobs.attempts,
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
    event: row.event ?? "MANUAL",
    status: row.status,
    attempts: row.attempts,
  }));
}
