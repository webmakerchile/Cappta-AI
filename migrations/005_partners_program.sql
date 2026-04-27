-- Partners program: Console de Agencias (task #34).
-- Schema source of truth: shared/schema.ts (partners, partnerCommissions,
-- partnerImpersonations, tenants.partnerId/partnerSlug, adminUsers.role
-- enum). Synced via `npm run db:push --force`. This file documents the
-- additive change for environments/audit; it is idempotent and safe to
-- replay. ID columns are kept as `serial` to match existing patterns.

CREATE TABLE IF NOT EXISTS partners (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL UNIQUE,
  slug          TEXT    NOT NULL UNIQUE,
  display_name  TEXT    NOT NULL,
  contact_email TEXT,
  agency_name   TEXT,
  country       TEXT,
  tier          TEXT    NOT NULL DEFAULT 'embajador',
  commission_pct INTEGER NOT NULL DEFAULT 20,
  status        TEXT    NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partners_slug   ON partners (slug);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners (status);

CREATE TABLE IF NOT EXISTS partner_commissions (
  id                       SERIAL PRIMARY KEY,
  partner_id               INTEGER NOT NULL,
  tenant_id                INTEGER NOT NULL,
  period_month             TEXT    NOT NULL,
  paid_amount_cents        INTEGER NOT NULL DEFAULT 0,
  currency                 TEXT    NOT NULL DEFAULT 'CLP',
  commission_amount_cents  INTEGER NOT NULL DEFAULT 0,
  commission_pct_snapshot  INTEGER NOT NULL,
  orders_count             INTEGER NOT NULL DEFAULT 0,
  status                   TEXT    NOT NULL DEFAULT 'pending',
  computed_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at                  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_id ON partner_commissions (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_period     ON partner_commissions (period_month);
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_commissions_period_tenant
  ON partner_commissions (partner_id, tenant_id, period_month);

CREATE TABLE IF NOT EXISTS partner_impersonations (
  id            SERIAL PRIMARY KEY,
  partner_id    INTEGER NOT NULL,
  admin_user_id INTEGER NOT NULL,
  tenant_id     INTEGER NOT NULL,
  started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMP,
  ip_address    TEXT,
  user_agent    TEXT
);
CREATE INDEX IF NOT EXISTS idx_partner_impersonations_partner_id ON partner_impersonations (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_impersonations_started_at ON partner_impersonations (started_at);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS partner_id   INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS partner_slug TEXT;

-- admin_users.role: extend enum to include 'partner'. The schema uses a
-- TEXT column with a Drizzle-side enum guard, so no DB-level CHECK update
-- is needed; new partner users insert with role = 'partner' directly.
