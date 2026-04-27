export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "CLP", name: "Peso chileno", symbol: "$", locale: "es-CL", decimals: 0 },
  { code: "ARS", name: "Peso argentino", symbol: "$", locale: "es-AR", decimals: 2 },
  { code: "MXN", name: "Peso mexicano", symbol: "$", locale: "es-MX", decimals: 2 },
  { code: "PEN", name: "Sol peruano", symbol: "S/", locale: "es-PE", decimals: 2 },
  { code: "COP", name: "Peso colombiano", symbol: "$", locale: "es-CO", decimals: 0 },
  { code: "BRL", name: "Real brasileño", symbol: "R$", locale: "pt-BR", decimals: 2 },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U", locale: "es-UY", decimals: 2 },
  { code: "BOB", name: "Boliviano", symbol: "Bs", locale: "es-BO", decimals: 2 },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲", locale: "es-PY", decimals: 0 },
  { code: "VES", name: "Bolívar venezolano", symbol: "Bs.S", locale: "es-VE", decimals: 2 },
  { code: "CRC", name: "Colón costarricense", symbol: "₡", locale: "es-CR", decimals: 2 },
  { code: "GTQ", name: "Quetzal guatemalteco", symbol: "Q", locale: "es-GT", decimals: 2 },
  { code: "HNL", name: "Lempira hondureño", symbol: "L", locale: "es-HN", decimals: 2 },
  { code: "NIO", name: "Córdoba nicaragüense", symbol: "C$", locale: "es-NI", decimals: 2 },
  { code: "DOP", name: "Peso dominicano", symbol: "RD$", locale: "es-DO", decimals: 2 },
  { code: "PAB", name: "Balboa panameño", symbol: "B/.", locale: "es-PA", decimals: 2 },

  { code: "USD", name: "Dólar estadounidense", symbol: "US$", locale: "en-US", decimals: 2 },
  { code: "CAD", name: "Dólar canadiense", symbol: "CA$", locale: "en-CA", decimals: 2 },

  { code: "EUR", name: "Euro", symbol: "€", locale: "es-ES", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", locale: "en-GB", decimals: 2 },
  { code: "CHF", name: "Franco suizo", symbol: "CHF", locale: "de-CH", decimals: 2 },
  { code: "NOK", name: "Corona noruega", symbol: "kr", locale: "nb-NO", decimals: 2 },
  { code: "SEK", name: "Corona sueca", symbol: "kr", locale: "sv-SE", decimals: 2 },
  { code: "DKK", name: "Corona danesa", symbol: "kr", locale: "da-DK", decimals: 2 },
  { code: "PLN", name: "Zloty polaco", symbol: "zł", locale: "pl-PL", decimals: 2 },
  { code: "CZK", name: "Corona checa", symbol: "Kč", locale: "cs-CZ", decimals: 2 },
  { code: "HUF", name: "Forinto húngaro", symbol: "Ft", locale: "hu-HU", decimals: 0 },
  { code: "RON", name: "Leu rumano", symbol: "lei", locale: "ro-RO", decimals: 2 },
  { code: "TRY", name: "Lira turca", symbol: "₺", locale: "tr-TR", decimals: 2 },

  { code: "JPY", name: "Yen japonés", symbol: "¥", locale: "ja-JP", decimals: 0 },
  { code: "CNY", name: "Yuan chino", symbol: "¥", locale: "zh-CN", decimals: 2 },
  { code: "KRW", name: "Won surcoreano", symbol: "₩", locale: "ko-KR", decimals: 0 },
  { code: "INR", name: "Rupia india", symbol: "₹", locale: "en-IN", decimals: 2 },
  { code: "IDR", name: "Rupia indonesia", symbol: "Rp", locale: "id-ID", decimals: 0 },
  { code: "THB", name: "Baht tailandés", symbol: "฿", locale: "th-TH", decimals: 2 },
  { code: "VND", name: "Dong vietnamita", symbol: "₫", locale: "vi-VN", decimals: 0 },
  { code: "PHP", name: "Peso filipino", symbol: "₱", locale: "en-PH", decimals: 2 },
  { code: "MYR", name: "Ringgit malasio", symbol: "RM", locale: "ms-MY", decimals: 2 },
  { code: "SGD", name: "Dólar singapurense", symbol: "S$", locale: "en-SG", decimals: 2 },
  { code: "HKD", name: "Dólar de Hong Kong", symbol: "HK$", locale: "zh-HK", decimals: 2 },
  { code: "TWD", name: "Dólar taiwanés", symbol: "NT$", locale: "zh-TW", decimals: 2 },

  { code: "AED", name: "Dírham emiratí", symbol: "د.إ", locale: "ar-AE", decimals: 2 },
  { code: "SAR", name: "Riyal saudí", symbol: "﷼", locale: "ar-SA", decimals: 2 },
  { code: "ILS", name: "Séquel israelí", symbol: "₪", locale: "he-IL", decimals: 2 },
  { code: "EGP", name: "Libra egipcia", symbol: "E£", locale: "ar-EG", decimals: 2 },
  { code: "ZAR", name: "Rand sudafricano", symbol: "R", locale: "en-ZA", decimals: 2 },
  { code: "NGN", name: "Naira nigeriano", symbol: "₦", locale: "en-NG", decimals: 2 },
  { code: "MAD", name: "Dírham marroquí", symbol: "DH", locale: "ar-MA", decimals: 2 },

  { code: "AUD", name: "Dólar australiano", symbol: "A$", locale: "en-AU", decimals: 2 },
  { code: "NZD", name: "Dólar neozelandés", symbol: "NZ$", locale: "en-NZ", decimals: 2 },
];

export const DEFAULT_CURRENCY = "CLP";

const CURRENCY_MAP: Record<string, CurrencyMeta> = CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {} as Record<string, CurrencyMeta>);

export function getCurrency(code?: string | null): CurrencyMeta {
  if (!code) return CURRENCY_MAP[DEFAULT_CURRENCY];
  return CURRENCY_MAP[code.toUpperCase()] || CURRENCY_MAP[DEFAULT_CURRENCY];
}

export function isValidCurrencyCode(code?: string | null): boolean {
  if (!code || typeof code !== "string") return false;
  return !!CURRENCY_MAP[code.toUpperCase()];
}

export function getCurrencySymbol(code?: string | null): string {
  return getCurrency(code).symbol;
}

export function getCurrencyLabel(code?: string | null): string {
  const c = getCurrency(code);
  return `${c.code} — ${c.name} (${c.symbol})`;
}

export function formatMoney(amount: number | null | undefined, code?: string | null): string {
  const c = getCurrency(code);
  const value = typeof amount === "number" && isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      currencyDisplay: "symbol",
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals,
    }).format(value);
  } catch {
    try {
      const formatted = new Intl.NumberFormat(c.locale, {
        minimumFractionDigits: c.decimals,
        maximumFractionDigits: c.decimals,
      }).format(value);
      return `${c.symbol}${formatted}`;
    } catch {
      return `${c.symbol}${value.toFixed(c.decimals)}`;
    }
  }
}

export function formatMoneyWithCode(amount: number | null | undefined, code?: string | null): string {
  const c = getCurrency(code);
  return `${formatMoney(amount, code)} ${c.code}`;
}

export function parsePriceText(price: string | null | undefined, code?: string | null): number | null {
  if (price === null || price === undefined) return null;
  const s = String(price).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.,\-]/g, "");
  if (!cleaned) return null;

  const decimals = getCurrency(code).decimals;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (decimals === 0) {
    normalized = cleaned.replace(/[.,]/g, "");
  } else if (lastComma === -1 && lastDot === -1) {
    normalized = cleaned;
  } else if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else {
    const sep = lastComma > -1 ? "," : ".";
    const idx = lastComma > -1 ? lastComma : lastDot;
    const after = cleaned.length - idx - 1;
    const occurrences = (cleaned.match(new RegExp(`\\${sep}`, "g")) || []).length;
    if (occurrences > 1 || after === 3) {
      normalized = cleaned.split(sep).join("");
    } else {
      normalized = sep === "," ? cleaned.replace(",", ".") : cleaned;
    }
  }

  const n = parseFloat(normalized);
  return isFinite(n) ? n : null;
}

export function formatPriceText(price: string | null | undefined, code?: string | null): string {
  const n = parsePriceText(price, code);
  if (n === null) return getCurrencySymbol(code);
  return formatMoney(n, code);
}
