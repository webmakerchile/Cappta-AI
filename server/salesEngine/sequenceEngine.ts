import { storage, salesEngine } from "../storage";
import type { SequenceStep, Sequence, SequenceRun } from "@shared/schema";

let socketEmit: ((sessionId: string, eventData: any) => void) | null = null;
let interval: NodeJS.Timeout | null = null;
let tickInProgress = false;

export function attachSequenceEmitter(emitter: (sessionId: string, eventData: any) => void) {
  socketEmit = emitter;
}

export function startSequenceWorker() {
  if (interval) return;
  interval = setInterval(async () => {
    if (tickInProgress) return;
    tickInProgress = true;
    try { await processDueRuns(); } catch (e: any) { console.error(`[seq-worker] ${e?.message}`); }
    finally { tickInProgress = false; }
  }, 30 * 1000);
  console.log("[sequenceEngine] worker started (30s tick)");
}

export async function triggerSequencesForEvent(
  tenantId: number,
  trigger: string,
  ctx: { sessionId?: string | null; userEmail: string; userName?: string | null; data?: any }
) {
  const seqs = await salesEngine.getSequencesByTenant(tenantId);
  const matches = seqs.filter(s => s.active === 1 && s.trigger === trigger);
  for (const seq of matches) {
    try {
      const existing = await salesEngine.getActiveSequenceRunForUser(tenantId, seq.id, ctx.userEmail);
      if (existing) continue;
      let steps: SequenceStep[] = [];
      try { steps = JSON.parse(seq.steps || "[]"); } catch {}
      if (!steps.length) continue;
      const firstDelay = steps[0].type === "wait" ? Math.max(0, (steps[0].delayMinutes || 0)) : 0;
      const nextRunAt = new Date(Date.now() + firstDelay * 60 * 1000);
      await salesEngine.createSequenceRun({
        tenantId,
        sequenceId: seq.id,
        sessionId: ctx.sessionId || null,
        userEmail: ctx.userEmail,
        userName: ctx.userName || null,
        currentStep: 0,
        status: "pending",
        nextRunAt,
        context: JSON.stringify(ctx.data || {}),
      });
    } catch (e: any) {
      console.error(`[sequenceEngine] trigger error: ${e?.message}`);
    }
  }
}

async function processDueRuns() {
  const now = new Date();
  const due = await salesEngine.getDueSequenceRuns(now, 25);
  for (const run of due) {
    await executeNextStep(run);
  }
}

async function executeNextStep(run: SequenceRun) {
  try {
    const seq = await salesEngine.getSequenceById(run.tenantId, run.sequenceId);
    if (!seq || seq.active !== 1) {
      await salesEngine.updateSequenceRun(run.id, { status: "stopped" });
      return;
    }
    let steps: SequenceStep[] = [];
    try { steps = JSON.parse(seq.steps || "[]"); } catch {}
    if (run.currentStep >= steps.length) {
      await salesEngine.updateSequenceRun(run.id, { status: "completed" });
      return;
    }
    const step = steps[run.currentStep];
    let nextDelayMinutes = 0;

    switch (step.type) {
      case "wait":
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
      case "send_message":
        await sendChatMessage(run, step.message || "");
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
      case "send_email":
        await sendEmail(run, step.subject || "Mensaje de seguimiento", step.message || "");
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
      case "tag":
        await addTagToSession(run, step.tag || "");
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
      case "webhook":
        await callWebhookStep(run, step.url || "", step.message || "");
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
      case "create_task":
        nextDelayMinutes = Math.max(0, step.delayMinutes || 0);
        break;
    }

    const nextStepIdx = run.currentStep + 1;
    if (nextStepIdx >= steps.length) {
      await salesEngine.updateSequenceRun(run.id, { status: "completed", currentStep: nextStepIdx });
    } else {
      const nextStep = steps[nextStepIdx];
      const stepDelay = nextStep.type === "wait" ? Math.max(0, nextStep.delayMinutes || 0) : 0;
      const totalDelay = Math.max(nextDelayMinutes, stepDelay);
      await salesEngine.updateSequenceRun(run.id, {
        status: "running",
        currentStep: nextStepIdx,
        nextRunAt: new Date(Date.now() + totalDelay * 60 * 1000),
      });
    }
  } catch (e: any) {
    console.error(`[sequenceEngine] step error: ${e?.message}`);
    await salesEngine.updateSequenceRun(run.id, { status: "error", lastError: String(e?.message || "unknown").slice(0, 400) });
  }
}

async function sendChatMessage(run: SequenceRun, message: string) {
  if (!run.sessionId || !message.trim()) return;
  const session = await storage.getSession(run.sessionId);
  if (!session) return;
  if (session.tenantId !== run.tenantId) {
    console.warn(`[sequenceEngine] cross-tenant session ${run.sessionId} blocked for run ${run.id}`);
    return;
  }
  const interpolated = interpolate(message, run);
  const msg = await storage.createMessage({
    sessionId: run.sessionId,
    tenantId: run.tenantId,
    userEmail: session.userEmail,
    userName: session.userName,
    sender: "support",
    content: interpolated,
    adminName: "Cappta Sequence",
    adminColor: "#7669E9",
  });
  if (socketEmit) {
    try { socketEmit(run.sessionId, { id: msg.id, sessionId: run.sessionId, sender: "support", content: msg.content, timestamp: msg.timestamp, adminName: msg.adminName, adminColor: msg.adminColor }); } catch {}
  }
}

async function sendEmail(run: SequenceRun, subject: string, body: string) {
  try {
    if (!run.userEmail || !run.userEmail.includes("@")) return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(`[sequenceEngine] RESEND_API_KEY missing — skipping email for ${run.userEmail}`);
      return;
    }
    const interpolatedBody = interpolate(body, run);
    const interpolatedSubject = interpolate(subject, run);
    const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;color:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#7669E9;padding:20px 28px;"><h1 style="margin:0;font-size:18px;">${interpolatedSubject}</h1></div>
      <div style="padding:24px 28px;color:#ddd;line-height:1.6;white-space:pre-wrap">${interpolatedBody.replace(/</g, "&lt;")}</div>
      <div style="padding:14px 28px;background:#111;text-align:center;color:#666;font-size:12px;">Enviado por Cappta AI</div>
    </div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Cappta AI <noreply@cappta.ai>", to: run.userEmail, subject: interpolatedSubject, html }),
    });
    if (!res.ok) console.error(`[sequenceEngine] email send failed: ${res.status} ${await res.text().catch(() => "")}`);
  } catch (e: any) {
    console.error(`[sequenceEngine] email failed: ${e?.message}`);
  }
}

async function addTagToSession(run: SequenceRun, tag: string) {
  if (!run.sessionId || !tag.trim()) return;
  const session = await storage.getSession(run.sessionId);
  if (!session) return;
  if (session.tenantId !== run.tenantId) {
    console.warn(`[sequenceEngine] cross-tenant tag blocked for run ${run.id}`);
    return;
  }
  const tags = Array.from(new Set([...(session.tags || []), tag]));
  await storage.updateSessionTags(run.sessionId, tags);
}

async function callWebhookStep(run: SequenceRun, url: string, payload: string) {
  if (!url) return;
  try {
    const { safeFetch } = await import("./safety");
    let data: any = { runId: run.id, sessionId: run.sessionId, userEmail: run.userEmail };
    try { data = { ...data, message: interpolate(payload || "", run) }; } catch {}
    await safeFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), timeoutMs: 10_000 });
  } catch (e: any) {
    console.error(`[sequenceEngine] webhook step failed: ${e?.message}`);
  }
}

function interpolate(template: string, run: SequenceRun): string {
  return template
    .replace(/\{\{name\}\}/gi, run.userName || "")
    .replace(/\{\{email\}\}/gi, run.userEmail)
    .replace(/\{\{firstName\}\}/gi, (run.userName || "").split(" ")[0] || "");
}
