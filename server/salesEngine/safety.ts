import { storage } from "../storage";
import dns from "node:dns/promises";
import net from "node:net";

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

const PRIVATE_HOST_RE = /^(localhost|metadata\.google\.internal|metadata)$/i;

function isPrivateOrUnsafeIP(ip: string): boolean {
  if (!ip) return true;
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(n => parseInt(n, 10));
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    if (lower.startsWith("::ffff:")) return isPrivateOrUnsafeIP(lower.slice(7));
    return false;
  }
  return true;
}

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
  if (net.isIP(host) && isPrivateOrUnsafeIP(host)) {
    throw new Error(`Host bloqueado por seguridad: ${host}`);
  }
  return parsed;
}

async function assertResolvedHostIsPublic(hostname: string): Promise<void> {
  if (net.isIP(hostname)) return;
  let addrs: { address: string; family: number }[] = [];
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch (e: any) {
    throw new Error(`No se pudo resolver host: ${hostname}`);
  }
  for (const a of addrs) {
    if (isPrivateOrUnsafeIP(a.address)) {
      throw new Error(`Host resuelve a IP bloqueada (${a.address})`);
    }
  }
}

export async function safeFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const parsed = assertSafeUrl(url);
  await assertResolvedHostIsPublic(parsed.hostname);
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 10_000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "manual" as any });
  } finally {
    clearTimeout(t);
  }
}
