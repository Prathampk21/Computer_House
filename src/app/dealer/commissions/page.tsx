import { DealerPageShell } from "@/components/dealer/dealer-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import {
  listCurrentDealerCommissions,
  listCurrentDealerPayouts,
} from "@/features/dealers/data";
import { formatCurrency } from "@/lib/utils";

export default async function DealerCommissionsPage() {
  const [commissions, payouts] = await Promise.all([
    listCurrentDealerCommissions(),
    listCurrentDealerPayouts(),
  ]);

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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Paid date</Th>
                <Th>Amount</Th>
                <Th>Payment reference</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.length > 0 ? (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <Td>
                      {payout.paidAt
                        ? new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                          }).format(payout.paidAt)
                        : "Pending"}
                    </Td>
                    <Td>{formatCurrency(Number(payout.amount))}</Td>
                    <Td>{payout.paymentReference ?? "-"}</Td>
                    <Td>{payout.notes ?? "-"}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={4}>No payouts have been recorded yet.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </DealerPageShell>
  );
}
