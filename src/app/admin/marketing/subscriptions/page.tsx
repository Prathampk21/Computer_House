import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { listAdminSubscriptions } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export default async function AdminSubscriptionsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const subscriptions = await listAdminSubscriptions();

  return (
    <AdminPageShell
      title="Customer subscriptions"
      description="Customers must provide contact information and consent before automated notification jobs are created."
    >
      <FormSection title="Active subscriptions">
        <Table>
          <thead>
            <tr>
              <Th>Contact</Th>
              <Th>Target</Th>
              <Th>Events</Th>
              <Th>Consent</Th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <Td className="font-medium text-slate-950">
                  {subscription.contact}
                </Td>
                <Td>{subscription.target}</Td>
                <Td>{subscription.events}</Td>
                <Td>
                  <Badge>{subscription.consent}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </FormSection>
    </AdminPageShell>
  );
}
