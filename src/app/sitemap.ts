import type { MetadataRoute } from "next";

import { listCatalogProducts } from "@/features/catalog/data";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listCatalogProducts();

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
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
