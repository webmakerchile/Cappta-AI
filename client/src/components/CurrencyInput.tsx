import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrency } from "@shared/currencies";

export interface CurrencyInputProps {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  currency?: string | null;
  decimalsOverride?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefixOverride?: string;
  ["data-testid"]?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

function getLocaleSeparators(locale: string): { group: string; decimal: string } {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const group = parts.find((p) => p.type === "group")?.value ?? ".";
    const decimal = parts.find((p) => p.type === "decimal")?.value ?? ",";
    return { group, decimal };
  } catch {
    return { group: ".", decimal: "," };
  }
}

function formatNumber(value: number, locale: string, decimals: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return value.toFixed(decimals);
  }
}

function parseDisplay(input: string, decimal: string, decimals: number): number | null {
  if (!input) return null;
  let cleaned = "";
  let seenDecimal = false;
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") {
      cleaned += ch;
    } else if (decimals > 0 && ch === decimal && !seenDecimal) {
      cleaned += ".";
      seenDecimal = true;
    }
  }
  if (!cleaned || cleaned === ".") return null;
  const num = Number(cleaned);
  if (!isFinite(num)) return null;
  if (decimals === 0) return Math.trunc(num);
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function CurrencyInput({
  value,
  onValueChange,
  currency,
  decimalsOverride,
  placeholder,
  className,
  disabled,
  prefixOverride,
  id,
  name,
  required,
  ...rest
}: CurrencyInputProps) {
  const meta = useMemo(() => getCurrency(currency), [currency]);
  const decimals = decimalsOverride ?? meta.decimals;
  const { decimal: decimalSep } = useMemo(() => getLocaleSeparators(meta.locale), [meta.locale]);
  const prefix = prefixOverride ?? meta.code;

  const valueRef = useRef<number | null | undefined>(value);
  const localeRef = useRef<string>(meta.locale);
  const decimalsRef = useRef<number>(decimals);
  const [display, setDisplay] = useState<string>(() =>
    typeof value === "number" && isFinite(value) ? formatNumber(value, meta.locale, decimals) : ""
  );

  useEffect(() => {
    const localeChanged = localeRef.current !== meta.locale;
    const decimalsChanged = decimalsRef.current !== decimals;
    const valueChanged = value !== valueRef.current;
    if (!localeChanged && !decimalsChanged && !valueChanged) return;
    valueRef.current = value;
    localeRef.current = meta.locale;
    decimalsRef.current = decimals;
    if (typeof value === "number" && isFinite(value)) {
      setDisplay(formatNumber(value, meta.locale, decimals));
    } else if (value === null || value === undefined) {
      setDisplay("");
    }
  }, [value, meta.locale, decimals]);

  const handleChange = (raw: string) => {
    let cleaned = "";
    let seenDecimal = false;
    let decimalDigits = 0;
    for (const ch of raw) {
      if (ch >= "0" && ch <= "9") {
        if (seenDecimal) {
          if (decimalDigits >= decimals) continue;
          decimalDigits += 1;
        }
        cleaned += ch;
      } else if (decimals > 0 && ch === decimalSep && !seenDecimal) {
        cleaned += decimalSep;
        seenDecimal = true;
      }
    }

    if (cleaned === "" || cleaned === decimalSep) {
      setDisplay(cleaned);
      valueRef.current = null;
      onValueChange(null);
      return;
    }

    const numeric = parseDisplay(cleaned, decimalSep, decimals);

    let formatted = cleaned;
    if (numeric !== null) {
      const intPart = Math.trunc(Math.abs(numeric));
      const intStr = formatNumber(intPart, meta.locale, 0);
      if (seenDecimal) {
        const idx = cleaned.indexOf(decimalSep);
        const decPart = idx >= 0 ? cleaned.slice(idx + 1) : "";
        formatted = `${intStr}${decimalSep}${decPart}`;
      } else {
        formatted = intStr;
      }
    }

    setDisplay(formatted);
    valueRef.current = numeric;
    onValueChange(numeric);
  };

  const handleBlur = () => {
    if (typeof valueRef.current === "number" && isFinite(valueRef.current)) {
      setDisplay(formatNumber(valueRef.current, meta.locale, decimals));
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/40 select-none"
        aria-hidden
      >
        {prefix}
      </span>
      <Input
        id={id}
        name={name}
        required={required}
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-12", className)}
        data-testid={rest["data-testid"]}
        autoComplete="off"
      />
    </div>
  );
}

export default CurrencyInput;
