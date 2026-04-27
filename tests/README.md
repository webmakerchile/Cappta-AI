# Browser tests

Playwright e2e tests that drive the running app on port `5000`.

## Run

```bash
# Use the already-running dev server (recommended in Replit)
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5000 npx playwright test

# Or let Playwright spawn `npm run dev` itself (used in CI)
npm test          # alias for: npm run test:e2e
npm run test:e2e  # alias for: playwright test
```

CI runs `npm test` from `.github/workflows/e2e.yml`.

First-time setup on a fresh machine:

```bash
npx playwright install chromium
```

## Suites

- `currency-input.spec.ts` — covers `CurrencyInput` keyboard quirks across
  locales (`,` vs `.` decimal acceptance, ambiguous paste heuristic, caret
  preservation mid-edit). Mounts the `client/src/pages/CurrencyInputHarness.tsx`
  test harness via `/test/currency-input`.
