import { useEffect, useMemo, useState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CURRENCIES } from "@shared/currencies";

const CURRENCY_OPTIONS = ["USD", "EUR", "CLP", "ARS", "BRL", "GBP", "JPY"];

export default function CurrencyInputHarness() {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const initialCurrency = (params.get("currency") || "USD").toUpperCase();
  const initialValueParam = params.get("value");
  const initialValue =
    initialValueParam !== null && initialValueParam !== ""
      ? Number(initialValueParam)
      : null;

  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [value, setValue] = useState<number | null>(
    Number.isFinite(initialValue as number) ? (initialValue as number) : null,
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.title = "CurrencyInput Test Harness";
  }, []);

  const meta = CURRENCIES.find((c) => c.code === currency);

  return (
    <div
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
      data-testid="harness-root"
    >
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>
        CurrencyInput Test Harness
      </h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label htmlFor="select-currency">Currency:</label>
        <select
          id="select-currency"
          data-testid="select-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{ background: "#222", color: "white", padding: 4 }}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span data-testid="info-locale">
          locale={meta?.locale ?? "?"} decimals={meta?.decimals ?? "?"}
        </span>
      </div>
      <div style={{ maxWidth: 320 }}>
        <CurrencyInput
          data-testid="harness-input"
          value={value}
          onValueChange={setValue}
          currency={currency}
          ariaLabel="Test price"
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <span>Numeric value: </span>
        <code data-testid="numeric-value">
          {value === null || value === undefined ? "null" : String(value)}
        </code>
      </div>
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          data-testid="button-clear"
          onClick={() => setValue(null)}
          style={{
            background: "#333",
            color: "white",
            padding: "4px 8px",
            border: "1px solid #444",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
