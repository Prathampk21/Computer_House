import { ArrowLeft, Ban, KeyRound, Power } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetDealerPassword,
  setDealerActive,
  updateDealer,
} from "@/features/admin/actions";
import { getAdminDealerById } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDealerPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  const [{ dealerId }, query] = await Promise.all([params, searchParams]);
  const dealer = await getAdminDealerById(dealerId);

  if (!dealer) notFound();

  const referralUrl = absoluteUrl(`/?ref=${dealer.referralCode}`);
  const notice = pick(query.created)
    ? "Dealer account and login created."
    : pick(query.saved)
      ? "Dealer changes saved."
      : pick(query.password)
        ? pick(query.password) === "emailed"
          ? "Password reset email sent to the dealer."
          : "Temporary password updated."
        : null;

  return (
    <AdminPageShell
      title={dealer.businessName}
      description="Manage dealer access, referral attribution, and default commission settings."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/dealers">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dealers
          </Link>
        </Button>
        <div className="flex gap-2">
          <Badge variant={dealer.active ? "default" : "outline"}>
            {dealer.active ? "Active" : "Inactive"}
          </Badge>
          <Badge variant={dealer.hasLogin ? "default" : "destructive"}>
            {dealer.hasLogin ? "Login linked" : "Login missing"}
          </Badge>
        </div>
      </div>

      {notice ? (
        <p className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Referral clicks", dealer.referralClicks],
          ["Attributed leads", dealer.leads],
          ["Commissions", dealer.commissions],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <FormSection title="Dealer details">
          <form action={updateDealer} className="grid gap-4">
            <input type="hidden" name="dealerId" value={dealer.id} />
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                name="businessName"
                defaultValue={dealer.businessName}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={dealer.contactName}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" name="mobile" defaultValue={dealer.mobile} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Login email</Label>
                <Input id="email" value={dealer.email ?? ""} readOnly disabled />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commissionValue">Default commission %</Label>
              <Input
                id="commissionValue"
                name="commissionValue"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={String(dealer.commissionValue ?? 0)}
                required
              />
            </div>
            <Button type="submit">Save dealer</Button>
          </form>
        </FormSection>

        <div className="grid content-start gap-6">
          <FormSection title="Referral link">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="referralCode">Referral code</Label>
                <Input id="referralCode" value={dealer.referralCode} readOnly />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input aria-label="Referral URL" value={referralUrl} readOnly />
                <CopyButton value={referralUrl} label="Copy link" />
              </div>
            </div>
          </FormSection>

          {dealer.hasLogin ? (
            <FormSection title="Reset password">
              <form action={resetDealerPassword} className="grid gap-3">
                <input type="hidden" name="dealerId" value={dealer.id} />
                {hasSupabaseAdminConfig ? (
                  <div className="grid gap-2">
                    <Label htmlFor="temporaryPassword">New temporary password</Label>
                    <Input
                      id="temporaryPassword"
                      name="temporaryPassword"
                      type="password"
                      minLength={10}
                      required
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Send a secure reset link to {dealer.email}.
                  </p>
                )}
                <Button type="submit" variant="outline">
                  <KeyRound className="size-4" aria-hidden="true" />
                  {hasSupabaseAdminConfig
                    ? "Set temporary password"
                    : "Send password reset email"}
                </Button>
              </form>
            </FormSection>
          ) : null}

          <FormSection title="Portal access">
            <form action={setDealerActive}>
              <input type="hidden" name="dealerId" value={dealer.id} />
              <input type="hidden" name="active" value={dealer.active ? "false" : "true"} />
              <Button type="submit" variant={dealer.active ? "destructive" : "default"}>
                {dealer.active ? (
                  <Ban className="size-4" aria-hidden="true" />
                ) : (
                  <Power className="size-4" aria-hidden="true" />
                )}
                {dealer.active ? "Deactivate dealer" : "Activate dealer"}
              </Button>
            </form>
          </FormSection>
        </div>
      </div>
    </AdminPageShell>
  );
}
