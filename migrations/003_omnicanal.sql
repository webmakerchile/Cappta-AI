-- Add channel field to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);

-- Add channel + external thread to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS external_thread_id TEXT;

-- Add industry + applied_template_slug to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_template_slug TEXT;

-- Industry templates
CREATE TABLE IF NOT EXISTS industry_templates (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Briefcase',
  emoji TEXT NOT NULL DEFAULT '🏢',
  color TEXT NOT NULL DEFAULT '#7669E9',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  welcome_message TEXT NOT NULL,
  welcome_subtitle TEXT NOT NULL DEFAULT '',
  bot_context TEXT NOT NULL,
  canned_responses TEXT NOT NULL DEFAULT '[]',
  knowledge_entries TEXT NOT NULL DEFAULT '[]',
  suggested_tags TEXT NOT NULL DEFAULT '[]',
  consultation_options TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tenant channels (omnichannel connections)
CREATE TABLE IF NOT EXISTS tenant_channels (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  display_name TEXT,
  external_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  webhook_secret TEXT,
  phone_number_id TEXT,
  page_id TEXT,
  ig_user_id TEXT,
  bot_token TEXT,
  inbound_address TEXT,
  config TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  status_message TEXT,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_channels_tenant ON tenant_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_channels_channel ON tenant_channels(channel);
CREATE INDEX IF NOT EXISTS idx_tenant_channels_external ON tenant_channels(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_channels_unique ON tenant_channels(tenant_id, channel);
