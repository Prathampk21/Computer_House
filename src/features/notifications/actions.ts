"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { auditLogs, notificationJobs } from "@/db/schema";
import { processNotificationJob } from "@/features/notifications/processor";
import { requireRole } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/env";

export async function retryNotificationJob(formData: FormData) {
  const actor = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const jobId = z.string().uuid().parse(formData.get("jobId"));

  if (hasDatabaseUrl) {
    const db = getDb();
    const [job] = await db
      .select({ status: notificationJobs.status })
      .from(notificationJobs)
      .where(eq(notificationJobs.id, jobId))
      .limit(1);

    if (!job) throw new Error("Notification job not found.");
    if (job.status !== "FAILED") {
      throw new Error("Only failed notification jobs can be retried.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(notificationJobs)
        .set({
          status: "PENDING",
          scheduledAt: new Date(),
          failedAt: null,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(notificationJobs.id, jobId));
      await tx.insert(auditLogs).values({
        actorProfileId: actor.id,
        action: "NOTIFICATION_RETRIED",
        entityType: "notification_job",
        entityId: jobId,
      });
    });

    await processNotificationJob(jobId);
  }

  revalidatePath("/admin/marketing/notifications");
}
