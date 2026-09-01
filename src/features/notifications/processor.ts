import "server-only";

import { and, asc, eq, lte, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import { notificationJobs, notificationLogs } from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";

type DispatchResult = {
  ok: boolean;
  providerResponse?: Record<string, unknown>;
  errorMessage?: string;
};

type NotificationChannel = "IN_APP" | "EMAIL" | "WHATSAPP" | "WEB_PUSH";

type NotificationJob = {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  payload: Record<string, unknown>;
};

async function postWebhook(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      errorMessage: `Provider responded ${response.status}: ${text.slice(0, 300)}`,
    };
  }

  return {
    ok: true,
    providerResponse: {
      status: response.status,
      body: text.slice(0, 500),
    },
  };
}

async function dispatchNotification(input: {
  channel: NotificationChannel;
  recipient: string;
  payload: Record<string, unknown>;
}): Promise<DispatchResult> {
  if (input.channel === "IN_APP") {
    return { ok: true, providerResponse: { stored: true } };
  }

  const webhookByChannel = {
    EMAIL: process.env.EMAIL_PROVIDER_WEBHOOK_URL,
    WHATSAPP: process.env.WHATSAPP_PROVIDER_WEBHOOK_URL,
    WEB_PUSH: process.env.WEB_PUSH_PROVIDER_WEBHOOK_URL,
  } satisfies Record<Exclude<typeof input.channel, "IN_APP">, string | undefined>;

  const webhookUrl = webhookByChannel[input.channel];

  if (!webhookUrl) {
    return {
      ok: false,
      errorMessage: `${input.channel} provider webhook is not configured.`,
    };
  }

  return postWebhook(webhookUrl, {
    recipient: input.recipient,
    channel: input.channel,
    payload: input.payload,
  });
}

async function processJob(db: Database, job: NotificationJob) {
  await db
    .update(notificationJobs)
    .set({
      status: "PROCESSING",
      attempts: sql`${notificationJobs.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(notificationJobs.id, job.id));

  const result = await dispatchNotification({
    channel: job.channel,
    recipient: job.recipient,
    payload: job.payload,
  });
  const status = result.ok ? "SENT" : "FAILED";

  await db.transaction(async (tx) => {
    await tx
      .update(notificationJobs)
      .set({
        status,
        sentAt: result.ok ? new Date() : null,
        failedAt: result.ok ? null : new Date(),
        errorMessage: result.errorMessage ?? null,
        updatedAt: new Date(),
      })
      .where(eq(notificationJobs.id, job.id));

    await tx.insert(notificationLogs).values({
      notificationJobId: job.id,
      channel: job.channel,
      recipient: job.recipient,
      status,
      providerResponse: result.providerResponse,
      errorMessage: result.errorMessage,
    });
  });

  return result.ok;
}

export async function processNotificationJob(jobId: string) {
  if (!hasDatabaseUrl) {
    return { processed: 0, sent: 0, failed: 0, skipped: true };
  }

  const db = getDb();
  const [job] = await db
    .select({
      id: notificationJobs.id,
      channel: notificationJobs.channel,
      recipient: notificationJobs.recipient,
      payload: notificationJobs.payload,
    })
    .from(notificationJobs)
    .where(
      and(
        eq(notificationJobs.id, jobId),
        eq(notificationJobs.status, "PENDING"),
        lte(notificationJobs.scheduledAt, new Date()),
      ),
    )
    .limit(1);

  if (!job) {
    return { processed: 0, sent: 0, failed: 0, skipped: false };
  }

  const sent = await processJob(db, job);

  return {
    processed: 1,
    sent: sent ? 1 : 0,
    failed: sent ? 0 : 1,
    skipped: false,
  };
}

export async function processNotificationJobs(limit = 20) {
  if (!hasDatabaseUrl) {
    return { processed: 0, sent: 0, failed: 0, skipped: true };
  }

  const db = getDb();
  const jobs = await db
    .select({
      id: notificationJobs.id,
      channel: notificationJobs.channel,
      recipient: notificationJobs.recipient,
      payload: notificationJobs.payload,
    })
    .from(notificationJobs)
    .where(
      and(
        eq(notificationJobs.status, "PENDING"),
        lte(notificationJobs.scheduledAt, new Date()),
      ),
    )
    .orderBy(asc(notificationJobs.createdAt))
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const ok = await processJob(db, job);

    if (ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    skipped: false,
  };
}
