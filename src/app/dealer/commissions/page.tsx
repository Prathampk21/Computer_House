import { DealerPageShell } from "@/components/dealer/dealer-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { listCurrentDealerCommissions } from "@/features/dealers/data";
import { formatCurrency } from "@/lib/utils";

export default async function DealerCommissionsPage() {
  const commissions = await listCurrentDealerCommissions();

  return (
    <DealerPageShell
      title="My commissions"
      description="Pending, approved, and paid commission records are based on verified sales, not referral clicks."
    >
      <Card>
        <CardHeader>
          <CardTitle>Commission history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Base sale</Th>
                <Th>Commission</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <Td className="font-medium text-slate-950">
                    {commission.leadNumber}
                  </Td>
                  <Td>{formatCurrency(Number(commission.baseSaleAmount))}</Td>
                  <Td>{formatCurrency(Number(commission.finalAmount))}</Td>
                  <Td>
                    <Badge
                      variant={
                        commission.status === "PAID"
                          ? "default"
                          : commission.status === "REJECTED"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {commission.status}
                    </Badge>
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
