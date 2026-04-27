import type { Express } from "express";
import crypto from "crypto";
import { z } from "zod";
import { storage, salesEngine } from "../storage";
import { authenticateApiRequest, generateApiKey, requireScope } from "./apiKeys";
import { calculateAndStoreLeadScore, scheduleLeadScore } from "./leadScorer";
import { triggerSequencesForEvent, attachSequenceEmitter, startSequenceWorker } from "./sequenceEngine";
import { triggerFlowsForEvent, attachFlowEmitter, executeFlow } from "./flowEngine";
import { runIntegrationAction, testIntegration } from "./integrations";
import { dispatchWebhookEvent } from "./webhookDispatcher";
import {
  insertSequenceSchema, insertFlowSchema, insertIntegrationSchema, insertApiKeySchema, insertWebhookEndpointSchema,
  ALL_WEBHOOK_EVENTS,
} from "@shared/schema";

const PAID_PLANS = ["solo", "basic", "scale", "pro", "enterprise"];

export interface SalesEngineDeps {
  requireTenantAuth: (req: any, res: any) => any;
  requireTenantOwnerOrAdmin: (req: any, res: any) => any;
  emitToTenantRoom: (sessionId: string, eventData: any) => void;
}

export function registerSalesEngineRoutes(app: Express, deps: SalesEngineDeps) {
  const { requireTenantAuth, requireTenantOwnerOrAdmin, emitToTenantRoom } = deps;

  attachSequenceEmitter(emitToTenantRoom);
  attachFlowEmitter(emitToTenantRoom);
  startSequenceWorker();

  async function gatePaid(req: any, res: any): Promise<{ tenantId: number; role: string } | null> {
    const auth = requireTenantAuth(req, res);
    if (!auth) return null;
    const tenant = await storage.getTenantById(auth.id);
    if (!tenant) { res.status(404).json({ message: "Tenant no encontrado" }); return null; }
    const plan = tenant.plan || "free";
    if (!PAID_PLANS.includes(plan)) {
      res.status(402).json({ message: "Esta funcion requiere un plan de pago", plan, requiresUpgrade: true });
      return null;
    }
    return { tenantId: auth.id, role: auth.role };
  }

  // ==========================================================================
  // LEAD SCORES
  // ==========================================================================
  app.get("/api/sales/lead-scores", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const temperature = req.query.temperature as any;
      const limit = Math.min(500, parseInt(req.query.limit as any) || 100);
      const scores = await salesEngine.getLeadScoresByTenant(ctx.tenantId, { temperature, limit });
      res.json(scores);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/lead-scores/stats", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const stats = await salesEngine.getLeadScoreStats(ctx.tenantId);
      res.json(stats);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/lead-scores/session/:sessionId", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const ls = await salesEngine.getLatestLeadScore(ctx.tenantId, req.params.sessionId);
      res.json(ls || null);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/lead-scores/calculate/:sessionId", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const result = await calculateAndStoreLeadScore(ctx.tenantId, req.params.sessionId);
      if (!result) return res.status(400).json({ message: "No se pudo calcular (sesion sin mensajes o sin acceso)" });
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // SEQUENCES
  // ==========================================================================
  app.get("/api/sales/sequences", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const seqs = await salesEngine.getSequencesByTenant(ctx.tenantId);
      res.json(seqs);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/sequences", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const body = insertSequenceSchema.parse({ ...req.body, tenantId: ctx.tenantId });
      if (typeof body.steps !== "string") body.steps = JSON.stringify(body.steps || []);
      const created = await salesEngine.createSequence(body);
      res.json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ errors: e.errors });
      res.status(500).json({ message: e?.message });
    }
  });

  app.patch("/api/sales/sequences/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body };
      delete data.tenantId;
      delete data.id;
      if (data.steps && typeof data.steps !== "string") data.steps = JSON.stringify(data.steps);
      const updated = await salesEngine.updateSequence(ctx.tenantId, id, data);
      if (!updated) return res.status(404).json({ message: "No encontrada" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.delete("/api/sales/sequences/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ok = await salesEngine.deleteSequence(ctx.tenantId, parseInt(req.params.id));
      res.json({ ok });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/sequence-runs", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const runs = await salesEngine.getSequenceRunsByTenant(ctx.tenantId, { status: req.query.status as any, limit: 100 });
      res.json(runs);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/sequences/:id/enroll", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const seq = await salesEngine.getSequenceById(ctx.tenantId, id);
      if (!seq) return res.status(404).json({ message: "No encontrada" });
      const { sessionId, userEmail, userName } = req.body;
      if (!userEmail) return res.status(400).json({ message: "userEmail requerido" });
      if (sessionId) {
        const session = await storage.getSession(String(sessionId));
        if (!session || session.tenantId !== ctx.tenantId) {
          return res.status(403).json({ message: "Esa sesion no pertenece al tenant" });
        }
      }
      let steps: any[] = [];
      try { steps = JSON.parse(seq.steps || "[]"); } catch {}
      const firstDelay = steps[0]?.type === "wait" ? Math.max(0, steps[0]?.delayMinutes || 0) : 0;
      const run = await salesEngine.createSequenceRun({
        tenantId: ctx.tenantId,
        sequenceId: id,
        sessionId: sessionId || null,
        userEmail,
        userName: userName || null,
        currentStep: 0,
        status: "pending",
        nextRunAt: new Date(Date.now() + firstDelay * 60 * 1000),
        context: "{}",
      });
      res.json(run);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // FLOWS
  // ==========================================================================
  app.get("/api/sales/flows", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const f = await salesEngine.getFlowsByTenant(ctx.tenantId);
      res.json(f);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/flows/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const f = await salesEngine.getFlowById(ctx.tenantId, parseInt(req.params.id));
      if (!f) return res.status(404).json({ message: "No encontrado" });
      res.json(f);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/flows", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const body: any = { ...req.body, tenantId: ctx.tenantId };
      if (body.nodes && typeof body.nodes !== "string") body.nodes = JSON.stringify(body.nodes);
      if (body.edges && typeof body.edges !== "string") body.edges = JSON.stringify(body.edges);
      if (body.triggerConfig && typeof body.triggerConfig !== "string") body.triggerConfig = JSON.stringify(body.triggerConfig);
      const parsed = insertFlowSchema.parse(body);
      const created = await salesEngine.createFlow(parsed);
      res.json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ errors: e.errors });
      res.status(500).json({ message: e?.message });
    }
  });

  app.patch("/api/sales/flows/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const data: any = { ...req.body };
      delete data.tenantId; delete data.id;
      if (data.nodes && typeof data.nodes !== "string") data.nodes = JSON.stringify(data.nodes);
      if (data.edges && typeof data.edges !== "string") data.edges = JSON.stringify(data.edges);
      if (data.triggerConfig && typeof data.triggerConfig !== "string") data.triggerConfig = JSON.stringify(data.triggerConfig);
      const updated = await salesEngine.updateFlow(ctx.tenantId, id, data);
      if (!updated) return res.status(404).json({ message: "No encontrado" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.delete("/api/sales/flows/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ok = await salesEngine.deleteFlow(ctx.tenantId, parseInt(req.params.id));
      res.json({ ok });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/flows/:id/run", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const flow = await salesEngine.getFlowById(ctx.tenantId, id);
      if (!flow) return res.status(404).json({ message: "No encontrado" });
      const reqSessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : null;
      if (reqSessionId) {
        const session = await storage.getSession(reqSessionId);
        if (!session || session.tenantId !== ctx.tenantId) {
          return res.status(403).json({ message: "Esa sesion no pertenece al tenant" });
        }
      }
      executeFlow(flow, { ...req.body, sessionId: reqSessionId }).catch((e) => console.error(`flow run ${id}: ${e?.message}`));
      res.json({ ok: true, message: "Ejecucion iniciada" });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/flow-runs", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const flowId = req.query.flowId ? parseInt(req.query.flowId as string) : undefined;
      const runs = await salesEngine.getFlowRunsByTenant(ctx.tenantId, { flowId, limit: 50 });
      res.json(runs);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // INTEGRATIONS
  // ==========================================================================
  app.get("/api/sales/integrations", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const list = await salesEngine.getIntegrationsByTenant(ctx.tenantId);
      // Strip credentials in response
      res.json(list.map(i => ({ ...i, credentials: i.credentials ? "***" : null })));
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/integrations", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const body: any = { ...req.body, tenantId: ctx.tenantId };
      if (body.config && typeof body.config !== "string") body.config = JSON.stringify(body.config);
      if (body.credentials && typeof body.credentials !== "string") body.credentials = JSON.stringify(body.credentials);
      const parsed = insertIntegrationSchema.parse(body);
      const created = await salesEngine.createIntegration(parsed);
      res.json({ ...created, credentials: created.credentials ? "***" : null });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ errors: e.errors });
      res.status(500).json({ message: e?.message });
    }
  });

  app.patch("/api/sales/integrations/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const data: any = { ...req.body };
      delete data.tenantId; delete data.id;
      if (data.config && typeof data.config !== "string") data.config = JSON.stringify(data.config);
      if (data.credentials && typeof data.credentials !== "string") data.credentials = JSON.stringify(data.credentials);
      if (data.credentials === "***") delete data.credentials;
      const updated = await salesEngine.updateIntegration(ctx.tenantId, id, data);
      if (!updated) return res.status(404).json({ message: "No encontrado" });
      res.json({ ...updated, credentials: updated.credentials ? "***" : null });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.delete("/api/sales/integrations/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ok = await salesEngine.deleteIntegration(ctx.tenantId, parseInt(req.params.id));
      res.json({ ok });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/integrations/:id/test", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const integ = await salesEngine.getIntegrationById(ctx.tenantId, id);
      if (!integ) return res.status(404).json({ message: "No encontrado" });
      const result = await testIntegration(integ);
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // API KEYS
  // ==========================================================================
  app.get("/api/sales/api-keys", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const keys = await salesEngine.getApiKeysByTenant(ctx.tenantId);
      res.json(keys.map(k => ({ ...k, hashedKey: undefined, mask: `${k.prefix}…` })));
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/api-keys", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const name = String(req.body?.name || "Default");
      const scopes = Array.isArray(req.body?.scopes) ? req.body.scopes : ["sessions.read", "messages.read", "messages.write", "leads.read"];
      const { fullKey, prefix, hashedKey } = generateApiKey();
      const created = await salesEngine.createApiKey({
        tenantId: ctx.tenantId,
        name: name.slice(0, 100),
        prefix,
        hashedKey,
        scopes: JSON.stringify(scopes),
        active: 1,
      });
      // Only return fullKey ONCE on creation
      res.json({ ...created, hashedKey: undefined, fullKey, mask: `${prefix}…` });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.delete("/api/sales/api-keys/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ok = await salesEngine.revokeApiKey(ctx.tenantId, parseInt(req.params.id));
      res.json({ ok });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // WEBHOOK ENDPOINTS
  // ==========================================================================
  app.get("/api/sales/webhooks", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const list = await salesEngine.getWebhookEndpointsByTenant(ctx.tenantId);
      res.json(list.map(w => ({ ...w, secret: w.secret ? `${w.secret.slice(0, 8)}…` : null })));
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/webhooks", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const url = String(req.body?.url || "");
      try { new URL(url); } catch { return res.status(400).json({ message: "URL invalida" }); }
      const events = Array.isArray(req.body?.events) ? req.body.events : [];
      const validEvents = events.filter((e: any) => typeof e === "string" && (e === "*" || (ALL_WEBHOOK_EVENTS as readonly string[]).includes(e)));
      const secret = crypto.randomBytes(24).toString("base64url");
      const created = await salesEngine.createWebhookEndpoint({
        tenantId: ctx.tenantId,
        name: String(req.body?.name || "Webhook").slice(0, 100),
        url,
        secret,
        events: validEvents,
        active: 1,
      });
      res.json({ ...created, secret });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.patch("/api/sales/webhooks/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const data: any = {};
      if (req.body.name) data.name = String(req.body.name).slice(0, 100);
      if (req.body.url) {
        try { new URL(req.body.url); } catch { return res.status(400).json({ message: "URL invalida" }); }
        data.url = req.body.url;
      }
      if (Array.isArray(req.body.events)) {
        data.events = req.body.events.filter((e: any) => typeof e === "string" && (e === "*" || (ALL_WEBHOOK_EVENTS as readonly string[]).includes(e)));
      }
      if (typeof req.body.active === "number") data.active = req.body.active;
      const updated = await salesEngine.updateWebhookEndpoint(ctx.tenantId, id, data);
      if (!updated) return res.status(404).json({ message: "No encontrado" });
      res.json({ ...updated, secret: `${updated.secret.slice(0, 8)}…` });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.delete("/api/sales/webhooks/:id", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ok = await salesEngine.deleteWebhookEndpoint(ctx.tenantId, parseInt(req.params.id));
      res.json({ ok });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/sales/webhooks/:id/test", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ep = await salesEngine.getWebhookEndpointById(ctx.tenantId, parseInt(req.params.id));
      if (!ep) return res.status(404).json({ message: "No encontrado" });
      await dispatchWebhookEvent(ctx.tenantId, "test.ping", { message: "Webhook test from Cappta", timestamp: new Date().toISOString(), endpointId: ep.id });
      res.json({ ok: true, message: "Test enviado, revisa los registros en unos segundos." });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/sales/webhooks/:id/deliveries", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    if (!requireTenantOwnerOrAdmin(req, res)) return;
    try {
      const ep = await salesEngine.getWebhookEndpointById(ctx.tenantId, parseInt(req.params.id));
      if (!ep) return res.status(404).json({ message: "No encontrado" });
      const list = await salesEngine.getWebhookDeliveriesByEndpoint(ep.id, 50);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // SALES COACH (insights resumen)
  // ==========================================================================
  app.get("/api/sales/coach/insights", async (req, res) => {
    const ctx = await gatePaid(req, res); if (!ctx) return;
    try {
      const stats = await salesEngine.getLeadScoreStats(ctx.tenantId);
      const hot = await salesEngine.getLeadScoresByTenant(ctx.tenantId, { temperature: "hot", limit: 10 });
      const warm = await salesEngine.getLeadScoresByTenant(ctx.tenantId, { temperature: "warm", limit: 10 });
      const sequenceRuns = await salesEngine.getSequenceRunsByTenant(ctx.tenantId, { limit: 100 });
      const completedSequences = sequenceRuns.filter(r => r.status === "completed").length;
      const activeSequences = sequenceRuns.filter(r => r.status === "running" || r.status === "pending").length;

      const insights: string[] = [];
      if (stats.hot > 0) insights.push(`Tienes ${stats.hot} lead${stats.hot === 1 ? "" : "s"} caliente${stats.hot === 1 ? "" : "s"} esperando contacto inmediato.`);
      if (stats.warm > 5) insights.push(`${stats.warm} prospectos tibios podrian convertirse con un seguimiento personalizado.`);
      if (stats.cold > stats.warm + stats.hot) insights.push(`La mayoria de tus leads estan frios. Considera mejorar la calificacion inicial o cambiar mensajes de bienvenida.`);
      if (activeSequences === 0 && stats.hot + stats.warm > 0) insights.push(`Activa secuencias de seguimiento para no perder leads tibios y calientes.`);
      if (insights.length === 0) insights.push(`Aun no hay datos suficientes. Genera mas conversaciones para recibir insights accionables.`);

      res.json({
        stats,
        topHot: hot.slice(0, 5),
        topWarm: warm.slice(0, 5),
        sequencesActive: activeSequences,
        sequencesCompleted: completedSequences,
        insights,
      });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ==========================================================================
  // PUBLIC REST API v1 (api key auth)
  // ==========================================================================

  app.get("/api/v1/me", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    const tenant = await storage.getTenantById(auth.tenantId);
    if (!tenant) return res.status(404).json({ error: "tenant_not_found" });
    res.json({
      tenantId: tenant.id,
      companyName: tenant.companyName,
      plan: tenant.plan,
      apiKeyId: auth.apiKeyId,
      scopes: auth.scopes,
    });
  });

  app.get("/api/v1/sessions", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "sessions.read", res)) return;
    try {
      const sessions = await storage.getSessionsByTenantId(auth.tenantId);
      res.json({ data: sessions });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/v1/sessions/:sessionId/messages", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "messages.read", res)) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.tenantId) return res.status(404).json({ error: "session_not_found" });
      const messages = await storage.getMessagesBySessionId(req.params.sessionId);
      res.json({ data: messages });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/v1/sessions/:sessionId/messages", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "messages.write", res)) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.tenantId) return res.status(404).json({ error: "session_not_found" });
      const content = String(req.body?.content || "").slice(0, 4000);
      if (!content.trim()) return res.status(400).json({ error: "content_required" });
      const msg = await storage.createMessage({
        sessionId: session.sessionId,
        tenantId: auth.tenantId,
        userEmail: session.userEmail,
        userName: session.userName,
        sender: "support",
        content,
        adminName: String(req.body?.adminName || "API"),
        adminColor: "#7669E9",
      });
      try { emitToTenantRoom(session.sessionId, { id: msg.id, sessionId: session.sessionId, sender: "support", content: msg.content, timestamp: msg.timestamp, adminName: msg.adminName, adminColor: msg.adminColor }); } catch {}
      res.json({ data: msg });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/v1/leads", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "leads.read", res)) return;
    try {
      const temperature = req.query.temperature as any;
      const limit = Math.min(200, parseInt(req.query.limit as any) || 50);
      const leads = await salesEngine.getLeadScoresByTenant(auth.tenantId, { temperature, limit });
      res.json({ data: leads });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/v1/leads/stats", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "leads.read", res)) return;
    try {
      const stats = await salesEngine.getLeadScoreStats(auth.tenantId);
      res.json({ data: stats });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/v1/leads/score", async (req, res) => {
    const auth = await authenticateApiRequest(req, res); if (!auth) return;
    if (!requireScope(auth, "leads.write", res)) return;
    try {
      const sessionId = String(req.body?.sessionId || "");
      if (!sessionId) return res.status(400).json({ error: "sessionId_required" });
      const session = await storage.getSession(sessionId);
      if (!session || session.tenantId !== auth.tenantId) return res.status(404).json({ error: "session_not_found" });
      const result = await calculateAndStoreLeadScore(auth.tenantId, sessionId);
      res.json({ data: result });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // Interactive API docs
  app.get("/api-docs", (_req, res) => {
    const html = `<!doctype html><html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cappta AI — REST API Reference</title>
<style>
:root { --bg:#0f0f12; --card:#1a1a1e; --muted:#9ca3af; --text:#fafafa; --accent:#7669E9; --border:rgba(255,255,255,0.08); }
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font-family:'DM Sans',system-ui,-apple-system,sans-serif;line-height:1.6}
.container{max-width:1100px;margin:0 auto;padding:48px 24px}
h1{font-size:36px;margin:0 0 8px} h2{margin-top:48px;font-size:22px;border-bottom:1px solid var(--border);padding-bottom:8px}
.lead{color:var(--muted);font-size:16px}
.endpoint{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;margin:14px 0}
.method{display:inline-block;padding:3px 10px;border-radius:6px;font-weight:700;font-size:12px;margin-right:10px;font-family:monospace}
.GET{background:#10b98133;color:#10b981} .POST{background:#7669E933;color:#a394f7} .DELETE{background:#ef444433;color:#ef4444} .PATCH{background:#f59e0b33;color:#f59e0b}
code{background:#000;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#a394f7}
pre{background:#000;padding:14px;border-radius:8px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:12px}
.scope{display:inline-block;background:#7669E91a;color:#a394f7;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:6px}
table{width:100%;border-collapse:collapse;margin:8px 0}
td,th{padding:8px;border-bottom:1px solid var(--border);text-align:left;font-size:13px}
.brand{color:var(--accent);font-weight:700}
.event{display:inline-block;background:#1a1a1e;border:1px solid var(--border);padding:4px 10px;border-radius:6px;margin:3px;font-family:monospace;font-size:12px}
</style></head><body><div class="container">
<h1><span class="brand">Cappta AI</span> REST API <span style="font-size:14px;color:#9ca3af">v1</span></h1>
<p class="lead">REST API publica para integrar Cappta AI con tus sistemas. Requiere API key activa (Plan Solo o superior).</p>

<h2>Autenticacion</h2>
<p>Incluye tu API key como Bearer token:</p>
<pre>Authorization: Bearer sk_cap_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</pre>
<p>Crea API keys desde <code>Dashboard → API & Webhooks</code>. Cada llave tiene scopes (permisos) que limitan que puede leer/escribir.</p>
<p><b>Rate limits:</b> 120 requests/minuto por API key. Headers <code>X-RateLimit-Remaining</code> y <code>X-RateLimit-Reset</code> en cada respuesta.</p>

<h2>Endpoints</h2>

<div class="endpoint"><span class="method GET">GET</span><code>/api/v1/me</code> <span class="scope">scope: -</span><p class="lead">Devuelve info del tenant y scopes de la API key.</p></div>

<div class="endpoint"><span class="method GET">GET</span><code>/api/v1/sessions</code> <span class="scope">scope: sessions.read</span><p class="lead">Lista sesiones de chat del tenant.</p></div>

<div class="endpoint"><span class="method GET">GET</span><code>/api/v1/sessions/{sessionId}/messages</code> <span class="scope">scope: messages.read</span><p class="lead">Mensajes de una sesion.</p></div>

<div class="endpoint"><span class="method POST">POST</span><code>/api/v1/sessions/{sessionId}/messages</code> <span class="scope">scope: messages.write</span><p class="lead">Envia mensaje como agente al chat.</p>
<pre>{"content": "Hola, soy de ventas...", "adminName": "Maria"}</pre></div>

<div class="endpoint"><span class="method GET">GET</span><code>/api/v1/leads</code> <span class="scope">scope: leads.read</span><p class="lead">Lista leads scored. Query: <code>temperature=hot|warm|cold</code>, <code>limit</code></p></div>

<div class="endpoint"><span class="method GET">GET</span><code>/api/v1/leads/stats</code> <span class="scope">scope: leads.read</span><p class="lead">Conteo de leads por temperatura y promedio de score.</p></div>

<div class="endpoint"><span class="method POST">POST</span><code>/api/v1/leads/score</code> <span class="scope">scope: leads.write</span><p class="lead">Recalcula el score de una sesion con IA.</p>
<pre>{"sessionId": "abc123"}</pre></div>

<h2>Webhooks salientes</h2>
<p>Configura URLs en <code>Dashboard → API & Webhooks</code> para recibir notificaciones de eventos. Cada delivery incluye:</p>
<pre>X-Cappta-Signature: t=&lt;timestamp&gt;,v1=&lt;hex_hmac_sha256&gt;
X-Cappta-Event: lead.hot
X-Cappta-Delivery: &lt;uuid&gt;</pre>
<p>Verifica la firma calculando <code>HMAC-SHA256(secret, "&lt;timestamp&gt;.&lt;raw_body&gt;")</code>.</p>

<p><b>Eventos disponibles:</b></p>
<div>
${ALL_WEBHOOK_EVENTS.map(e => `<span class="event">${e}</span>`).join("")}
<span class="event">*</span> <span style="color:#9ca3af;font-size:12px">(todos)</span>
</div>

<h2>Integraciones nativas</h2>
<p>Cappta soporta enviar datos a sistemas externos sin codigo: <b>Webhook</b>, <b>HTTP custom</b>, <b>Slack</b>, <b>Discord</b>, <b>Teams</b>, <b>Google Sheets</b>, <b>HubSpot</b>, <b>Pipedrive</b>, <b>Airtable</b>, <b>Notion</b>, <b>Mailchimp</b>, <b>ActiveCampaign</b>, y mas. Configura desde <code>Dashboard → Integraciones</code> y usalas en flujos.</p>

<h2>Soporte</h2>
<p>Dudas o issues: <a style="color:#a394f7" href="mailto:soporte@cappta.ai">soporte@cappta.ai</a>. Status &amp; uptime en cappta.ai/status.</p>

</div></body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  console.log("[salesEngine] routes registered");
}

export { calculateAndStoreLeadScore, scheduleLeadScore, triggerSequencesForEvent, triggerFlowsForEvent, dispatchWebhookEvent };
