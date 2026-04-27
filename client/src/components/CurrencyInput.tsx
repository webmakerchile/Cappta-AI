import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
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
  ariaLabel?: string;
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

function pickDecimalChar(
  raw: string,
  decimals: number,
  isPaste: boolean,
): "." | "," | null {
  if (decimals <= 0) return null;
  const dots = (raw.match(/\./g) || []).length;
  const commas = (raw.match(/,/g) || []).length;
  if (dots === 0 && commas === 0) return null;

  if (dots > 0 && commas > 0) {
    if (dots === 1 && commas > 1) return ".";
    if (commas === 1 && dots > 1) return ",";
    return raw.lastIndexOf(".") > raw.lastIndexOf(",") ? "." : ",";
  }

  if (dots > 1) return null;
  if (commas > 1) return null;

  const sep: "." | "," = dots === 1 ? "." : ",";

  if (isPaste) {
    const sepIdx = raw.indexOf(sep);
    const beforeDigits = (raw.slice(0, sepIdx).match(/\d/g) || []).length;
    const afterMatch = raw.slice(sepIdx + 1).match(/^\d+/);
    const afterDigits = afterMatch ? afterMatch[0].length : 0;
    const tail = raw.slice(sepIdx + 1 + afterDigits);
    const trailingDigits = (tail.match(/\d/g) || []).length;
    if (
      afterDigits === 3 &&
      beforeDigits >= 1 &&
      beforeDigits <= 3 &&
      trailingDigits === 0
    ) {
      return null;
    }
  }

  return sep;
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
  ariaLabel,
  id,
  name,
  required,
  ...rest
}: CurrencyInputProps) {
  const meta = useMemo(() => getCurrency(currency), [currency]);
  const decimals = decimalsOverride ?? meta.decimals;
  const { decimal: decimalSep } = useMemo(
    () => getLocaleSeparators(meta.locale),
    [meta.locale],
  );
  const prefix = prefixOverride ?? meta.code;
  const computedAriaLabel = ariaLabel
    ? `${ariaLabel} (${meta.code} – ${meta.name})`
    : `Monto en ${meta.code} – ${meta.name}`;

  const valueRef = useRef<number | null | undefined>(value);
  const localeRef = useRef<string>(meta.locale);
  const decimalsRef = useRef<number>(decimals);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const [display, setDisplay] = useState<string>(() =>
    typeof value === "number" && isFinite(value)
      ? formatNumber(value, meta.locale, decimals)
      : "",
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

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      const pos = pendingCaret.current;
      pendingCaret.current = null;
      const el = inputRef.current;
      try {
        if (document.activeElement === el) {
          el.setSelectionRange(pos, pos);
        }
      } catch {
        /* ignore */
      }
    }
  }, [display]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    const ne = e.nativeEvent;
    const inputType =
      typeof InputEvent !== "undefined" && ne instanceof InputEvent
        ? ne.inputType
        : "";
    const isPaste =
      inputType === "insertFromPaste" || inputType === "insertFromDrop";

    const decimalChar = pickDecimalChar(raw, decimals, isPaste);
    const decimalPos = decimalChar ? raw.lastIndexOf(decimalChar) : -1;

    let intDigitsBefore = 0;
    let decDigitsBefore = 0;
    let pastDecimalAtCaret = false;
    const upTo = Math.min(caret, raw.length);
    for (let i = 0; i < upTo; i++) {
      if (i === decimalPos) {
        pastDecimalAtCaret = true;
        continue;
      }
      const ch = raw[i];
      if (ch >= "0" && ch <= "9") {
        if (pastDecimalAtCaret) decDigitsBefore++;
        else intDigitsBefore++;
      }
    }

    let intDigits = "";
    let decDigits = "";
    let inDec = false;
    for (let i = 0; i < raw.length; i++) {
      if (i === decimalPos) {
        inDec = true;
        continue;
      }
      const ch = raw[i];
      if (ch >= "0" && ch <= "9") {
        if (inDec) {
          if (decDigits.length < decimals) decDigits += ch;
        } else {
          intDigits += ch;
        }
      }
    }

    if (!intDigits && !decDigits) {
      if (inDec) {
        setDisplay(decimalSep);
        pendingCaret.current = decimalSep.length;
      } else {
        setDisplay("");
      }
      valueRef.current = null;
      onValueChange(null);
      return;
    }

    const intNum = intDigits ? parseInt(intDigits, 10) : 0;
    const numeric =
      inDec && decDigits.length > 0
        ? intNum + parseInt(decDigits, 10) / Math.pow(10, decDigits.length)
        : intNum;

    const intStr = formatNumber(intNum, meta.locale, 0);
    const formatted = inDec ? `${intStr}${decimalSep}${decDigits}` : intStr;

    let newCaret: number;
    if (pastDecimalAtCaret) {
      const sepIdx = formatted.indexOf(decimalSep);
      if (sepIdx >= 0) {
        let count = 0;
        let pos = sepIdx + decimalSep.length;
        const target = Math.min(decDigitsBefore, decDigits.length);
        while (pos < formatted.length && count < target) {
          if (formatted[pos] >= "0" && formatted[pos] <= "9") count++;
          pos++;
        }
        newCaret = pos;
      } else {
        newCaret = formatted.length;
      }
    } else {
      let count = 0;
      let pos = 0;
      const target = Math.min(intDigitsBefore, intDigits.length);
      while (pos < formatted.length && count < target) {
        if (formatted[pos] >= "0" && formatted[pos] <= "9") count++;
        pos++;
      }
      newCaret = pos;
    }

    setDisplay(formatted);
    valueRef.current = numeric;
    pendingCaret.current = newCaret;
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
        ref={inputRef}
        id={id}
        name={name}
        required={required}
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-12", className)}
        data-testid={rest["data-testid"]}
        aria-label={computedAriaLabel}
        autoComplete="off"
      />
    </div>
  );
}

export default CurrencyInput;
