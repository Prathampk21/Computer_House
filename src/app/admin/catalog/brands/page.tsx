import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { createBrand } from "@/features/admin/actions";
import { listAdminBrands } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export default async function AdminBrandsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const brands = await listAdminBrands();

  return (
    <AdminPageShell
      title="Brands"
      description="Manage brands once and attach them to products for search and filters."
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Create brand">
          <form action={createBrand} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <Button type="submit">Create brand</Button>
          </form>
        </FormSection>
        <FormSection title="Brands">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <Td className="font-medium text-slate-950">{brand.name}</Td>
                  <Td>{brand.slug}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
