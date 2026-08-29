import { Heart, MessageCircle, Scale, ShoppingBasket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/features/catalog/data";
import { defaultShopSettings } from "@/lib/shop-config";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({
  product,
  currency = defaultShopSettings.currency,
}: {
  product: CatalogProduct;
  currency?: string;
}) {
  const saving = product.regularPrice - product.sellingPrice;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[4/3] overflow-hidden bg-slate-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={product.condition === "NEW" ? "default" : "secondary"}>
            {product.condition}
          </Badge>
          {product.offerText ? <Badge variant="outline">Offer</Badge> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{product.brand}</span>
            <span>{product.stockStatus.replaceAll("_", " ")}</span>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 text-base font-semibold text-slate-950 hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
        </div>
        <div className="mt-auto">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-slate-950">
                {formatCurrency(product.sellingPrice, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="line-through">
                  {formatCurrency(product.regularPrice, currency)}
                </span>{" "}
                {saving > 0 ? `Save ${formatCurrency(saving)}` : null}
              </p>
            </div>
            <Button asChild size="icon" variant="outline">
              <Link href={`/compare?products=${product.slug}`}>
                <Scale className="size-4" aria-hidden="true" />
                <span className="sr-only">Compare {product.name}</span>
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/products/${product.slug}#notify`}>
                <Heart className="size-4" aria-hidden="true" />
                Notify
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/products/${product.slug}#enquire`}>
                <MessageCircle className="size-4" aria-hidden="true" />
                Enquire
              </Link>
            </Button>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
            <Link href={`/enquiry?product=${product.slug}`}>
              <ShoppingBasket className="size-4" aria-hidden="true" />
              Add to quote basket
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
