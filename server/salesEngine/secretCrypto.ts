import crypto from "crypto";

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const src = process.env.SESSION_SECRET || "";
  if (!src) throw new Error("SESSION_SECRET not set; cannot derive integration encryption key");
  cachedKey = crypto.createHash("sha256").update("cappta-integrations-v1:" + src).digest();
  return cachedKey;
}

export function encryptCredentials(plain: any): string {
  if (plain === null || plain === undefined) return "";
  const json = typeof plain === "string" ? plain : JSON.stringify(plain);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "enc:v1:" + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptCredentials(stored: any): any {
  if (stored === null || stored === undefined || stored === "") return null;
  if (typeof stored !== "string") return stored;
  if (!stored.startsWith("enc:v1:")) {
    try { return JSON.parse(stored); } catch { return stored; }
  }
  try {
    const buf = Buffer.from(stored.slice(7), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    try { return JSON.parse(pt); } catch { return pt; }
  } catch {
    return null;
  }
}

export function redactCredentials(_creds: any): any {
  return { _redacted: true };
}
