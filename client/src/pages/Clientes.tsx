import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapptaLogo } from "@/components/CapptaLogo";
import {
  ArrowRight,
  Quote,
  TrendingUp,
  Clock,
  Users,
  MessageSquare,
  Star,
} from "lucide-react";

interface CaseStudy {
  slug: string;
  company: string;
  industry: string;
  industryEmoji: string;
  size: string;
  plan: string;
  challenge: string;
  solution: string;
  results: { metric: string; label: string }[];
  quote: string;
  author: string;
  role: string;
  highlight?: boolean;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "pizzeria-don-mario",
    company: "Pizzería Don Mario",
    industry: "Restaurantes",
    industryEmoji: "🍽️",
    size: "Microemprendedor (1 local)",
    plan: "Solo $7.990",
    challenge:
      "Don Mario perdía pedidos en la noche porque solo él contestaba el WhatsApp y no daba abasto entre cocinar y responder.",
    solution:
      "Activó Cappta AI con la plantilla de restaurantes, subió su menú y dejó que el bot tomara pedidos mientras él cocinaba.",
    results: [
      { metric: "+38%", label: "Pedidos en la noche" },
      { metric: "0", label: "Pedidos perdidos" },
      { metric: "2 hrs", label: "Recuperadas al día" },
    ],
    quote:
      "Antes me daba pena no contestar a las 11 de la noche. Ahora el bot toma el pedido y yo solo lo armo. Recuperé mi tiempo y vendo más.",
    author: "Mario T.",
    role: "Dueño",
  },
  {
    slug: "salon-belleza-aurora",
    company: "Salón Aurora",
    industry: "Salones y Spa",
    industryEmoji: "💇",
    size: "Pequeña empresa (4 estilistas)",
    plan: "Pro $19.990",
    challenge:
      "Las recepcionistas perdían 3 horas al día agendando horas y respondiendo dudas básicas, y los no-shows eran un dolor de cabeza.",
    solution:
      "Cappta AI agenda 24/7 según disponibilidad real de cada estilista y envía recordatorios automáticos 24 hs antes.",
    results: [
      { metric: "-65%", label: "No-shows" },
      { metric: "+45%", label: "Reservas online" },
      { metric: "3 hrs/día", label: "Liberadas en recepción" },
    ],
    quote:
      "Mi recepción ahora se enfoca en los clientes que están en el salón. El bot agenda y recuerda — y los no-shows se desplomaron.",
    author: "Catalina M.",
    role: "Dueña",
    highlight: true,
  },
  {
    slug: "ecommerce-modaviva",
    company: "ModaViva (e-commerce)",
    industry: "E-commerce",
    industryEmoji: "🛒",
    size: "Mediana (12 personas)",
    plan: "Scale $49.990",
    challenge:
      "Carritos abandonados que nadie recuperaba y un equipo de soporte saturado con preguntas repetidas sobre talles y envíos.",
    solution:
      "Conectaron su catálogo Shopify a Cappta. El bot recupera carritos, recomienda talles según historial y resuelve el 80% de las consultas.",
    results: [
      { metric: "+22%", label: "Carritos recuperados" },
      { metric: "82%", label: "Consultas resueltas por IA" },
      { metric: "4x", label: "ROI mensual" },
    ],
    quote:
      "Cappta nos recuperó plata que estaba quedando en la mesa. El equipo ahora se enfoca en los casos complejos.",
    author: "Felipe R.",
    role: "Co-founder",
  },
  {
    slug: "clinica-dental-sonrisas",
    company: "Clínica Dental Sonrisas",
    industry: "Clínicas",
    industryEmoji: "🩺",
    size: "Pequeña empresa (3 dentistas)",
    plan: "Pro $19.990",
    challenge:
      "El teléfono no paraba de sonar y se perdían llamadas. Los pacientes esperaban días por una hora.",
    solution:
      "Bot agenda según especialidad y recuerda controles, limpieza y revisiones. Hace triage inicial para urgencias.",
    results: [
      { metric: "+50%", label: "Citas agendadas" },
      { metric: "-70%", label: "Llamadas perdidas" },
      { metric: "+30%", label: "Adherencia a controles" },
    ],
    quote:
      "Los pacientes están felices porque agendan al instante. Las recepcionistas, encantadas porque pueden enfocarse en quien viene a la clínica.",
    author: "Dra. Lucía P.",
    role: "Directora",
  },
  {
    slug: "inmobiliaria-andes",
    company: "Inmobiliaria Andes",
    industry: "Inmobiliarias",
    industryEmoji: "🏠",
    size: "Mediana (8 corredores)",
    plan: "Scale $49.990",
    challenge:
      "Cientos de leads tibios sin seguimiento. Los corredores perdían tiempo con curiosos en lugar de cerradores.",
    solution:
      "Cappta califica leads automáticamente: presupuesto, zona, urgencia. Solo deriva al corredor los que están listos.",
    results: [
      { metric: "+60%", label: "Leads calificados" },
      { metric: "3x", label: "Cierres por corredor" },
      { metric: "0", label: "Leads sin contacto" },
    ],
    quote:
      "Antes los corredores se quemaban con consultas frívolas. Ahora les llega solo gente que quiere comprar o arrendar de verdad.",
    author: "Andrés N.",
    role: "Gerente Comercial",
    highlight: true,
  },
  {
    slug: "retail-mascotas-feliz",
    company: "Mascota Feliz (cadena de pet shops)",
    industry: "Retail / Veterinarias",
    industryEmoji: "🐾",
    size: "Enterprise (28 sucursales)",
    plan: "Enterprise (custom)",
    challenge:
      "28 sucursales con 28 WhatsApp diferentes, sin trazabilidad ni reporte unificado. CRM Hubspot desconectado del canal.",
    solution:
      "Cappta Enterprise: integración con Hubspot, panel multi-sucursal, SLA garantizado y onboarding dedicado.",
    results: [
      { metric: "1", label: "WhatsApp unificado" },
      { metric: "+40%", label: "NPS de clientes" },
      { metric: "100%", label: "Trazabilidad CRM" },
    ],
    quote:
      "Llevábamos años buscando algo así. Cappta se integró con Hubspot en 2 semanas y nos dio visibilidad total.",
    author: "María José A.",
    role: "Directora de Operaciones",
  },
];

export default function Clientes() {
  useEffect(() => {
    document.title = "Casos de éxito — Cappta AI";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(
        Object.assign(document.createElement("meta"), { name: "description" }),
      );
    meta.setAttribute(
      "content",
      "Casos reales de clientes Cappta AI: restaurantes, salones, e-commerce, clínicas, inmobiliarias y enterprises que automatizaron WhatsApp con IA.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0e1a] text-white" data-testid="page-clientes">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0e1a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <CapptaLogo size={28} />
            <span className="font-semibold text-lg">Cappta AI</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="/#planes" className="hover:text-white" data-testid="link-planes">
              Planes
            </a>
            <a href="/comparar" className="hover:text-white" data-testid="link-comparar">
              Comparar
            </a>
            <a href="/clientes" className="text-white" data-testid="link-clientes">
              Clientes
            </a>
            <a href="/enterprise" className="hover:text-white" data-testid="link-enterprise">
              Enterprise
            </a>
          </nav>
          <Button asChild className="bg-[#7669E9] hover:bg-[#6558d8]" data-testid="button-cta-header">
            <a href="/register">Empezar gratis</a>
          </Button>
        </div>
      </header>

      <section className="px-6 py-20 max-w-7xl mx-auto text-center">
        <Badge className="mb-4 bg-[#7669E9]/20 text-[#a99cff] border-[#7669E9]/30" data-testid="badge-eyebrow">
          CASOS DE ÉXITO
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-hero-title">
          Negocios reales, resultados reales
        </h1>
        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8" data-testid="text-hero-sub">
          Desde un microemprendedor con 1 local hasta cadenas con 28 sucursales: así
          usan Cappta AI para vender más, atender mejor y recuperar su tiempo.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2" data-testid="stat-clients">
            <Users className="w-4 h-4 text-[#7669E9]" />
            +1.200 clientes activos
          </div>
          <div className="flex items-center gap-2" data-testid="stat-messages">
            <MessageSquare className="w-4 h-4 text-[#7669E9]" />
            +5M mensajes/mes
          </div>
          <div className="flex items-center gap-2" data-testid="stat-rating">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            4.8/5 satisfacción
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          {CASE_STUDIES.map((c) => (
            <article
              key={c.slug}
              className={`rounded-2xl border p-6 transition-all hover:border-[#7669E9]/50 ${
                c.highlight
                  ? "border-[#7669E9]/40 bg-gradient-to-br from-[#7669E9]/10 to-transparent"
                  : "border-white/10 bg-white/[0.02]"
              }`}
              data-testid={`card-case-${c.slug}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.industryEmoji}</span>
                  <div>
                    <div className="font-semibold text-lg" data-testid={`text-company-${c.slug}`}>
                      {c.company}
                    </div>
                    <div className="text-xs text-white/50">{c.industry}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                  {c.plan}
                </Badge>
              </div>

              <div className="text-xs text-white/40 mb-4">{c.size}</div>

              <div className="space-y-3 mb-5 text-sm">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Desafío
                  </div>
                  <p className="text-white/80" data-testid={`text-challenge-${c.slug}`}>
                    {c.challenge}
                  </p>
                </div>
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Solución
                  </div>
                  <p className="text-white/80" data-testid={`text-solution-${c.slug}`}>
                    {c.solution}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {c.results.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white/5 border border-white/10 p-3 text-center"
                    data-testid={`metric-${c.slug}-${i}`}
                  >
                    <div className="text-lg font-bold text-[#a99cff]">{r.metric}</div>
                    <div className="text-xs text-white/50">{r.label}</div>
                  </div>
                ))}
              </div>

              <blockquote className="border-l-2 border-[#7669E9] pl-4 italic text-white/80 text-sm">
                <Quote className="w-4 h-4 text-[#7669E9] mb-1 inline-block" />
                <span data-testid={`text-quote-${c.slug}`}>{c.quote}</span>
                <footer className="not-italic text-xs text-white/50 mt-2">
                  — {c.author}, {c.role}
                </footer>
              </blockquote>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 max-w-5xl mx-auto text-center border-t border-white/10">
        <TrendingUp className="w-10 h-10 text-[#7669E9] mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
          ¿Listo para ser el próximo caso?
        </h2>
        <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
          Empieza gratis en 2 minutos o agenda una demo si tu negocio necesita una
          solución a medida.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg" className="bg-[#7669E9] hover:bg-[#6558d8]" data-testid="button-cta-start">
            <a href="/register" className="flex items-center gap-2">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 hover:bg-white/5"
            data-testid="button-cta-enterprise"
          >
            <a href="/enterprise" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Agendar demo enterprise
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
