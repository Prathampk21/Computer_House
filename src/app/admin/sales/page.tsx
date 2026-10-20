import { CheckCircle2, IndianRupee, ReceiptText } from "lucide-react";

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
  recordCommissionPayout,
  recordSale,
  updateCommission,
} from "@/features/admin/actions";
import {
  listAdminCommissions,
  listAdminPayouts,
  listAdminProducts,
  listAdminSales,
  listWonAdminLeads,
} from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value)
    : "Pending";
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const params = await searchParams;
  const selectedLeadId = pick(params.lead) ?? "";
  const [wonLeads, products, sales, commissions, payouts] = await Promise.all([
    listWonAdminLeads(),
    listAdminProducts(),
    listAdminSales(),
    listAdminCommissions(),
    listAdminPayouts(),
  ]);
  const canManageCommission = profile.role === "OWNER" || profile.role === "ADMIN";
  const selectedLead = wonLeads.find((lead) => lead.id === selectedLeadId);

  return (
    <AdminPageShell
      title="Sales and commissions"
      description="Record verified sales, review calculated dealer commission, approve adjustments, and track payouts."
    >
      {pick(params.recorded) ? (
        <p className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Sale recorded and eligible dealer commission created.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Record verified sale">
          <form action={recordSale} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="leadId">Won lead</Label>
              <Select
                id="leadId"
                name="leadId"
                defaultValue={selectedLeadId}
                required
              >
                <option value="" disabled>
                  Select an unrecorded won lead
                </option>
                {wonLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.leadNumber} - {lead.customer} - {lead.product}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productId">Sold product</Label>
              <Select id="productId" name="productId" defaultValue="" required>
                <option value="" disabled>
                  Select product
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="saleAmount">Final sale amount</Label>
                <Input
                  id="saleAmount"
                  name="saleAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={selectedLead ? String(selectedLead.amount) : ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceReference">Invoice/reference</Label>
              <Input id="invoiceReference" name="invoiceReference" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit" disabled={wonLeads.length === 0 || products.length === 0}>
              <ReceiptText className="size-4" aria-hidden="true" />
              Record sale
            </Button>
            {wonLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No won leads are waiting for a sale record.
              </p>
            ) : null}
          </form>
        </FormSection>

        <FormSection title="Sale history">
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Customer</Th>
                <Th>Dealer</Th>
                <Th>Amount</Th>
                <Th>Invoice</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <Td className="font-medium text-slate-950">{sale.leadNumber}</Td>
                    <Td>{sale.customer}</Td>
                    <Td>{sale.dealer}</Td>
                    <Td>{formatCurrency(sale.amount)}</Td>
                    <Td>{sale.invoiceReference ?? "-"}</Td>
                    <Td>{formatDate(sale.saleDate)}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={6}>No verified sales have been recorded.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </FormSection>
      </div>

      <div className="mt-6">
        <FormSection title="Dealer commissions">
          <Table>
            <thead>
              <tr>
                <Th>Lead / dealer</Th>
                <Th>Sale</Th>
                <Th>Rule</Th>
                <Th>Final amount</Th>
                <Th>Status</Th>
                {canManageCommission ? <Th>Action</Th> : null}
              </tr>
            </thead>
            <tbody>
              {commissions.length > 0 ? (
                commissions.map((commission) => (
                  <tr key={commission.id}>
                    <Td className="font-medium text-slate-950">
                      {commission.leadNumber}
                      <p className="text-xs text-muted-foreground">{commission.dealer}</p>
                    </Td>
                    <Td>{formatCurrency(commission.baseSaleAmount)}</Td>
                    <Td>{commission.commissionValue}%</Td>
                    <Td>{formatCurrency(commission.finalAmount)}</Td>
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
                    {canManageCommission ? (
                      <Td className="min-w-72">
                        {commission.status === "PAID" ? (
                          <span className="inline-flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Paid
                          </span>
                        ) : commission.status === "APPROVED" ? (
                          <form action={recordCommissionPayout} className="grid gap-2">
                            <input type="hidden" name="commissionId" value={commission.id} />
                            <Input
                              aria-label={`Payment reference for ${commission.leadNumber}`}
                              name="paymentReference"
                              placeholder="UPI/bank reference"
                              required
                            />
                            <Input
                              aria-label={`Payout note for ${commission.leadNumber}`}
                              name="notes"
                              placeholder="Optional note"
                            />
                            <Button type="submit" size="sm">
                              <IndianRupee className="size-4" aria-hidden="true" />
                              Record payout
                            </Button>
                          </form>
                        ) : (
                          <form action={updateCommission} className="grid gap-2">
                            <input type="hidden" name="commissionId" value={commission.id} />
                            <Input
                              aria-label={`Final commission for ${commission.leadNumber}`}
                              name="finalAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={commission.finalAmount}
                              required
                            />
                            <Select
                              aria-label={`Commission status for ${commission.leadNumber}`}
                              name="status"
                              defaultValue={commission.status}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </Select>
                            <Button type="submit" size="sm" variant="outline">
                              Save commission
                            </Button>
                          </form>
                        )}
                      </Td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={canManageCommission ? 6 : 5}>
                    Commission is created only for a verified dealer-attributed sale.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </FormSection>
      </div>

      <div className="mt-6">
        <FormSection title="Payout history">
          <Table>
            <thead>
              <tr>
                <Th>Dealer</Th>
                <Th>Amount</Th>
                <Th>Payment reference</Th>
                <Th>Paid date</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.length > 0 ? (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <Td className="font-medium text-slate-950">{payout.dealer}</Td>
                    <Td>{formatCurrency(payout.amount)}</Td>
                    <Td>{payout.paymentReference ?? "-"}</Td>
                    <Td>{formatDate(payout.paidAt)}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={4}>No commission payouts recorded.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
