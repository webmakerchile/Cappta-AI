interface FxCache {
  date: string;
  base: string;
  rates: Record<string, number>;
}

let cache: FxCache | null = null;
let inFlight: Promise<FxCache> | null = null;
let lastFailedAt = 0;

const PROVIDER_TIMEOUT_MS = 5000;
const RETRY_BACKOFF_MS = 5 * 60 * 1000;

const FALLBACK_RATES: Record<string, number> = {
  CLP: 1,
  USD: 0.00104,
  EUR: 0.00094,
  GBP: 0.00081,
  ARS: 1.05,
  BRL: 0.0058,
  MXN: 0.019,
  COP: 4.5,
  PEN: 0.0039,
  UYU: 0.041,
  PYG: 7.6,
  BOB: 0.0072,
  CAD: 0.0014,
  AUD: 0.0016,
  JPY: 0.16,
  CNY: 0.0074,
  CHF: 0.00085,
  INR: 0.087,
  CRC: 0.55,
  GTQ: 0.0083,
  HNL: 0.027,
  NIO: 0.039,
  DOP: 0.064,
  PAB: 0.00104,
  VES: 0.038,
  HKD: 0.0081,
  SGD: 0.0014,
  KRW: 1.4,
  TWD: 0.034,
  THB: 0.038,
  PHP: 0.061,
  MYR: 0.0049,
  IDR: 17.5,
  VND: 26.5,
  AED: 0.0038,
  SAR: 0.0039,
  TRY: 0.041,
  ILS: 0.004,
  EGP: 0.052,
  ZAR: 0.019,
  NOK: 0.011,
  SEK: 0.011,
  DKK: 0.007,
  PLN: 0.0042,
  CZK: 0.024,
  HUF: 0.39,
  RUB: 0.097,
  NZD: 0.0017,
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchFromProvider(): Promise<FxCache | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/CLP", {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.result === "success" && data?.rates && typeof data.rates === "object") {
      return {
        date: todayUTC(),
        base: "CLP",
        rates: { ...data.rates, CLP: 1 },
      };
    }
  } catch (err) {
    console.warn("[fx] provider fetch failed:", (err as Error).message);
  }
  return null;
}

export async function getFxRates(): Promise<FxCache> {
  const today = todayUTC();
  if (cache && cache.date === today) return cache;
  if (inFlight) return inFlight;

  const now = Date.now();
  if (cache && now - lastFailedAt < RETRY_BACKOFF_MS) {
    return cache;
  }

  inFlight = (async () => {
    const fresh = await fetchFromProvider();
    if (fresh) {
      cache = fresh;
      lastFailedAt = 0;
    } else {
      lastFailedAt = Date.now();
      if (!cache) {
        cache = { date: today, base: "CLP", rates: { ...FALLBACK_RATES } };
      }
    }
    return cache!;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function convert(amountClp: number, target: string, rates: Record<string, number>): number | null {
  const code = target.toUpperCase();
  if (code === "CLP") return amountClp;
  const rate = rates[code];
  if (typeof rate !== "number" || !isFinite(rate) || rate <= 0) return null;
  return amountClp * rate;
}
