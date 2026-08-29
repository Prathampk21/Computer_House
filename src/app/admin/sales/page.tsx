import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { recordSale } from "@/features/admin/actions";
import { listWonAdminLeads } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function AdminSalesPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const wonLeads = await listWonAdminLeads();

  return (
    <AdminPageShell
      title="Sales and commissions"
      description="Record verified sales only after a lead is won. Commission eligibility is based on sale records, never referral clicks."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Record sale">
          <form action={recordSale} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="leadId">Lead UUID</Label>
              <Input id="leadId" name="leadId" placeholder="Production lead id" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="productName">Sold product</Label>
                <Input id="productName" name="productName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="saleAmount">Sale amount</Label>
                <Input id="saleAmount" name="saleAmount" type="number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue="1" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceReference">Invoice/reference optional</Label>
              <Input id="invoiceReference" name="invoiceReference" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit">Record sale and create commission</Button>
          </form>
        </FormSection>

        <FormSection title="Won leads">
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Customer</Th>
                <Th>Dealer</Th>
                <Th>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {wonLeads.map((lead) => (
                <tr key={lead.id}>
                  <Td className="font-medium text-slate-950">
                    {lead.leadNumber}
                    <p className="text-xs text-muted-foreground">{lead.id}</p>
                  </Td>
                  <Td>{lead.customer}</Td>
                  <Td>{lead.dealer}</Td>
                  <Td>{formatCurrency(lead.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
