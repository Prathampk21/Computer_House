import { Bell, Heart, UserRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { getAccountOverview } from "@/features/account/data";
import { formatCurrency } from "@/lib/utils";

export default async function AccountPage() {
  const account = await getAccountOverview();

  if (!account.profile) {
    return (
      <div className="container-shell py-8">
        <Card className="max-w-xl">
          <CardHeader>
            <UserRound className="size-6 text-primary" aria-hidden="true" />
            <CardTitle className="mt-3">Customer account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Sign in to view enquiry history, notification subscriptions, and
              saved product activity for this deployment.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-shell py-8">
      <h1 className="text-3xl font-bold text-slate-950">Customer account</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Review profile details, enquiries, saved interest, and notification
        preferences connected to your signed-in account.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          [UserRound, "Profile", account.profile.email],
          [
            Heart,
            "Enquiries",
            `${account.leads.length} enquiry${account.leads.length === 1 ? "" : "ies"}`,
          ],
          [
            Bell,
            "Preferences",
            `${account.subscriptions.length} active/tracked subscription${account.subscriptions.length === 1 ? "" : "s"}`,
          ],
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)}>
            <CardHeader>
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="mt-3">{String(title)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{String(copy)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enquiry history</CardTitle>
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
                {account.leads.length > 0 ? (
                  account.leads.map((lead) => (
                    <tr key={lead.id}>
                      <Td className="font-medium text-slate-950">
                        {lead.leadNumber}
                        <p className="text-xs text-muted-foreground">
                          {lead.source}
                        </p>
                      </Td>
                      <Td>{lead.productName ?? "Multiple products"}</Td>
                      <Td>
                        <Badge variant={lead.status === "WON" ? "default" : "outline"}>
                          {lead.status}
                        </Badge>
                      </Td>
                      <Td>{formatCurrency(lead.amount ?? 0)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={4}>No enquiries are linked to this account yet.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Events</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {account.subscriptions.length > 0 ? (
                  account.subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <Td>{subscription.productName ?? "Catalogue"}</Td>
                      <Td>{subscription.eventTypes.join(", ")}</Td>
                      <Td>
                        <Badge
                          variant={
                            subscription.active && subscription.consentGiven
                              ? "default"
                              : "outline"
                          }
                        >
                          {subscription.active && subscription.consentGiven
                            ? "Active"
                            : "Paused"}
                        </Badge>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={3}>No notification subscriptions yet.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
