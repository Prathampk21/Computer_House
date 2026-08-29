import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

const catalogModules = [
  ["Products", "/admin/catalog/products", "Add, edit, publish, price, inventory"],
  ["Categories", "/admin/catalog/categories", "Main categories and subcategories"],
  ["Brands", "/admin/catalog/brands", "Brand list and logos"],
  [
    "Specification Definitions",
    "/admin/catalog/specifications",
    "Dynamic category-specific specs",
  ],
];

export default async function AdminCatalogPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);

  return (
    <AdminPageShell
      title="Catalog"
      description="Manage the reusable product catalogue without hard-coding category-specific specifications."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {catalogModules.map(([title, href, copy]) => (
          <Link key={href} href={href} className="block">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{copy}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  );
}
