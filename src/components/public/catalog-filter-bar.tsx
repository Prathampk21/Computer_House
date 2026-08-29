import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CatalogFilterBar({
  defaultSearch,
  defaultCategory,
  defaultBrand,
  defaultCondition,
  categories,
  brands,
}: {
  defaultSearch?: string;
  defaultCategory?: string;
  defaultBrand?: string;
  defaultCondition?: string;
  categories: string[];
  brands: string[];
}) {
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-3 shadow-sm md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
      <label className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <span className="sr-only">Search products</span>
        <Input
          name="q"
          defaultValue={defaultSearch}
          placeholder="Search name, SKU, brand, category..."
          className="pl-9"
        />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <Select name="category" defaultValue={defaultCategory ?? ""}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="sr-only">Brand</span>
        <Select name="brand" defaultValue={defaultBrand ?? ""}>
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="sr-only">Condition</span>
        <Select name="condition" defaultValue={defaultCondition ?? ""}>
          <option value="">Any condition</option>
          <option value="NEW">New</option>
          <option value="USED">Used</option>
          <option value="REFURBISHED">Refurbished</option>
        </Select>
      </label>
      <Button type="submit">
        <Filter className="size-4" aria-hidden="true" />
        Filter
      </Button>
    </form>
  );
}
