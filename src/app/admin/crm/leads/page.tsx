import { Search } from "lucide-react";
import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { listAdminLeads } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const params = await searchParams;
  const query = pick(params.q)?.trim().toLowerCase() ?? "";
  const status = pick(params.status) ?? "";
  const leads = (await listAdminLeads(200)).filter((lead) => {
    const matchesQuery =
      !query ||
      [lead.leadNumber, lead.customer, lead.mobile, lead.product, lead.dealer]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesQuery && (!status || lead.status === status);
  });

  return (
    <AdminPageShell
      title="Leads"
      description="Review enquiries, customer details, follow-up status, dealer attribution, and sales progress."
    >
      <form className="mb-5 flex flex-col gap-3 sm:flex-row" method="get">
        <Input
          aria-label="Search leads"
          name="q"
          defaultValue={pick(params.q) ?? ""}
          placeholder="Search lead, customer, mobile, product, or dealer"
        />
        <Select aria-label="Filter by status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="INTERESTED">Interested</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Button type="submit" variant="outline">
          <Search className="size-4" aria-hidden="true" />
          Filter
        </Button>
      </form>

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
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <Td className="font-medium text-slate-950">
                    {lead.leadNumber}
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
                  <Td>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/crm/leads/${lead.id}`}>Open</Link>
                    </Button>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={7}>No leads match the selected filters.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </FormSection>
    </AdminPageShell>
  );
}
