"use client";

import { useEffect } from "react";

export function ProductViewTracker({ productSlug }: { productSlug: string }) {
  useEffect(() => {
    void fetch("/api/events/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug }),
      keepalive: true,
    });
  }, [productSlug]);

  return null;
}

export function ComparisonTracker({
  productSlugs,
}: {
  productSlugs: string[];
}) {
  useEffect(() => {
    if (productSlugs.length < 2) {
      return;
    }

    void fetch("/api/events/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlugs }),
      keepalive: true,
    });
  }, [productSlugs]);

  return null;
}
