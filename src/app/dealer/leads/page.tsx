import { DealerPageShell } from "@/components/dealer/dealer-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { listCurrentDealerLeads } from "@/features/dealers/data";
import { formatCurrency } from "@/lib/utils";

export default async function DealerLeadsPage() {
  const leads = await listCurrentDealerLeads();

  return (
    <DealerPageShell
      title="My leads"
      description="Dealer views are filtered server-side to the authenticated dealer. Confidential admin-only notes are not shown here."
    >
      <Card>
        <CardHeader>
          <CardTitle>Assigned leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Product</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th>Value</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <Td className="font-medium text-slate-950">
                    {lead.leadNumber}
                  </Td>
                  <Td>{lead.productName ?? "-"}</Td>
                  <Td>{lead.source}</Td>
                  <Td>
                    <Badge variant={lead.status === "WON" ? "default" : "outline"}>
                      {lead.status}
                    </Badge>
                  </Td>
                  <Td>
                    {formatCurrency(Number(lead.amount ?? 0))}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </DealerPageShell>
  );
}
