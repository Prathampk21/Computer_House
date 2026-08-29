import { ShoppingBasket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCatalogProductBySlug,
  getDefaultCatalogProduct,
} from "@/features/catalog/data";
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
  const product = productSlug
    ? await getCatalogProductBySlug(productSlug)
    : await getDefaultCatalogProduct();

  if (!product) {
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
          product name, SKU, quantity, and price snapshots at enquiry time.
        </p>
      </div>
      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5 text-primary" aria-hidden="true" />
            Quote basket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuotationRequest} className="grid gap-4">
            <input type="hidden" name="productSlugs" value={product.slug} />
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{product.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.sku} · quantity 1
              </p>
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
            <Button type="submit">Create quote lead and open WhatsApp</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
