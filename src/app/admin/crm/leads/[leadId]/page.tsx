import { ArrowLeft, Mail, MessageSquareText, Phone, ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  addLeadNote,
  overrideLeadAttribution,
  updateLeadStatus,
} from "@/features/admin/actions";
import { getAdminLeadById, listAdminDealers } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const { leadId } = await params;
  const [lead, dealers] = await Promise.all([
    getAdminLeadById(leadId),
    listAdminDealers(),
  ]);

  if (!lead) notFound();

  return (
    <AdminPageShell
      title={lead.leadNumber}
      description="Customer enquiry details, follow-up history, notes, and dealer attribution."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/crm/leads">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Leads
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{lead.source}</Badge>
          <Badge variant={lead.status === "WON" ? "default" : "outline"}>
            {lead.status}
          </Badge>
          {lead.status === "WON" ? (
            <Button asChild size="sm">
              <Link href={`/admin/sales?lead=${lead.id}`}>
                <ReceiptText className="size-4" aria-hidden="true" />
                Record sale
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{lead.customer.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <a className="flex items-center gap-2 hover:text-primary" href={`tel:${lead.customer.mobile}`}>
              <Phone className="size-4" aria-hidden="true" />
              {lead.customer.mobile}
            </a>
            {lead.customer.email ? (
              <a className="flex items-center gap-2 hover:text-primary" href={`mailto:${lead.customer.email}`}>
                <Mail className="size-4" aria-hidden="true" />
                {lead.customer.email}
              </a>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-950">
              {lead.dealer?.businessName ?? "Direct enquiry"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Created {dateTime.format(lead.createdAt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
              Customer message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lead.message || "No message was provided."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid content-start gap-6">
          <FormSection title="Products">
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Quantity</Th>
                  <Th>Snapshot price</Th>
                </tr>
              </thead>
              <tbody>
                {lead.items.map((item) => (
                  <tr key={item.id}>
                    <Td className="font-medium text-slate-950">{item.productName}</Td>
                    <Td>{item.sku}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>{formatCurrency(item.price)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </FormSection>

          <FormSection title="Status history">
            <Table>
              <thead>
                <tr>
                  <Th>Change</Th>
                  <Th>Note</Th>
                  <Th>Changed by</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {lead.history.length > 0 ? (
                  lead.history.map((entry) => (
                    <tr key={entry.id}>
                      <Td>
                        {(entry.previousStatus ?? "Created").replaceAll("_", " ")} to{" "}
                        {entry.newStatus.replaceAll("_", " ")}
                      </Td>
                      <Td>{entry.note ?? "-"}</Td>
                      <Td>{entry.changedBy ?? "System"}</Td>
                      <Td>{dateTime.format(entry.createdAt)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={4}>No status changes recorded yet.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </FormSection>

          <FormSection title="Internal notes">
            <div className="grid gap-4">
              <form action={addLeadNote} className="grid gap-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Textarea name="note" aria-label="Internal note" required />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="dealerVisible" />
                  Visible to attributed dealer
                </label>
                <Button type="submit" className="w-fit">Add note</Button>
              </form>
              {lead.notes.map((note) => (
                <div key={note.id} className="border-t pt-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-950">{note.author ?? "System"}</span>
                    <span className="text-xs text-muted-foreground">{dateTime.format(note.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{note.note}</p>
                  {note.dealerVisible ? <Badge className="mt-2" variant="outline">Dealer visible</Badge> : null}
                </div>
              ))}
            </div>
          </FormSection>
        </div>

        <div className="grid content-start gap-6">
          <FormSection title="Update status">
            <form action={updateLeadStatus} className="grid gap-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={lead.status}>
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
                <Label htmlFor="statusNote">Note</Label>
                <Textarea id="statusNote" name="note" />
              </div>
              <Button type="submit">Update status</Button>
            </form>
          </FormSection>

          <FormSection title="Dealer attribution">
            <form action={overrideLeadAttribution} className="grid gap-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="grid gap-2">
                <Label htmlFor="dealerId">Dealer</Label>
                <Select id="dealerId" name="dealerId" defaultValue={lead.dealer?.id ?? ""}>
                  <option value="">Direct enquiry</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.businessName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required minLength={8} />
              </div>
              <Button type="submit" variant="outline">Save attribution</Button>
            </form>
          </FormSection>
        </div>
      </div>
    </AdminPageShell>
  );
}
