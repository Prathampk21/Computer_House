import Link from "next/link";

import { ComparisonTracker } from "@/components/analytics/event-trackers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import {
  getCatalogProductsBySlugs,
  listCatalogProducts,
} from "@/features/catalog/data";
import { getShopSettings } from "@/features/shop/settings";
import { formatCurrency } from "@/lib/utils";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const slugs =
    pick(params.products)
      ?.split(",")
      .map((slug) => slug.trim())
      .filter(Boolean) ?? [];
  const [defaultProducts, shopSettings] = await Promise.all([
    listCatalogProducts(),
    getShopSettings(),
  ]);
  const selected = await getCatalogProductsBySlugs(
    (slugs.length ? slugs : defaultProducts.slice(0, 3).map((p) => p.slug)).slice(
      0,
      4,
    ),
  );
  const specLabels = Array.from(
    new Set(selected.flatMap((product) => product.specs.map((spec) => spec.label))),
  );

  const rows: Array<[string, (slug: string) => string | undefined]> = [
    ["Condition", (slug) => selected.find((product) => product.slug === slug)?.condition],
    [
      "Price",
      (slug) =>
        formatCurrency(
          selected.find((product) => product.slug === slug)?.sellingPrice ?? 0,
          shopSettings.currency,
        ),
    ],
    ["Availability", (slug) => selected.find((product) => product.slug === slug)?.stockStatus],
    ["Warranty", (slug) => selected.find((product) => product.slug === slug)?.warranty],
    ...specLabels.map(
      (label) =>
        [
          label,
          (slug: string) =>
            selected
              .find((product) => product.slug === slug)
              ?.specs.find((spec) => spec.label === label)
              ?.value ?? "-",
        ] satisfies [string, (slug: string) => string],
    ),
  ];

  return (
    <div className="container-shell py-8">
      <ComparisonTracker productSlugs={selected.map((product) => product.slug)} />
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <Badge>Compare 2-4 products</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Product comparison
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Compare prices, condition, warranty, availability, and comparable
            dynamic specification values. Mobile users can scroll the table.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Replace products</Link>
        </Button>
      </div>

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
                const values = selected.map((product) => getValue(product.slug));
                const differs = new Set(values).size > 1;

                return (
                  <tr key={String(label)}>
                    <Td className="font-medium text-slate-900">{String(label)}</Td>
                    {selected.map((product, index) => (
                      <Td
                        key={`${product.id}-${String(label)}`}
                        className={differs ? "bg-amber-50/60" : undefined}
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
                      <Link href={`/products/${product.slug}#enquire`}>Enquire</Link>
                    </Button>
                  </Td>
                ))}
              </tr>
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
