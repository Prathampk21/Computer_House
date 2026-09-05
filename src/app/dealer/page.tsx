import { BarChart3, HandCoins, Link2, Share2 } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { DealerQrCard } from "@/components/dealer/dealer-qr-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import {
  getCurrentDealerMetrics,
  listCurrentDealerLeads,
  requireCurrentDealer,
} from "@/features/dealers/data";
import { absoluteUrl, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerPage() {
  const [{ dealer }, dealerMetrics, leadRows] = await Promise.all([
    requireCurrentDealer(),
    getCurrentDealerMetrics(),
    listCurrentDealerLeads(),
  ]);
  const referralUrl = absoluteUrl(`/?ref=${dealer.referralCode}`);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container-shell py-6">
          <div className="flex items-start gap-3">
            <BrandLogo size="lg" />
            <div>
              <Badge>
                <Link2 className="mr-1 size-3.5" aria-hidden="true" />
                {dealer.referralCode}
              </Badge>
              <h1 className="mt-3 text-3xl font-bold text-slate-950">
                Dealer dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Share your referral link and track the enquiries, visits, and
                commissions connected to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="container-shell grid gap-6 py-6 lg:grid-cols-[0.8fr_1.2fr]">
        <DealerQrCard referralUrl={referralUrl} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dealerMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-950">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="container-shell grid gap-6 pb-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>My leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Product</Th>
                  <Th>Status</Th>
                  <Th>Value</Th>
                </tr>
              </thead>
              <tbody>
                {leadRows.map((lead) => (
                  <tr key={lead.id}>
                    <Td className="font-medium text-slate-900">
                      {lead.leadNumber}
                    </Td>
                    <Td>{lead.productName}</Td>
                    <Td>
                      <Badge
                        variant={lead.status === "WON" ? "default" : "outline"}
                      >
                        {lead.status}
                      </Badge>
                    </Td>
                    <Td>{formatCurrency(Number(lead.amount ?? 0))}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dealer toolkit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="flex gap-3">
              <Share2 className="mt-0.5 size-4 shrink-0 text-primary" />
              Share your referral link with customers and use the QR code for
              walk-in or field enquiries.
            </p>
            <p className="flex gap-3">
              <BarChart3 className="mt-0.5 size-4 shrink-0 text-primary" />
              Track visits, product views, leads, and won enquiries connected to
              your referral code.
            </p>
            <p className="flex gap-3">
              <HandCoins className="mt-0.5 size-4 shrink-0 text-primary" />
              Review pending, approved, and paid commissions after Computer
              House verifies the sale.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
