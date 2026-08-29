import "server-only";

import { and, asc, eq, lte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { notificationJobs, notificationLogs } from "@/db/schema";
import { hasDatabaseUrl } from "@/lib/env";

type DispatchResult = {
  ok: boolean;
  providerResponse?: Record<string, unknown>;
  errorMessage?: string;
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
  channel: "IN_APP" | "EMAIL" | "WHATSAPP" | "WEB_PUSH";
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
      attempts: notificationJobs.attempts,
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

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }

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
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    skipped: false,
  };
}
