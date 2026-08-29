import "server-only";

import { and, count, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  commissions,
  dealers,
  leadItems,
  leads,
  profiles,
  productViews,
  referralClicks,
  visitorSessions,
} from "@/db/schema";
import { dealerMetrics } from "@/features/analytics/demo";
import { demoDealers } from "@/features/catalog/demo-data";
import { demoLeadRows } from "@/features/admin/demo";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";

export type DealerLeadRow = {
  id: string;
  leadNumber: string;
  productName: string | null;
  source: string;
  status: string;
  amount: string | number | null;
};

export async function requireCurrentDealer() {
  const profile = await requireRole(["OWNER", "ADMIN", "DEALER"]);

  if (!hasDatabaseUrl || profile.role !== "DEALER") {
    return {
      profile,
      dealer: demoDealers[0],
    };
  }

  const [dealer] = await getDb()
    .select({
      id: dealers.id,
      businessName: dealers.businessName,
      contactName: dealers.contactName,
      referralCode: dealers.referralCode,
      mobile: dealers.mobile,
      active: dealers.active,
    })
    .from(dealers)
    .innerJoin(profiles, eq(dealers.profileId, profiles.id))
    .where(and(eq(profiles.id, profile.id), eq(dealers.active, true)))
    .limit(1);

  if (!dealer) {
    throw new Error("Dealer profile not found or inactive.");
  }

  return { profile, dealer };
}

export async function listCurrentDealerLeads(): Promise<DealerLeadRow[]> {
  const { dealer } = await requireCurrentDealer();

  if (!hasDatabaseUrl || dealer.id === "dealer_a") {
    return demoLeadRows
      .filter((lead) => lead.dealer === "Dealer A")
      .map((lead) => ({
        id: lead.id,
        leadNumber: lead.leadNumber,
        productName: lead.product,
        source: lead.source,
        status: lead.status,
        amount: lead.amount,
      }));
  }

  return getDb()
    .select({
      id: leads.id,
      leadNumber: leads.leadNumber,
      status: leads.status,
      source: leads.source,
      productName: leadItems.productNameSnapshot,
      amount: leadItems.sellingPriceSnapshot,
    })
    .from(leads)
    .leftJoin(leadItems, eq(leads.id, leadItems.leadId))
    .where(eq(leads.dealerId, dealer.id));
}

export async function listCurrentDealerCommissions() {
  const { dealer } = await requireCurrentDealer();

  if (!hasDatabaseUrl || dealer.id === "dealer_a") {
    return [
      {
        id: "com_001",
        leadNumber: "ENQ-2026-00119",
        status: "PENDING",
        baseSaleAmount: "24900",
        finalAmount: "1245",
      },
      {
        id: "com_002",
        leadNumber: "ENQ-2026-00104",
        status: "PAID",
        baseSaleAmount: "64900",
        finalAmount: "3245",
      },
    ];
  }

  return getDb()
    .select({
      id: commissions.id,
      leadNumber: leads.leadNumber,
      status: commissions.status,
      baseSaleAmount: commissions.baseSaleAmount,
      finalAmount: commissions.finalAmount,
    })
    .from(commissions)
    .innerJoin(leads, eq(commissions.leadId, leads.id))
    .where(eq(commissions.dealerId, dealer.id));
}

export async function getCurrentDealerMetrics() {
  const { dealer } = await requireCurrentDealer();

  if (!hasDatabaseUrl || dealer.id === "dealer_a") {
    return dealerMetrics;
  }

  const db = getDb();
  const [
    clickCount,
    visitorCount,
    viewCount,
    leadCount,
    wonLeadCount,
    pendingCommission,
    approvedCommission,
    paidCommission,
  ] = await Promise.all([
    db
      .select({ total: count(referralClicks.id) })
      .from(referralClicks)
      .where(eq(referralClicks.dealerId, dealer.id)),
    db
      .select({ total: count(visitorSessions.id) })
      .from(visitorSessions)
      .where(eq(visitorSessions.firstDealerId, dealer.id)),
    db
      .select({ total: count(productViews.id) })
      .from(productViews)
      .where(eq(productViews.dealerId, dealer.id)),
    db
      .select({ total: count(leads.id) })
      .from(leads)
      .where(eq(leads.dealerId, dealer.id)),
    db
      .select({ total: count(leads.id) })
      .from(leads)
      .where(and(eq(leads.dealerId, dealer.id), eq(leads.status, "WON"))),
    db
      .select({
        total: sql<string>`coalesce(sum(${commissions.finalAmount}), 0)`,
      })
      .from(commissions)
      .where(
        and(eq(commissions.dealerId, dealer.id), eq(commissions.status, "PENDING")),
      ),
    db
      .select({
        total: sql<string>`coalesce(sum(${commissions.finalAmount}), 0)`,
      })
      .from(commissions)
      .where(
        and(eq(commissions.dealerId, dealer.id), eq(commissions.status, "APPROVED")),
      ),
    db
      .select({
        total: sql<string>`coalesce(sum(${commissions.finalAmount}), 0)`,
      })
      .from(commissions)
      .where(
        and(eq(commissions.dealerId, dealer.id), eq(commissions.status, "PAID")),
      ),
  ]);

  const leadsTotal = Number(leadCount[0]?.total ?? 0);
  const wonTotal = Number(wonLeadCount[0]?.total ?? 0);

  return [
    { label: "Referral Clicks", value: String(clickCount[0]?.total ?? 0) },
    { label: "Unique Visitors", value: String(visitorCount[0]?.total ?? 0) },
    { label: "Product Views", value: String(viewCount[0]?.total ?? 0) },
    { label: "Leads", value: String(leadsTotal) },
    { label: "Won Leads", value: String(wonTotal) },
    {
      label: "Conversion Rate",
      value: leadsTotal ? `${((wonTotal / leadsTotal) * 100).toFixed(1)}%` : "0%",
    },
    {
      label: "Pending Commission",
      value: formatCurrency(pendingCommission[0]?.total ?? 0),
    },
    {
      label: "Approved Commission",
      value: formatCurrency(approvedCommission[0]?.total ?? 0),
    },
    {
      label: "Paid Commission",
      value: formatCurrency(paidCommission[0]?.total ?? 0),
    },
  ];
}
