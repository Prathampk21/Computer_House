import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { listAdminNotificationJobs } from "@/features/admin/data";
import { requireRole } from "@/lib/auth";

export default async function AdminNotificationsPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const jobs = await listAdminNotificationJobs();

  return (
    <AdminPageShell
      title="Notifications"
      description="Notification jobs are queued after product-change events and processed outside product update transactions."
    >
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/admin/marketing/subscriptions">View subscriptions</Link>
        </Button>
      </div>
      <FormSection title="Notification jobs">
        <Table>
          <thead>
            <tr>
              <Th>Recipient</Th>
              <Th>Channel</Th>
              <Th>Event</Th>
              <Th>Status</Th>
              <Th>Attempts</Th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <Td className="font-medium text-slate-950">{job.recipient}</Td>
                <Td>{job.channel}</Td>
                <Td>{job.event}</Td>
                <Td>
                  <Badge
                    variant={
                      job.status === "FAILED"
                        ? "destructive"
                        : job.status === "SENT"
                          ? "default"
                          : "outline"
                    }
                  >
                    {job.status}
                  </Badge>
                </Td>
                <Td>{job.attempts}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </FormSection>
    </AdminPageShell>
  );
}
