CREATE TABLE IF NOT EXISTS addons (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(50) NOT NULL DEFAULT 'Package',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tenant_addons (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  addon_slug VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  activated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  mp_payment_id VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_addons_unique
  ON tenant_addons(tenant_id, addon_slug) WHERE status = 'active';

INSERT INTO addons (slug, name, description, price, icon, category, sort_order) VALUES
  ('cappta-ads', 'Cappta Ads', 'Campañas inteligentes impulsadas por IA con segmentación avanzada y reportes en tiempo real.', 95000, 'Megaphone', 'marketing', 1),
  ('cappta-connect', 'Cappta Connect', 'Integración nativa con WhatsApp Business API. Gestiona todo desde un solo panel.', 63000, 'Link', 'comunicacion', 2),
  ('cappta-llamadas', 'Cappta Llamadas', '500 minutos VoIP con grabación, transcripción automática y analíticas.', 50000, 'Phone', 'comunicacion', 3),
  ('ig-comentarios', 'IG Comentarios IA', 'Respuestas inteligentes automáticas en Instagram. Aumenta engagement.', 50000, 'MessageCircle', 'marketing', 4),
  ('pdf-ia', 'PDF IA', 'Genera cotizaciones, reportes y fichas técnicas al instante con IA.', 50000, 'FileText', 'productividad', 5),
  ('razones-perdida', 'Razones de Pérdida', 'Analiza por qué se pierden conversaciones con métricas de abandono.', 27000, 'TrendingDown', 'analytics', 6),
  ('nps-ia', 'NPS IA', 'Encuestas NPS automatizadas con análisis de sentimiento por IA.', 27000, 'BarChart3', 'analytics', 7),
  ('formulas', 'Fórmulas', 'Flujos de automatización con lógica condicional para respuestas y asignaciones.', 27000, 'Workflow', 'productividad', 8),
  ('meetings-bots', 'Meetings Bots', 'Bots que agendan reuniones automáticamente con Google Calendar y Zoom.', 19000, 'Calendar', 'productividad', 9)
ON CONFLICT (slug) DO NOTHING;
