import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { createDealer } from "@/features/admin/actions";
import { listAdminDealers } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { absoluteUrl } from "@/lib/utils";

export default async function AdminDealersPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const dealers = await listAdminDealers();

  return (
    <AdminPageShell
      title="Dealers"
      description="Create dealers, issue non-sequential referral codes, and keep referral analytics separate from leads."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Create dealer">
          <form action={createDealer} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" name="businessName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" name="contactName" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" name="mobile" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email optional</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commissionValue">Default commission %</Label>
              <Input
                id="commissionValue"
                name="commissionValue"
                type="number"
                defaultValue="5"
              />
            </div>
            <Button type="submit">Create dealer</Button>
          </form>
        </FormSection>

        <FormSection title="Dealer referral links">
          <Table>
            <thead>
              <tr>
                <Th>Dealer</Th>
                <Th>Code</Th>
                <Th>Mobile</Th>
                <Th>Referral URL</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((dealer) => (
                <tr key={dealer.id}>
                  <Td>
                    <span className="font-medium text-slate-950">
                      {dealer.businessName}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {dealer.contactName}
                    </p>
                  </Td>
                  <Td>{dealer.referralCode}</Td>
                  <Td>{dealer.mobile}</Td>
                  <Td className="max-w-80 break-all text-xs">
                    {absoluteUrl(`/?ref=${dealer.referralCode}`)}
                  </Td>
                  <Td>
                    <Badge>{dealer.active ? "Active" : "Inactive"}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
