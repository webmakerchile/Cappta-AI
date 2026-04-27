-- Enterprise leads form submissions (B2B)
-- Schema source of truth: shared/schema.ts (enterpriseLeads). Synced via `npm run db:push`.
CREATE TABLE IF NOT EXISTS enterprise_leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  monthly_conversations TEXT,
  channels TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'enterprise_form',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_leads_status ON enterprise_leads(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_created_at ON enterprise_leads(created_at DESC);
