import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductViewTracker } from "@/components/analytics/event-trackers";
import { ProductCard } from "@/components/public/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCatalogProductBySlug,
  getRelatedCatalogProducts,
} from "@/features/catalog/data";
import { createProductEnquiry } from "@/features/leads/actions";
import { createProductSubscription } from "@/features/subscriptions/actions";
import { getShopSettings } from "@/features/shop/settings";
import { absoluteUrl, formatCurrency } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: {
      canonical: absoluteUrl(`/products/${product.slug}`),
    },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [related, shopSettings] = await Promise.all([
    getRelatedCatalogProducts(product),
    getShopSettings(),
  ]);

  return (
    <div className="container-shell py-8">
      <ProductViewTracker productSlug={product.slug} />
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Catalogue
        </Link>{" "}
        / {product.category}
      </div>
      <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-slate-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Card>
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{product.condition}</Badge>
            <Badge variant="outline">{product.stockStatus.replaceAll("_", " ")}</Badge>
            {product.offerText ? (
              <Badge variant="secondary">{product.offerText}</Badge>
            ) : null}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>
          <div className="mt-5 rounded-lg border bg-white p-4">
            <p className="text-3xl font-bold text-slate-950">
              {formatCurrency(product.sellingPrice, shopSettings.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              MRP{" "}
              <span className="line-through">
                {formatCurrency(product.regularPrice, shopSettings.currency)}
              </span>{" "}
              · SKU {product.sku}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button asChild>
                <a href="#enquire">Enquire on WhatsApp</a>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/compare?products=${product.slug}`}>Compare</Link>
              </Button>
            </div>
          </div>
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Product specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div key={spec.key} className="rounded-md border bg-slate-50 p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{product.detailedDescription}</p>
            <p>
              Warranty: <span className="font-medium text-slate-900">{product.warranty}</span>
            </p>
            <p>
              Stock:{" "}
              <span className="font-medium text-slate-900">
                {product.stockQuantity} units
              </span>
            </p>
          </CardContent>
        </Card>

        <Card id="enquire">
          <CardHeader>
            <CardTitle>Enquire on WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProductEnquiry} className="grid gap-4">
              <input type="hidden" name="productSlug" value={product.slug} />
              <input type="hidden" name="productName" value={product.name} />
              <input type="hidden" name="sku" value={product.sku} />
              <input
                type="hidden"
                name="sellingPrice"
                value={product.sellingPrice}
              />
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Customer name" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input id="mobile" name="mobile" required placeholder="9876543210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email optional</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message optional</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Please share best price and availability."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Submitting creates a lead with price snapshot and current dealer
                session attribution before opening WhatsApp.
              </p>
              <Button type="submit">Create enquiry and open WhatsApp</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card id="notify" className="mt-7">
        <CardHeader>
          <CardTitle>Notify me about this product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductSubscription} className="grid gap-3">
            <input type="hidden" name="productSlug" value={product.slug} />
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="name" required placeholder="Name" aria-label="Name" />
              <Input
                name="mobile"
                placeholder="Mobile"
                aria-label="Mobile number"
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                aria-label="Email"
              />
            </div>
            <fieldset className="grid gap-2 rounded-md border bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <legend className="px-1 text-sm font-medium text-slate-800">
                Alert me for
              </legend>
              {[
                ["PRICE_CHANGED", "Price changed"],
                ["BACK_IN_STOCK", "Back in stock"],
                ["OFFER_STARTED", "New offer"],
                ["PRODUCT_UPDATED", "Product updated"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="eventTypes"
                    value={value}
                    defaultChecked={value === "PRICE_CHANGED"}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-0.5"
              />
              I consent to receive selected product notifications. Anonymous
              product views alone will not trigger messages.
            </label>
            <Button type="submit">Subscribe</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Product views alone never trigger notifications. Contact details and
            explicit consent are required.
          </p>
        </CardContent>
      </Card>

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-950">Related products</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                currency={shopSettings.currency}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
