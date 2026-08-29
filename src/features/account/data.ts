import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  customerSubscriptions,
  customers,
  leadItems,
  leads,
  products,
} from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";

export async function getAccountOverview() {
  const profile = await getCurrentProfile();

  if (!profile || !hasDatabaseUrl) {
    return {
      profile,
      customer: null,
      leads: [],
      subscriptions: [],
    };
  }

  const db = getDb();
  const [customerByAuth] = await db
    .select()
    .from(customers)
    .where(eq(customers.authUserId, profile.authUserId))
    .limit(1);
  const [customerByEmail] = customerByAuth
    ? [customerByAuth]
    : await db
        .select()
        .from(customers)
        .where(eq(customers.email, profile.email))
        .limit(1);
  const customer = customerByAuth ?? customerByEmail ?? null;

  if (!customer) {
    return {
      profile,
      customer: null,
      leads: [],
      subscriptions: [],
    };
  }

  const [leadRows, subscriptionRows] = await Promise.all([
    db
      .select({
        id: leads.id,
        leadNumber: leads.leadNumber,
        status: leads.status,
        source: leads.source,
        productName: leadItems.productNameSnapshot,
        amount: leadItems.sellingPriceSnapshot,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(leadItems, eq(leads.id, leadItems.leadId))
      .where(eq(leads.customerId, customer.id))
      .orderBy(desc(leads.createdAt))
      .limit(20),
    db
      .select({
        id: customerSubscriptions.id,
        eventTypes: customerSubscriptions.eventTypes,
        consentGiven: customerSubscriptions.consentGiven,
        active: customerSubscriptions.active,
        productName: products.name,
        createdAt: customerSubscriptions.createdAt,
      })
      .from(customerSubscriptions)
      .leftJoin(products, eq(customerSubscriptions.productId, products.id))
      .where(eq(customerSubscriptions.customerId, customer.id))
      .orderBy(desc(customerSubscriptions.createdAt)),
  ]);

  return {
    profile,
    customer,
    leads: leadRows,
    subscriptions: subscriptionRows,
  };
}
