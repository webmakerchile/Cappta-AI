import { storage, salesEngine } from "../storage";
import type { Flow, FlowNode, FlowEdge } from "@shared/schema";
import { runIntegrationAction } from "./integrations";
import { isTenantPaid } from "./safety";

let socketEmit: ((sessionId: string, eventData: any) => void) | null = null;

export function attachFlowEmitter(emitter: (sessionId: string, eventData: any) => void) {
  socketEmit = emitter;
}

export async function triggerFlowsForEvent(
  tenantId: number,
  triggerType: string,
  ctx: { sessionId?: string | null; userEmail?: string; userName?: string | null; data?: any; [k: string]: any }
) {
  try {
    if (!(await isTenantPaid(tenantId))) return;
    const flows = await salesEngine.getActiveFlowsByTrigger(tenantId, triggerType);
    for (const flow of flows) {
      executeFlow(flow, ctx).catch(err => console.error(`[flowEngine] async exec ${flow.id}: ${err?.message}`));
    }
  } catch (e: any) {
    console.error(`[flowEngine] trigger error: ${e?.message}`);
  }
}

interface ExecContext {
  sessionId?: string | null;
  userEmail?: string;
  userName?: string | null;
  variables: Record<string, any>;
  log: Array<{ ts: number; nodeId: string; type: string; message: string }>;
}

export async function executeFlow(flow: Flow, ctx: any) {
  const run = await salesEngine.createFlowRun({
    tenantId: flow.tenantId,
    flowId: flow.id,
    sessionId: ctx.sessionId || null,
    status: "running",
    currentNodeId: null,
    context: JSON.stringify(ctx),
    log: "[]",
  });

  let nodes: FlowNode[] = [];
  let edges: FlowEdge[] = [];
  try { nodes = JSON.parse(flow.nodes || "[]"); } catch {}
  try { edges = JSON.parse(flow.edges || "[]"); } catch {}

  const exec: ExecContext = {
    sessionId: ctx.sessionId || null,
    userEmail: ctx.userEmail,
    userName: ctx.userName || null,
    variables: { ...(ctx.data || {}), ...ctx },
    log: [],
  };

  const trigger = nodes.find(n => n.type === "trigger");
  if (!trigger) {
    await salesEngine.updateFlowRun(run.id, { status: "failed", endedAt: new Date(), log: JSON.stringify([{ ts: Date.now(), nodeId: "_", type: "error", message: "no trigger node" }]) });
    return;
  }

  let currentId: string | null = trigger.id;
  let safety = 0;
  const MAX_NODES = 50;

  try {
    while (currentId && safety < MAX_NODES) {
      safety++;
      const node = nodes.find(n => n.id === currentId);
      if (!node) break;

      let nextHandle: string | undefined = undefined;
      try {
        nextHandle = await runNode(flow, node, exec);
      } catch (e: any) {
        exec.log.push({ ts: Date.now(), nodeId: node.id, type: "error", message: e?.message || "unknown" });
        await salesEngine.updateFlowRun(run.id, { status: "failed", currentNodeId: node.id, endedAt: new Date(), log: JSON.stringify(exec.log) });
        return;
      }

      if (node.type === "end") break;

      const outgoing = edges.filter(e => e.source === currentId);
      let next = outgoing[0];
      if (nextHandle) {
        const matched = outgoing.find(e => e.sourceHandle === nextHandle);
        if (matched) next = matched;
      }
      currentId = next?.target || null;
    }
    await salesEngine.updateFlowRun(run.id, { status: "completed", currentNodeId: currentId, endedAt: new Date(), log: JSON.stringify(exec.log) });
    await salesEngine.incrementFlowRunCount(flow.id);
  } catch (e: any) {
    exec.log.push({ ts: Date.now(), nodeId: currentId || "_", type: "error", message: e?.message || "unknown" });
    await salesEngine.updateFlowRun(run.id, { status: "failed", endedAt: new Date(), log: JSON.stringify(exec.log) });
  }
}

async function runNode(flow: Flow, node: FlowNode, exec: ExecContext): Promise<string | undefined> {
  exec.log.push({ ts: Date.now(), nodeId: node.id, type: node.type, message: `executing` });

  switch (node.type) {
    case "trigger":
      return undefined;

    case "send_message": {
      const text = interpolate(String(node.data?.message || ""), exec);
      if (exec.sessionId && text.trim()) {
        const session = await storage.getSession(exec.sessionId);
        if (session && session.tenantId === flow.tenantId) {
          const msg = await storage.createMessage({
            sessionId: exec.sessionId,
            tenantId: flow.tenantId,
            userEmail: session.userEmail,
            userName: session.userName,
            sender: "support",
            content: text,
            adminName: "Cappta Flow",
            adminColor: "#7669E9",
          });
          if (socketEmit) {
            try { socketEmit(exec.sessionId, { id: msg.id, sessionId: exec.sessionId, sender: "support", content: msg.content, timestamp: msg.timestamp, adminName: msg.adminName, adminColor: msg.adminColor }); } catch {}
          }
        }
      }
      return undefined;
    }

    case "wait": {
      // For V1, simulate as no-op; real waits should re-enqueue. Cap at 5 seconds for safety.
      const ms = Math.min(5000, Math.max(0, Number(node.data?.delayMs) || 0));
      if (ms > 0) await new Promise(r => setTimeout(r, ms));
      return undefined;
    }

    case "condition": {
      const left = interpolate(String(node.data?.left || ""), exec);
      const op = String(node.data?.operator || "equals");
      const right = interpolate(String(node.data?.right || ""), exec);
      let truthy = false;
      switch (op) {
        case "equals": truthy = left === right; break;
        case "not_equals": truthy = left !== right; break;
        case "contains": truthy = left.toLowerCase().includes(right.toLowerCase()); break;
        case "gt": truthy = Number(left) > Number(right); break;
        case "lt": truthy = Number(left) < Number(right); break;
        default: truthy = Boolean(left);
      }
      return truthy ? "true" : "false";
    }

    case "tag": {
      if (exec.sessionId && node.data?.tag) {
        const session = await storage.getSession(exec.sessionId);
        if (session && session.tenantId === flow.tenantId) {
          const tags = Array.from(new Set([...(session.tags || []), String(node.data.tag)]));
          await storage.updateSessionTags(exec.sessionId, tags);
        }
      }
      return undefined;
    }

    case "lead_score": {
      if (exec.sessionId) {
        try {
          const session = await storage.getSession(exec.sessionId);
          if (!session || session.tenantId !== flow.tenantId) return undefined;
          const { calculateAndStoreLeadScore } = await import("./leadScorer");
          await calculateAndStoreLeadScore(flow.tenantId, exec.sessionId);
        } catch {}
      }
      return undefined;
    }

    case "integration": {
      const integrationId = Number(node.data?.integrationId);
      if (!integrationId) return undefined;
      const data: Record<string, any> = {};
      const mapping = node.data?.dataMapping || {};
      for (const [key, src] of Object.entries(mapping as Record<string, string>)) {
        data[key] = interpolate(String(src), exec);
      }
      if (Object.keys(data).length === 0) {
        data.userEmail = exec.userEmail;
        data.userName = exec.userName;
        data.sessionId = exec.sessionId;
        Object.assign(data, exec.variables);
      }
      const result = await runIntegrationAction({
        tenantId: flow.tenantId,
        integrationId,
        action: String(node.data?.action || "default"),
        data,
      });
      exec.log.push({ ts: Date.now(), nodeId: node.id, type: "integration_result", message: result.ok ? `ok ${result.status || ""}` : `fail ${result.error || result.status || ""}` });
      return result.ok ? "success" : "error";
    }

    case "ai_response": {
      // For V1, no-op; could call OpenAI here in future
      return undefined;
    }

    case "end":
      return undefined;

    default:
      return undefined;
  }
}

function interpolate(template: string, exec: ExecContext): string {
  return template
    .replace(/\{\{name\}\}/gi, exec.userName || "")
    .replace(/\{\{email\}\}/gi, exec.userEmail || "")
    .replace(/\{\{sessionId\}\}/gi, exec.sessionId || "")
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = exec.variables[key];
      return v != null ? String(v) : "";
    });
}
