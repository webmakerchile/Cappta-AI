-- Enterprise leads form submissions (B2B)
CREATE TABLE IF NOT EXISTS enterprise_leads (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  monthly_conversations TEXT,
  industry TEXT,
  current_solution TEXT,
  needs TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  contacted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enterprise_leads_status ON enterprise_leads(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_created_at ON enterprise_leads(created_at DESC);
