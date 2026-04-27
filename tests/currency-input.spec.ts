import { test, expect, type Page, type Locator } from "@playwright/test";

const HARNESS_PATH = "/test/currency-input";

async function gotoHarness(
  page: Page,
  opts: { currency?: string; value?: string | number } = {},
) {
  const params = new URLSearchParams();
  if (opts.currency) params.set("currency", opts.currency);
  if (opts.value !== undefined && opts.value !== null)
    params.set("value", String(opts.value));
  const qs = params.toString();
  await page.goto(`${HARNESS_PATH}${qs ? `?${qs}` : ""}`);
  await page.waitForSelector('[data-testid="harness-input"]');
}

async function getDisplay(input: Locator): Promise<string> {
  return await input.inputValue();
}

async function getNumeric(page: Page): Promise<string> {
  return (await page.locator('[data-testid="numeric-value"]').textContent()) ?? "";
}

async function setSelection(input: Locator, start: number, end: number = start) {
  await input.evaluate(
    (el, [s, e]) => {
      const i = el as HTMLInputElement;
      i.focus();
      i.setSelectionRange(s, e);
    },
    [start, end],
  );
}

async function getSelectionStart(input: Locator): Promise<number> {
  return await input.evaluate(
    (el) => (el as HTMLInputElement).selectionStart ?? -1,
  );
}

// Real-paste simulation: write to clipboard and press the OS paste shortcut.
// Chromium fires a real `paste` event, which becomes an InputEvent with
// inputType: "insertFromPaste" — exactly what CurrencyInput keys on.
async function pasteText(page: Page, input: Locator, text: string) {
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  await input.focus();
  await input.evaluate((el) => {
    const i = el as HTMLInputElement;
    i.setSelectionRange(0, i.value.length);
  });
  await page.keyboard.press("ControlOrMeta+V");
}

test.describe("CurrencyInput keyboard quirks across locales", () => {
  test.beforeEach(async ({ context }) => {
    // Allow programmatic clipboard access for paste tests.
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("USD: typing '1,5' is accepted as the decimal separator and stores 1.5", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "USD" });
    const input = page.locator('[data-testid="harness-input"]');

    await input.click();
    await page.keyboard.type("1,5", { delay: 30 });

    // Display should be normalized to the en-US format.
    expect(await getDisplay(input)).toBe("1.5");
    // Numeric model state should be exactly 1.5.
    expect(await getNumeric(page)).toBe("1.5");

    // Blur reformats to fixed decimals.
    await page.locator('[data-testid="harness-root"]').click();
    expect(await getDisplay(input)).toBe("1.50");
    expect(await getNumeric(page)).toBe("1.5");
  });

  test("EUR: typing '1.5' is accepted as the decimal separator and stores 1.5", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "EUR" });
    const input = page.locator('[data-testid="harness-input"]');

    await input.click();
    await page.keyboard.type("1.5", { delay: 30 });

    // Display should use the comma decimal separator (es-ES locale).
    expect(await getDisplay(input)).toBe("1,5");
    expect(await getNumeric(page)).toBe("1.5");

    await page.locator('[data-testid="harness-root"]').click();
    expect(await getDisplay(input)).toBe("1,50");
    expect(await getNumeric(page)).toBe("1.5");
  });

  test("USD paste: '1,234.56' is parsed as 1234.56", async ({ page }) => {
    await gotoHarness(page, { currency: "USD" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "1,234.56");

    expect(await getDisplay(input)).toBe("1,234.56");
    expect(await getNumeric(page)).toBe("1234.56");
  });

  test("EUR paste: '1.234,56' is parsed as 1234.56", async ({ page }) => {
    await gotoHarness(page, { currency: "EUR" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "1.234,56");

    // Note: Spanish (es-ES) does not group 4-digit numbers, so the
    // round-tripped display loses the dot grouping. The numeric value
    // is what we care about for storage correctness.
    expect(await getDisplay(input)).toBe("1234,56");
    expect(await getNumeric(page)).toBe("1234.56");
  });

  test("EUR paste: '12.345,67' (5-digit grouped) round-trips with the dot grouping intact", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "EUR" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "12.345,67");

    expect(await getDisplay(input)).toBe("12.345,67");
    expect(await getNumeric(page)).toBe("12345.67");
  });

  // -------- Ambiguous paste heuristic --------
  // The heuristic in pickDecimalCharFromPaste treats a single separator
  // followed by exactly 3 digits (and 1-3 before, no trailing digits) as
  // GROUPING regardless of whether it is "." or ",". Anything else with a
  // single separator is treated as DECIMAL. These tests pin both directions
  // for both currencies so a future heuristic change cannot quietly flip
  // the interpretation.

  test("USD paste: ambiguous '1,234' (one comma, 3 digits after) → 1234 (grouping)", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "USD" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "1,234");

    expect(await getNumeric(page)).toBe("1234");
  });

  test("USD paste: ambiguous '1.234' (one dot, 3 digits after) → 1234 (grouping)", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "USD" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "1.234");

    // Even though "." is the active decimal in en-US, the heuristic treats
    // the "1.234" shape as grouping. Numeric must be 1234, not 1.234.
    expect(await getNumeric(page)).toBe("1234");
  });

  test("EUR paste: ambiguous '12,345' (one comma, 3 digits after, 2 before) → 12345 (grouping)", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "EUR" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "12,345");

    // Comma is the decimal sep in es-ES, yet the heuristic still flags this
    // shape as grouping — numeric must be 12345, not 12.345. This is the
    // exact regression the heuristic was added to prevent.
    expect(await getNumeric(page)).toBe("12345");
  });

  test("EUR paste: '12,3' (one comma, fewer than 3 digits after) → 12.3 (decimal)", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "EUR" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "12,3");

    // afterDigits != 3 ⇒ heuristic falls back to decimal interpretation.
    expect(await getNumeric(page)).toBe("12.3");
  });

  test("USD paste: '1,2345' (one comma, 4 digits after) → 1.2345 (decimal)", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "USD" });
    const input = page.locator('[data-testid="harness-input"]');

    await pasteText(page, input, "1,2345");

    // afterDigits > 3 ⇒ decimal. The CurrencyInput will then truncate to
    // the currency's allowed decimals (2 for USD), so numeric is 1.23.
    expect(await getNumeric(page)).toBe("1.23");
  });

  test("USD: typing a digit in the middle of '12,345.67' keeps the cursor next to the inserted digit", async ({
    page,
  }) => {
    await gotoHarness(page, { currency: "USD", value: 12345.67 });
    const input = page.locator('[data-testid="harness-input"]');

    // Sanity: initial display
    expect(await getDisplay(input)).toBe("12,345.67");

    // Place the caret between "12,3" and "45.67" → index 4.
    // "1"(0) "2"(1) ","(2) "3"(3) | "4"(4) ...
    await setSelection(input, 4, 4);
    await page.keyboard.type("9");

    // After insert the integer part becomes 123945 → "123,945.67".
    expect(await getDisplay(input)).toBe("123,945.67");
    expect(await getNumeric(page)).toBe("123945.67");

    // The caret must sit immediately after the just-typed "9".
    // "1"(0) "2"(1) "3"(2) ","(3) "9"(4) | "4"(5) ...
    expect(await getSelectionStart(input)).toBe(5);
  });

  test("USD: typing the next digit at the new caret keeps cursor flow stable across reformat", async ({
    page,
  }) => {
    // Regression guard against the cursor jumping to end on every keystroke.
    await gotoHarness(page, { currency: "USD", value: 12345.67 });
    const input = page.locator('[data-testid="harness-input"]');

    await setSelection(input, 4, 4);
    await page.keyboard.type("9");
    expect(await getDisplay(input)).toBe("123,945.67");
    expect(await getSelectionStart(input)).toBe(5);

    // Type another digit at the current caret. We expect it to be inserted
    // right next to the previous "9" — so its 5 digits-before count is
    // preserved across the regrouping reformat.
    await page.keyboard.type("8");
    expect(await getDisplay(input)).toBe("1,239,845.67");
    // After regrouping, "1,239,845.67":
    //   "1"(0) ","(1) "2"(2) "3"(3) "9"(4) ","(5) "8"(6) | "4"(7) ...
    // The caret must sit immediately after the just-typed "8", which is
    // index 7. (Note the regrouping pushed a new comma into position 5.)
    expect(await getSelectionStart(input)).toBe(7);
  });
});
