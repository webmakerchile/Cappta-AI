import crypto from "crypto";
import { salesEngine } from "../storage";
import type { Integration } from "@shared/schema";

const TIMEOUT_MS = 10000;

export interface IntegrationActionInput {
  tenantId: number;
  integrationId: number;
  action: string;
  data: Record<string, any>;
}

export interface IntegrationActionResult {
  ok: boolean;
  status?: number;
  response?: any;
  error?: string;
}

export async function runIntegrationAction(input: IntegrationActionInput): Promise<IntegrationActionResult> {
  const integ = await salesEngine.getIntegrationById(input.tenantId, input.integrationId);
  if (!integ) return { ok: false, error: "integration_not_found" };
  if (integ.active !== 1) return { ok: false, error: "integration_inactive" };

  let cfg: any = {};
  try { cfg = JSON.parse(integ.config || "{}"); } catch {}
  let creds: any = {};
  try { creds = integ.credentials ? JSON.parse(integ.credentials) : {}; } catch {}

  let result: IntegrationActionResult;
  try {
    switch (integ.provider) {
      case "webhook":
        result = await runWebhook(cfg, input.data);
        break;
      case "http":
        result = await runHttp(cfg, input.data);
        break;
      case "slack":
        result = await runSlack(cfg, input.data);
        break;
      case "discord":
        result = await runDiscord(cfg, input.data);
        break;
      case "google_sheets":
        result = await runGoogleSheets(cfg, creds, input.data);
        break;
      case "hubspot":
        result = await runHubspot(cfg, creds, input.data);
        break;
      case "pipedrive":
        result = await runPipedrive(cfg, creds, input.data);
        break;
      case "airtable":
        result = await runAirtable(cfg, creds, input.data);
        break;
      case "notion":
        result = await runNotion(cfg, creds, input.data);
        break;
      case "mailchimp":
        result = await runMailchimp(cfg, creds, input.data);
        break;
      case "activecampaign":
        result = await runActiveCampaign(cfg, creds, input.data);
        break;
      case "teams":
        result = await runTeams(cfg, input.data);
        break;
      default:
        result = { ok: false, error: `provider_not_supported:${integ.provider}` };
    }
  } catch (e: any) {
    result = { ok: false, error: e?.message || "unknown" };
  }

  try {
    await salesEngine.markIntegrationUsed(integ.id, result.ok ? null : (result.error || `status_${result.status}`));
  } catch {}

  return result;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const { safeFetch } = await import("./safety");
  return safeFetch(url, { ...init, timeoutMs: TIMEOUT_MS });
}

async function runWebhook(cfg: any, data: any): Promise<IntegrationActionResult> {
  if (!cfg.url) return { ok: false, error: "missing_url" };
  const body = JSON.stringify(data);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(cfg.headers || {}) };
  if (cfg.secret) {
    const sig = crypto.createHmac("sha256", cfg.secret).update(body).digest("hex");
    headers["X-Cappta-Signature"] = sig;
  }
  const res = await fetchWithTimeout(cfg.url, { method: cfg.method || "POST", headers, body });
  const txt = (await res.text()).slice(0, 1500);
  return { ok: res.ok, status: res.status, response: txt };
}

async function runHttp(cfg: any, data: any): Promise<IntegrationActionResult> {
  if (!cfg.url) return { ok: false, error: "missing_url" };
  const method = (cfg.method || "POST").toUpperCase();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(cfg.headers || {}) };
  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") init.body = JSON.stringify({ ...(cfg.body || {}), ...data });
  const res = await fetchWithTimeout(cfg.url, init);
  const txt = (await res.text()).slice(0, 1500);
  return { ok: res.ok, status: res.status, response: txt };
}

async function runSlack(cfg: any, data: any): Promise<IntegrationActionResult> {
  if (!cfg.webhookUrl) return { ok: false, error: "missing_webhookUrl" };
  const text = data.text || data.message || formatGenericMessage(data);
  const body = JSON.stringify({ text, blocks: data.blocks });
  const res = await fetchWithTimeout(cfg.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return { ok: res.ok, status: res.status, response: await res.text() };
}

async function runDiscord(cfg: any, data: any): Promise<IntegrationActionResult> {
  if (!cfg.webhookUrl) return { ok: false, error: "missing_webhookUrl" };
  const content = data.text || data.message || formatGenericMessage(data);
  const res = await fetchWithTimeout(cfg.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 1900), embeds: data.embeds }),
  });
  return { ok: res.ok, status: res.status, response: await res.text() };
}

async function runTeams(cfg: any, data: any): Promise<IntegrationActionResult> {
  if (!cfg.webhookUrl) return { ok: false, error: "missing_webhookUrl" };
  const text = data.text || data.message || formatGenericMessage(data);
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: data.summary || "Cappta AI",
    text,
  };
  const res = await fetchWithTimeout(cfg.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  return { ok: res.ok, status: res.status, response: await res.text() };
}

async function runGoogleSheets(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  // Two modes: appendUrl (Google Apps Script doPost endpoint) OR webhookUrl
  const url = cfg.appendUrl || cfg.webhookUrl;
  if (!url) return { ok: false, error: "missing_appendUrl" };
  const row = data.row || data.values || data;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetName: cfg.sheetName, row, apiKey: creds.apiKey }),
  });
  return { ok: res.ok, status: res.status, response: await res.text() };
}

async function runHubspot(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const token = creds.accessToken || creds.apiKey;
  if (!token) return { ok: false, error: "missing_accessToken" };
  const properties = {
    email: data.email,
    firstname: data.firstName || data.userName,
    company: data.company,
    phone: data.phone,
    ...(data.properties || {}),
  };
  const res = await fetchWithTimeout("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

async function runPipedrive(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const token = creds.apiToken;
  if (!token) return { ok: false, error: "missing_apiToken" };
  const domain = cfg.domain || "api";
  const res = await fetchWithTimeout(`https://${domain}.pipedrive.com/v1/persons?api_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.userName || data.name || data.email,
      email: data.email ? [{ value: data.email, primary: true }] : undefined,
      phone: data.phone ? [{ value: data.phone, primary: true }] : undefined,
    }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

async function runAirtable(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const token = creds.apiKey;
  if (!token || !cfg.baseId || !cfg.tableName) return { ok: false, error: "missing_credentials" };
  const res = await fetchWithTimeout(`https://api.airtable.com/v0/${cfg.baseId}/${encodeURIComponent(cfg.tableName)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records: [{ fields: data.fields || data }] }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

async function runNotion(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const token = creds.apiKey;
  if (!token || !cfg.databaseId) return { ok: false, error: "missing_credentials" };
  const properties = data.properties || {
    Name: { title: [{ text: { content: String(data.userName || data.name || data.email || "Lead") } }] },
  };
  const res = await fetchWithTimeout("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ parent: { database_id: cfg.databaseId }, properties }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

async function runMailchimp(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const apiKey = creds.apiKey;
  if (!apiKey || !cfg.listId || !cfg.dc) return { ok: false, error: "missing_credentials" };
  const res = await fetchWithTimeout(`https://${cfg.dc}.api.mailchimp.com/3.0/lists/${cfg.listId}/members`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from("anystring:" + apiKey).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: data.email,
      status: "subscribed",
      merge_fields: { FNAME: data.userName || data.firstName || "", ...(data.merge_fields || {}) },
    }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

async function runActiveCampaign(cfg: any, creds: any, data: any): Promise<IntegrationActionResult> {
  const apiKey = creds.apiKey;
  if (!apiKey || !cfg.apiUrl) return { ok: false, error: "missing_credentials" };
  const url = `${cfg.apiUrl.replace(/\/$/, "")}/api/3/contacts`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Api-Token": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contact: {
        email: data.email,
        firstName: data.userName || data.firstName,
        phone: data.phone,
      },
    }),
  });
  return { ok: res.ok, status: res.status, response: (await res.text()).slice(0, 800) };
}

function formatGenericMessage(data: any): string {
  if (typeof data === "string") return data;
  const lines: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      lines.push(`*${k}*: ${v}`);
    }
  }
  return lines.join("\n").slice(0, 1500) || JSON.stringify(data).slice(0, 1500);
}

export async function testIntegration(integration: Integration): Promise<IntegrationActionResult> {
  return runIntegrationAction({
    tenantId: integration.tenantId,
    integrationId: integration.id,
    action: "test",
    data: { test: true, message: "Cappta AI test connection", timestamp: new Date().toISOString() },
  });
}
