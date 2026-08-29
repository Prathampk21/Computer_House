import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { commissions, dealers, leads, sales } from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";

export async function createCommissionForWonSale(input: {
  leadId: string;
  saleId: string;
}) {
  if (!hasDatabaseUrl) {
    return null;
  }

  const db = getDb();
  const [sale] = await db
    .select({
      id: sales.id,
      leadId: sales.leadId,
      dealerId: sales.dealerId,
      saleAmount: sales.saleAmount,
    })
    .from(sales)
    .where(eq(sales.id, input.saleId))
    .limit(1);

  if (!sale?.dealerId) {
    return null;
  }

  const [lead] = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);

  if (lead?.status !== "WON") {
    return null;
  }

  const [dealer] = await db
    .select({
      id: dealers.id,
      type: dealers.defaultCommissionType,
      value: dealers.defaultCommissionValue,
    })
    .from(dealers)
    .where(eq(dealers.id, sale.dealerId))
    .limit(1);

  if (!dealer) {
    return null;
  }

  const base = Number(sale.saleAmount);
  const rateOrValue = Number(dealer.value ?? 0);
  const calculated =
    dealer.type === "FIXED" ? rateOrValue : (base * rateOrValue) / 100;

  const [commission] = await db
    .insert(commissions)
    .values({
      dealerId: dealer.id,
      saleId: sale.id,
      leadId: input.leadId,
      baseSaleAmount: sale.saleAmount,
      commissionType: dealer.type ?? "PERCENTAGE",
      commissionValue: String(rateOrValue),
      calculatedAmount: String(calculated),
      finalAmount: String(calculated),
      status: "PENDING",
    })
    .returning();

  return commission;
}
