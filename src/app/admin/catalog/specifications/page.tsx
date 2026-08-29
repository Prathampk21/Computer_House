import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { createSpecificationDefinition } from "@/features/admin/actions";
import { listAdminSpecifications } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export default async function AdminSpecificationsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const specs = await listAdminSpecifications();

  return (
    <AdminPageShell
      title="Specification definitions"
      description="Define category-specific fields such as processor, Wi-Fi, panel type, or ports without changing product code."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Create specification">
          <form action={createSpecificationDefinition} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Category</Label>
                <Input id="categoryName" name="categoryName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="key">Key</Label>
                <Input id="key" name="key" required placeholder="processor" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" required placeholder="Processor" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataType">Data type</Label>
                <Select id="dataType" name="dataType">
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Boolean</option>
                  <option value="DATE">Date</option>
                  <option value="SELECT">Select</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit optional</Label>
                <Input id="unit" name="unit" placeholder="GB, inch, Hz" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="filterable" /> Filterable
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="comparable" defaultChecked /> Comparable
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="required" /> Required
              </label>
            </div>
            <Button type="submit">Create specification</Button>
          </form>
        </FormSection>
        <FormSection title="Specification definitions">
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Key</Th>
                <Th>Label</Th>
                <Th>Filter</Th>
              </tr>
            </thead>
            <tbody>
              {specs.slice(0, 30).map((spec) => (
                <tr key={spec.id}>
                  <Td>{spec.category}</Td>
                  <Td>{spec.key}</Td>
                  <Td className="font-medium text-slate-950">{spec.label}</Td>
                  <Td>{spec.filterable ? "Yes" : "No"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
