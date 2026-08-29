import {
  Boxes,
  ClipboardList,
  HandCoins,
  Settings,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";

import { AdminDashboardCharts } from "@/components/admin/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import {
  getAdminDashboardMetrics,
  listAdminLeads,
} from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const modules = [
  [Boxes, "Catalog", "Products, categories, brands, specs, images, inventory"],
  [ClipboardList, "CRM", "Customers, enquiries, lead pipeline, status history"],
  [UsersRound, "Dealers", "Referral links, analytics, leads, commissions"],
  [HandCoins, "Sales", "Conversions, sale items, commission eligibility"],
  [Store, "Marketing", "Offers, subscriptions, notifications, history"],
  [Settings, "Administration", "Users, roles, branding, feature flags, audit logs"],
];

export default async function AdminPage() {
  const profile = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const [adminMetrics, recentLeads] = await Promise.all([
    getAdminDashboardMetrics(),
    listAdminLeads(4),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container-shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge>
              <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
              {profile.role} access
            </Badge>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">
              Admin dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Full shop control for a single independent client deployment.
            </p>
          </div>
        </div>
      </div>
      <div className="container-shell py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-950">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.delta}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-6">
          <AdminDashboardCharts />
        </section>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Admin modules</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {modules.map(([Icon, title, copy]) => (
                <div key={String(title)} className="rounded-lg border bg-slate-50 p-4">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-950">
                    {String(title)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(copy)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent leads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <thead>
                  <tr>
                    <Th>Lead</Th>
                    <Th>Product</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <Td className="font-medium text-slate-900">
                        {lead.leadNumber}
                      </Td>
                      <Td>{lead.product}</Td>
                      <Td>{lead.dealer}</Td>
                      <Td>
                        <Badge variant={lead.status === "WON" ? "default" : "outline"}>
                          {lead.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
