-- Add per-tenant currency for multi-currency UI support.
-- Schema source of truth: shared/schema.ts (tenants.currency). Synced via `npm run db:push`.
-- Cappta plan/MP billing remains in CLP regardless of this value.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CLP';
