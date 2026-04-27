import crypto from "crypto";
import { salesEngine } from "../storage";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [5000, 30000, 120000];
const TIMEOUT_MS = 8000;

const queue: Array<{ tenantId: number; endpointId: number; event: string; payload: any; attempt: number }> = [];
let processing = false;

export async function dispatchWebhookEvent(tenantId: number, event: string, data: any) {
  try {
    const endpoints = await salesEngine.getActiveWebhookEndpointsForEvent(tenantId, event);
    for (const ep of endpoints) {
      enqueue({ tenantId, endpointId: ep.id, event, payload: { event, data, timestamp: new Date().toISOString() }, attempt: 0 });
    }
  } catch (e: any) {
    console.error(`[webhook] dispatch error: ${e?.message}`);
  }
}

export function dispatchWebhookToEndpoint(tenantId: number, endpointId: number, event: string, data: any) {
  enqueue({ tenantId, endpointId, event, payload: { event, data, timestamp: new Date().toISOString() }, attempt: 0 });
}

function enqueue(job: { tenantId: number; endpointId: number; event: string; payload: any; attempt: number }) {
  queue.push(job);
  if (!processing) processQueue();
}

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    await deliverOnce(job);
  }
  processing = false;
}

async function deliverOnce(job: { tenantId: number; endpointId: number; event: string; payload: any; attempt: number }) {
  const ep = await salesEngine.getWebhookEndpointById(job.tenantId, job.endpointId);
  if (!ep || ep.active !== 1) return;

  const body = JSON.stringify(job.payload);
  const ts = Date.now().toString();
  const signature = crypto.createHmac("sha256", ep.secret).update(`${ts}.${body}`).digest("hex");

  let statusCode = 0;
  let response = "";
  let success = false;

  try {
    const { safeFetch } = await import("./safety");
    const res = await safeFetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cappta-Signature": `t=${ts},v1=${signature}`,
        "X-Cappta-Event": job.event,
        "X-Cappta-Delivery": crypto.randomUUID(),
        "User-Agent": "Cappta-Webhooks/1.0",
      },
      body,
      timeoutMs: TIMEOUT_MS,
    });
    statusCode = res.status;
    response = (await res.text()).slice(0, 2000);
    success = res.ok;
  } catch (e: any) {
    response = `Network error: ${e?.message || "unknown"}`;
  }

  try {
    await salesEngine.createWebhookDelivery({
      tenantId: job.tenantId,
      endpointId: job.endpointId,
      event: job.event,
      payload: body,
      statusCode: statusCode || null,
      response,
      attempts: job.attempt + 1,
      success: success ? 1 : 0,
    });
  } catch {}

  if (success) {
    try { await salesEngine.recordWebhookEndpointSuccess(job.endpointId); } catch {}
  } else {
    try { await salesEngine.recordWebhookEndpointFailure(job.endpointId); } catch {}
    if (job.attempt + 1 < MAX_ATTEMPTS) {
      const delay = RETRY_DELAYS[job.attempt] || 60000;
      setTimeout(() => enqueue({ ...job, attempt: job.attempt + 1 }), delay);
    }
  }
}
