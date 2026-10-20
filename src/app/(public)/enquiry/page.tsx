import { ShoppingBasket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TurnstileField } from "@/components/public/turnstile-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCatalogProductBySlug,
  getCatalogProductsBySlugs,
  getDefaultCatalogProduct,
} from "@/features/catalog/data";
import { parseProductSlugs } from "@/features/catalog/comparison";
import { createQuotationRequest } from "@/features/leads/actions";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const productSlug = pick(params.product);
  const requestedSlugs = parseProductSlugs(params.products ?? productSlug);
  const requestedProducts =
    requestedSlugs.length > 0
      ? await getCatalogProductsBySlugs(requestedSlugs)
      : [];
  const fallbackProduct =
    requestedProducts.length === 0
      ? productSlug
        ? await getCatalogProductBySlug(productSlug)
        : await getDefaultCatalogProduct()
      : null;
  const products =
    requestedProducts.length > 0
      ? requestedProducts
      : fallbackProduct
        ? [fallbackProduct]
        : [];

  if (products.length === 0) {
    throw new Error("No products are available for quotation.");
  }

  return (
    <div className="container-shell py-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-950">
          Request best price
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This creates one lead with one or more lead items. Each item stores
          product name, SKU, quantity, and price snapshots for Computer House
          follow-up.
        </p>
      </div>
      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBasket
              className="size-5 text-primary"
              aria-hidden="true"
            />
            Quote basket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuotationRequest} className="grid gap-4">
            <div className="absolute -left-[10000px]" aria-hidden="true">
              <Label htmlFor="quote-website">Website</Label>
              <Input id="quote-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <input
              type="hidden"
              name="productSlugs"
              value={products.map((product) => product.slug).join(",")}
            />
            <div className="grid gap-2">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg border bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.sku} · quantity 1
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-name">Name</Label>
              <Input id="quote-name" name="name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="quote-mobile">Mobile number</Label>
                <Input id="quote-mobile" name="mobile" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quote-email">Email optional</Label>
                <Input id="quote-email" name="email" type="email" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-message">Message optional</Label>
              <Textarea
                id="quote-message"
                name="message"
                placeholder="Mention accessories, quantity, or delivery requirements."
              />
            </div>
            <TurnstileField action="quote_request" />
            <Button type="submit">Submit quote request</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
