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
  overrideLeadAttribution,
  updateLeadStatus,
} from "@/features/admin/actions";
import { listAdminLeads } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function AdminLeadsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const leads = await listAdminLeads();

  return (
    <AdminPageShell
      title="Leads"
      description="Manage enquiries, status history, internal notes, dealer attribution, and lead pipeline."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <FormSection title="Lead pipeline">
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th>Dealer</Th>
                <Th>Status</Th>
                <Th>Value</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <Td className="font-medium text-slate-950">
                    {lead.leadNumber}
                    <p className="text-xs text-muted-foreground">{lead.id}</p>
                    <p className="text-xs text-muted-foreground">{lead.source}</p>
                  </Td>
                  <Td>
                    {lead.customer}
                    <p className="text-xs text-muted-foreground">{lead.mobile}</p>
                  </Td>
                  <Td>{lead.product}</Td>
                  <Td>{lead.dealer}</Td>
                  <Td>
                    <Badge variant={lead.status === "WON" ? "default" : "outline"}>
                      {lead.status}
                    </Badge>
                  </Td>
                  <Td>{formatCurrency(lead.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>

        <div className="grid gap-6">
          <FormSection title="Update lead status">
            <form action={updateLeadStatus} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="leadId">Lead UUID</Label>
                <Input id="leadId" name="leadId" placeholder="Production lead id" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status">
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NEGOTIATING">Negotiating</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" />
              </div>
              <Button type="submit">Update status</Button>
            </form>
          </FormSection>

          <FormSection title="Override attribution">
            <form action={overrideLeadAttribution} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="overrideLeadId">Lead UUID</Label>
                <Input id="overrideLeadId" name="leadId" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dealerId">Dealer UUID optional</Label>
                <Input id="dealerId" name="dealerId" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required />
              </div>
              <Button type="submit" variant="outline">
                Save audited override
              </Button>
            </form>
          </FormSection>
        </div>
      </div>
    </AdminPageShell>
  );
}
