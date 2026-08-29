import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createCategory } from "@/features/admin/actions";
import { listAdminCategories } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export default async function AdminCategoriesPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const categories = await listAdminCategories();

  return (
    <AdminPageShell
      title="Categories"
      description="Create reusable catalogue categories and subcategories per client deployment."
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Create category">
          <form action={createCategory} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit">Create category</Button>
          </form>
        </FormSection>
        <FormSection title="Categories">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <Td className="font-medium text-slate-950">{category.name}</Td>
                  <Td>{category.slug}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
