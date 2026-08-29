import { CalendarDays, Percent } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/public/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOfferProducts } from "@/features/catalog/data";
import { getShopSettings } from "@/features/shop/settings";

export default async function OffersPage() {
  const [offers, shopSettings] = await Promise.all([
    listOfferProducts(),
    getShopSettings(),
  ]);

  return (
    <div className="container-shell py-8">
      <Badge variant="secondary">
        <Percent className="mr-1 size-3.5" aria-hidden="true" />
        Active offers
      </Badge>
      <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Current deals</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Offers are modelled separately from base product prices, so temporary
            campaigns do not destroy historical price snapshots.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <CalendarDays className="size-4" aria-hidden="true" />
            Back to catalogue
          </Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={shopSettings.currency}
          />
        ))}
      </div>
    </div>
  );
}
