import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { listCatalogProductSlugs } from "@/features/catalog/data";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const productSlugs = await listCatalogProductSlugs();

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/offers"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/compare"),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...productSlugs.map((slug) => ({
      url: absoluteUrl(`/products/${slug}`),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
