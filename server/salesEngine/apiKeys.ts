import crypto from "crypto";
import { salesEngine } from "../storage";

const PREFIX = "sk_cap_";

// Returns { id, fullKey, prefix, hashedKey }
export function generateApiKey(): { fullKey: string; prefix: string; hashedKey: string } {
  const randomPart = crypto.randomBytes(24).toString("base64url");
  const fullKey = `${PREFIX}${randomPart}`;
  const prefix = fullKey.slice(0, PREFIX.length + 8);
  const hashedKey = crypto.createHash("sha256").update(fullKey).digest("hex");
  return { fullKey, prefix, hashedKey };
}

export function hashApiKey(fullKey: string): string {
  return crypto.createHash("sha256").update(fullKey).digest("hex");
}

export function maskApiKey(prefix: string): string {
  return `${prefix}...${"*".repeat(20)}`;
}

interface RateBucket { tokens: number; refillAt: number; }
const rateBuckets = new Map<number, RateBucket>();
const MAX_REQUESTS_PER_MINUTE = 120;

export function checkRateLimit(apiKeyId: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let bucket = rateBuckets.get(apiKeyId);
  if (!bucket || now >= bucket.refillAt) {
    bucket = { tokens: MAX_REQUESTS_PER_MINUTE, refillAt: now + 60_000 };
    rateBuckets.set(apiKeyId, bucket);
  }
  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0, resetIn: Math.max(0, bucket.refillAt - now) };
  }
  bucket.tokens--;
  return { allowed: true, remaining: bucket.tokens, resetIn: bucket.refillAt - now };
}

export interface ApiAuthResult {
  tenantId: number;
  apiKeyId: number;
  scopes: string[];
}

export async function authenticateApiRequest(req: any, res: any): Promise<ApiAuthResult | null> {
  const authHeader = req.headers.authorization || "";
  let key = "";
  if (authHeader.startsWith("Bearer ")) key = authHeader.substring(7).trim();
  else if (req.headers["x-api-key"]) key = String(req.headers["x-api-key"]).trim();
  if (!key || !key.startsWith(PREFIX)) {
    res.status(401).json({ error: "missing_api_key", message: "Provide a valid API key in Authorization: Bearer header." });
    return null;
  }
  const prefix = key.slice(0, PREFIX.length + 8);
  const record = await salesEngine.getApiKeyByPrefix(prefix);
  if (!record || record.active !== 1) {
    res.status(401).json({ error: "invalid_api_key" });
    return null;
  }
  const provided = hashApiKey(key);
  if (!crypto.timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(record.hashedKey, "hex"))) {
    res.status(401).json({ error: "invalid_api_key" });
    return null;
  }
  const rl = checkRateLimit(record.id);
  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS_PER_MINUTE));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rl.resetIn / 1000)));
  if (!rl.allowed) {
    res.status(429).json({ error: "rate_limited", retryAfterSeconds: Math.ceil(rl.resetIn / 1000) });
    return null;
  }
  const { isTenantPaid } = await import("./safety");
  if (!(await isTenantPaid(record.tenantId))) {
    res.status(402).json({ error: "plan_required", message: "Tu plan actual no incluye acceso a la API publica de Cappta." });
    return null;
  }
  let scopes: string[] = [];
  try { scopes = JSON.parse(record.scopes || "[]"); } catch {}
  salesEngine.markApiKeyUsed(record.id).catch(() => {});
  return { tenantId: record.tenantId, apiKeyId: record.id, scopes };
}

export function requireScope(auth: ApiAuthResult, scope: string, res: any): boolean {
  if (auth.scopes.includes("*") || auth.scopes.includes(scope)) return true;
  res.status(403).json({ error: "insufficient_scope", required: scope });
  return false;
}
