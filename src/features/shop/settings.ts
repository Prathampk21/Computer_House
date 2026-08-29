import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { shopSettings } from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";
import { defaultShopSettings } from "@/lib/shop-config";

const shopSettingsSchema = z
  .object({
    businessName: z.string().optional(),
    shortName: z.string().optional(),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    defaultAttributionDays: z.coerce.number().int().positive().optional(),
    socialLinks: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        youtube: z.string().optional(),
      })
      .optional(),
    footerText: z.string().optional(),
  })
  .passthrough();

export type ShopSettings = typeof defaultShopSettings;

export async function getShopSettings(): Promise<ShopSettings> {
  if (!hasDatabaseUrl) {
    return defaultShopSettings;
  }

  const [row] = await getDb()
    .select({ value: shopSettings.value })
    .from(shopSettings)
    .where(eq(shopSettings.key, "business"))
    .limit(1)
    .catch(() => []);

  if (!row) {
    return defaultShopSettings;
  }

  const parsed = shopSettingsSchema.safeParse(row.value);

  if (!parsed.success) {
    return defaultShopSettings;
  }

  return {
    ...defaultShopSettings,
    ...parsed.data,
    socialLinks: {
      ...defaultShopSettings.socialLinks,
      ...parsed.data.socialLinks,
    },
  };
}
