import { Archive, ArrowLeft, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveProduct,
  registerProductImage,
  removeProductImage,
  setPrimaryProductImage,
  updateProduct,
  updateProductSpecifications,
} from "@/features/admin/actions";
import {
  getAdminProductById,
  listAdminBrands,
  listAdminCategories,
} from "@/features/admin/data";
import { resolveProductImageUrl } from "@/features/catalog/data";
import { requireRole } from "@/lib/auth";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const [product, categories, brands] = await Promise.all([
    getAdminProductById(productId),
    listAdminCategories(),
    listAdminBrands(),
  ]);

  if (!product) notFound();

  const saved = pick(query.saved);
  const created = pick(query.created);

  return (
    <AdminPageShell
      title={product.name}
      description="Edit catalogue details, availability, specifications, and product images."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/catalog/products">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Products
          </Link>
        </Button>
        <div className="flex gap-2">
          <Badge variant={product.published ? "default" : "outline"}>
            {product.published ? "Published" : "Draft"}
          </Badge>
          {product.featured ? <Badge variant="outline">Featured</Badge> : null}
        </div>
      </div>

      {saved || created ? (
        <p className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {created ? "Product created. Complete its images and specifications." : "Product changes saved."}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FormSection title="Product details">
          <form action={updateProduct} className="grid gap-4">
            <input type="hidden" name="productId" value={product.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={product.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={product.sku} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Category</Label>
                <Select
                  id="categoryName"
                  name="categoryName"
                  defaultValue={product.categoryName}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brandName">Brand</Label>
                <Select
                  id="brandName"
                  name="brandName"
                  defaultValue={product.brandName ?? ""}
                  required
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition</Label>
                <Select id="condition" name="condition" defaultValue={product.condition} required>
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conditionGrade">Condition grade</Label>
                <Input
                  id="conditionGrade"
                  name="conditionGrade"
                  defaultValue={product.conditionGrade ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="regularPrice">Regular price</Label>
                <Input
                  id="regularPrice"
                  name="regularPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.regularPrice}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellingPrice">Selling price</Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.sellingPrice}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">Stock quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={product.stockQuantity}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockStatus">Stock status</Label>
                <Select
                  id="stockStatus"
                  name="stockStatus"
                  defaultValue={product.stockStatus}
                  required
                >
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
                defaultValue={product.shortDescription}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detailedDescription">Detailed description</Label>
              <Textarea
                id="detailedDescription"
                name="detailedDescription"
                defaultValue={product.detailedDescription ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input id="warranty" name="warranty" defaultValue={product.warranty ?? ""} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="featured" defaultChecked={product.featured} />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="published" defaultChecked={product.published} />
                Published
              </label>
            </div>
            <Button type="submit">Save product</Button>
          </form>
        </FormSection>

        <div className="grid content-start gap-6">
          <FormSection title="Product images">
            <div className="grid gap-4">
              <ProductImageUploader
                productId={product.id}
                productName={product.name}
                imageCount={product.images.length}
              />

              <form action={registerProductImage} className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="altText" value={product.name} />
                <Input
                  aria-label="External image URL"
                  name="storagePath"
                  type="url"
                  placeholder="https://..."
                  required
                />
                <Button type="submit" variant="outline">
                  <ImagePlus className="size-4" aria-hidden="true" />
                  Add URL
                </Button>
              </form>

              {product.images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.images.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-md border bg-white">
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <Image
                          src={resolveProductImageUrl(image.storagePath)}
                          alt={image.altText}
                          fill
                          sizes="(max-width: 640px) 100vw, 280px"
                          className="object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2">
                        {image.isPrimary ? (
                          <Badge>Primary</Badge>
                        ) : (
                          <form action={setPrimaryProductImage}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="imageId" value={image.id} />
                            <Button type="submit" size="sm" variant="ghost">
                              <Star className="size-4" aria-hidden="true" />
                              Primary
                            </Button>
                          </form>
                        )}
                        <form action={removeProductImage}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="imageId" value={image.id} />
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            aria-label={`Remove image for ${product.name}`}
                            title="Remove image"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No product images yet.
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="Specifications">
            {product.specifications.length > 0 ? (
              <form action={updateProductSpecifications} className="grid gap-4">
                <input type="hidden" name="productId" value={product.id} />
                {product.specifications.map((specification) => (
                  <div className="grid gap-2" key={specification.id}>
                    <Label htmlFor={`spec-${specification.id}`}>
                      {specification.label}
                      {specification.unit ? ` (${specification.unit})` : ""}
                    </Label>
                    <Input
                      id={`spec-${specification.id}`}
                      name={`spec:${specification.id}`}
                      defaultValue={specification.value}
                      required={specification.required}
                    />
                  </div>
                ))}
                <Button type="submit">Save specifications</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specifications are defined for {product.categoryName}.
              </p>
            )}
          </FormSection>

          <FormSection title="Archive product">
            <form action={archiveProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <Button type="submit" variant="destructive">
                <Archive className="size-4" aria-hidden="true" />
                Archive product
              </Button>
            </form>
          </FormSection>
        </div>
      </div>
    </AdminPageShell>
  );
}
