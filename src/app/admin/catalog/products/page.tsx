import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  updateProductPriceFromAdmin,
} from "@/features/admin/actions";
import { listCatalogProducts } from "@/features/catalog/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const products = await listCatalogProducts();

  return (
    <AdminPageShell
      title="Products"
      description="Create products with price snapshots, stock status, condition, category, brand, and dynamic specs managed separately."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <FormSection title="Add product">
          <form action={createProduct} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Category</Label>
                <Input id="categoryName" name="categoryName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brandName">Brand</Label>
                <Input id="brandName" name="brandName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition</Label>
                <Select id="condition" name="condition" required>
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conditionGrade">Condition grade</Label>
                <Input id="conditionGrade" name="conditionGrade" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="regularPrice">Regular price</Label>
                <Input
                  id="regularPrice"
                  name="regularPrice"
                  type="number"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellingPrice">Selling price</Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">Stock quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockStatus">Stock status</Label>
                <Select id="stockStatus" name="stockStatus" required>
                  <option value="IN_STOCK">In stock</option>
                  <option value="LOW_STOCK">Low stock</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                  <option value="SOLD">Sold</option>
                  <option value="COMING_SOON">Coming soon</option>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detailedDescription">Detailed description</Label>
              <Textarea id="detailedDescription" name="detailedDescription" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input id="warranty" name="warranty" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Primary image URL optional</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="featured" /> Featured
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="published" defaultChecked />{" "}
                Published
              </label>
            </div>
            <Button type="submit">Create product</Button>
          </form>
        </FormSection>

        <FormSection title="Current products">
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Condition</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                <Th>Update price</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <Td>
                    <Link
                      className="font-medium text-slate-950 hover:text-primary"
                      href={`/products/${product.slug}`}
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {product.category} · {product.brand}
                    </p>
                  </Td>
                  <Td>{product.sku}</Td>
                  <Td>
                    <Badge variant="outline">{product.condition}</Badge>
                  </Td>
                  <Td>{formatCurrency(product.sellingPrice)}</Td>
                  <Td>{product.stockStatus.replaceAll("_", " ")}</Td>
                  <Td>
                    <form
                      action={updateProductPriceFromAdmin}
                      className="flex min-w-52 gap-2"
                    >
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
                      <input
                        type="hidden"
                        name="reason"
                        value="Admin product price update."
                      />
                      <Input
                        aria-label={`Selling price for ${product.name}`}
                        className="w-28"
                        min={0}
                        name="sellingPrice"
                        required
                        step="0.01"
                        type="number"
                        defaultValue={product.sellingPrice}
                      />
                      <Button size="sm" type="submit">
                        Save
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
