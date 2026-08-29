import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CatalogFilterBar } from "@/components/public/catalog-filter-bar";
import { ProductCard } from "@/components/public/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listCatalogOptions,
  listCatalogProducts,
} from "@/features/catalog/data";
import { getShopSettings } from "@/features/shop/settings";
import { formatCurrency } from "@/lib/utils";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    q: pick(params.q),
    category: pick(params.category),
    brand: pick(params.brand),
    condition: pick(params.condition),
    sort: pick(params.sort),
  };
  const [products, options, shopSettings] = await Promise.all([
    listCatalogProducts(filters),
    listCatalogOptions(),
    getShopSettings(),
  ]);
  const featured = products.find((product) => product.featured) ?? products[0];

  return (
    <div>
      <section className="border-b bg-white">
        <div className="container-shell grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-2">
              <Badge>
                <BadgeCheck className="mr-1 size-3.5" aria-hidden="true" />
                First-touch dealer attribution
              </Badge>
              <Badge variant="secondary">No checkout required</Badge>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              Computer shop catalogue built for WhatsApp-first enquiries.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Browse new, used, and refurbished electronics, compare products,
              request best prices, and attribute every meaningful enquiry to the
              right dealer session.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#catalogue">
                  Browse products
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dealer">Dealer referral portal</Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["Products", products.length.toString()],
                ["Starting at", formatCurrency(1999, shopSettings.currency)],
                ["Attribution", `${shopSettings.defaultAttributionDays} days`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {featured ? (
          <div className="min-w-0">
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={featured.image}
                  alt={featured.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-5 text-white">
                  <Badge variant="secondary">Featured arrival</Badge>
                  <h2 className="mt-3 text-2xl font-bold">{featured.name}</h2>
                  <p className="mt-1 text-sm text-slate-100">
                    {featured.shortDescription}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          ) : null}
        </div>
      </section>

      <section className="container-shell py-6" aria-label="Shop services">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            [MonitorSmartphone, "Dynamic specs", "Laptop, printer, monitor fields"],
            [ShieldCheck, "Secure leads", "Server actions and RBAC checks"],
            [Truck, "Stock aware", "Availability and price snapshots"],
            [Clock3, "Retryable outbox", "Notification jobs after changes"],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="rounded-lg border bg-white p-4">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-950">{String(title)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{String(copy)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="catalogue" className="container-shell pb-12 pt-2">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <Badge variant="outline">
              <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
              Product catalogue
            </Badge>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 md:text-3xl">
              Browse products
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Search by name, SKU, brand, category, condition, and dynamic
              specification fields as the database grows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {options.categories.slice(0, 4).map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <CatalogFilterBar
          defaultSearch={filters.q}
          defaultCategory={filters.category}
          defaultBrand={filters.brand}
          defaultCondition={filters.condition}
          categories={options.categories}
          brands={options.brands}
        />
        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{products.length} matching products</p>
          <form>
            {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
            {filters.category ? (
              <input type="hidden" name="category" value={filters.category} />
            ) : null}
            {filters.brand ? (
              <input type="hidden" name="brand" value={filters.brand} />
            ) : null}
            {filters.condition ? (
              <input type="hidden" name="condition" value={filters.condition} />
            ) : null}
            <select
              name="sort"
              defaultValue={filters.sort ?? "newest"}
              className="rounded-md border bg-white px-3 py-2"
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="popularity">Popularity</option>
            </select>
          </form>
        </div>
        {products.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={shopSettings.currency}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-5">
            <CardContent className="p-8 text-center">
              <p className="font-semibold text-slate-950">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clear filters or adjust the search term.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
