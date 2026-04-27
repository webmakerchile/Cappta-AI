import { storage } from "../storage";

const PAID_PLANS = new Set(["solo", "basic", "scale", "pro", "enterprise"]);

const tenantPlanCache = new Map<number, { plan: string; cachedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function isTenantPaid(tenantId: number): Promise<boolean> {
  const now = Date.now();
  const cached = tenantPlanCache.get(tenantId);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return PAID_PLANS.has(cached.plan);
  }
  const tenant = await storage.getTenantById(tenantId);
  const plan = tenant?.plan || "free";
  tenantPlanCache.set(tenantId, { plan, cachedAt: now });
  return PAID_PLANS.has(plan);
}

export function invalidateTenantPlanCache(tenantId: number) {
  tenantPlanCache.delete(tenantId);
}

const PRIVATE_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|0\.0\.0\.0|::1|fc00:|fe80:|metadata\.google\.internal|metadata)$/i;

export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("URL inválida"); }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Solo se permiten URLs http/https");
  }
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_RE.test(host)) {
    throw new Error(`Host bloqueado por seguridad: ${host}`);
  }
  if (process.env.NODE_ENV === "production" && host === "0.0.0.0") {
    throw new Error("Host bloqueado por seguridad");
  }
  return parsed;
}

export async function safeFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  assertSafeUrl(url);
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 10_000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}
