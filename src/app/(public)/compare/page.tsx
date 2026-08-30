import Link from "next/link";

import { ComparisonTracker } from "@/components/analytics/event-trackers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { listCatalogProducts } from "@/features/catalog/data";
import { getShopSettings } from "@/features/shop/settings";
import { formatCurrency } from "@/lib/utils";

function getProductSlugs(value?: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return Array.from(
    new Set(
      values
        .flatMap((item) => item.split(","))
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const slugs = getProductSlugs(params.products);
  const [products, shopSettings] = await Promise.all([
    listCatalogProducts(),
    getShopSettings(),
  ]);
  const selected = slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is (typeof products)[number] =>
      Boolean(product),
    );
  const selectorValues = [
    ...selected.map((product) => product.slug),
    "",
    "",
    "",
  ].slice(0, 4);
  const specLabels = Array.from(
    new Set(
      selected.flatMap((product) => product.specs.map((spec) => spec.label)),
    ),
  );

  const rows: Array<[string, (slug: string) => string | undefined]> = [
    [
      "Condition",
      (slug) => selected.find((product) => product.slug === slug)?.condition,
    ],
    [
      "Price",
      (slug) =>
        formatCurrency(
          selected.find((product) => product.slug === slug)?.sellingPrice ?? 0,
          shopSettings.currency,
        ),
    ],
    [
      "Availability",
      (slug) => selected.find((product) => product.slug === slug)?.stockStatus,
    ],
    [
      "Warranty",
      (slug) => selected.find((product) => product.slug === slug)?.warranty,
    ],
    ...specLabels.map(
      (label) =>
        [
          label,
          (slug: string) =>
            selected
              .find((product) => product.slug === slug)
              ?.specs.find((spec) => spec.label === label)?.value ?? "-",
        ] satisfies [string, (slug: string) => string],
    ),
  ];

  return (
    <div className="container-shell py-8">
      <ComparisonTracker
        productSlugs={selected.map((product) => product.slug)}
      />
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <Badge>Compare 2-4 products</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Product comparison
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose any products from the live catalogue and compare price,
            condition, warranty, availability, and specifications.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Browse catalogue</Link>
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Choose products</CardTitle>
          <CardDescription>
            Select any 2 to 4 products from the live catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/compare" className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <label className="grid gap-2 text-sm font-medium" key={index}>
                  Product {index + 1}
                  <Select
                    name="products"
                    defaultValue={selectorValues[index] ?? ""}
                  >
                    <option value="">
                      {index < 2 ? "Choose product" : "Optional product"}
                    </option>
                    {products.map((product) => (
                      <option key={product.slug} value={product.slug}>
                        {product.name}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit">Update comparison</Button>
              <Button asChild variant="ghost">
                <Link href="/compare">Clear selection</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-slate-950">
              Choose at least two products to compare.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a product card or use the selectors above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comparison table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th className="min-w-40">Field</Th>
                  {selected.map((product) => (
                    <Th key={product.id} className="min-w-56">
                      {product.name}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, getValue]) => {
                  const values = selected.map((product) =>
                    getValue(product.slug),
                  );
                  const differs = new Set(values).size > 1;

                  return (
                    <tr key={String(label)}>
                      <Td className="font-medium text-slate-900">
                        {String(label)}
                      </Td>
                      {selected.map((product, index) => (
                        <Td
                          key={`${product.id}-${String(label)}`}
                          className={differs ? "bg-primary-soft/70" : undefined}
                        >
                          {values[index]}
                        </Td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <Td className="font-medium text-slate-900">Action</Td>
                  {selected.map((product) => (
                    <Td key={`${product.id}-action`}>
                      <Button asChild size="sm">
                        <Link href={`/products/${product.slug}#enquire`}>
                          Enquire
                        </Link>
                      </Button>
                    </Td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
