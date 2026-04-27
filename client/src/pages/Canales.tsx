import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapptaLogo } from "@/components/CapptaLogo";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Mail,
  Send,
  Globe,
  Zap,
  Inbox,
} from "lucide-react";
import { SiInstagram, SiFacebook, SiTelegram, SiWhatsapp } from "react-icons/si";

interface Channel {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bullets: string[];
  setupSteps: string[];
  badge?: string;
}

const CHANNELS: Channel[] = [
  {
    slug: "whatsapp",
    name: "WhatsApp",
    description:
      "El canal #1 en LATAM. Respondé pedidos, reservas y consultas las 24 hrs sin perder un solo cliente.",
    icon: SiWhatsapp,
    color: "#25D366",
    bullets: [
      "Twilio Sandbox para empezar gratis en minutos",
      "WhatsApp Cloud API directo (sin proxy)",
      "Plantillas vertical aplicadas automáticamente",
      "Imágenes, audios y documentos",
    ],
    setupSteps: [
      "Conectá tu número desde el panel",
      "Pegá tu token y phone number ID",
      "Apuntá el webhook a Cappta",
      "Listo — recibís mensajes en el inbox unificado",
    ],
    badge: "+34% conversión",
  },
  {
    slug: "instagram",
    name: "Instagram DM",
    description:
      "Convertí seguidores en clientes. Respondé DMs, comentarios y stories desde un solo inbox.",
    icon: SiInstagram,
    color: "#E1306C",
    bullets: [
      "Meta Business API oficial",
      "DMs en tiempo real con notificaciones",
      "Auto-respuestas con tu plantilla vertical",
      "Historial completo por cliente",
    ],
    setupSteps: [
      "Conectá tu cuenta Business de Instagram",
      "Pegá tu Page Access Token",
      "Verificá el webhook con Meta",
      "Empezá a responder desde el panel",
    ],
  },
  {
    slug: "messenger",
    name: "Facebook Messenger",
    description:
      "Atendé a clientes desde tu página de Facebook con respuestas instantáneas 24/7.",
    icon: SiFacebook,
    color: "#0084FF",
    bullets: [
      "Integración oficial con Meta",
      "Multi-página soportado",
      "Respuestas con IA o agente humano",
      "Inbox unificado con WhatsApp e Instagram",
    ],
    setupSteps: [
      "Conectá tu Página de Facebook",
      "Generá un Page Access Token",
      "Verificá el webhook",
      "Listo para recibir mensajes",
    ],
  },
  {
    slug: "telegram",
    name: "Telegram",
    description:
      "El canal favorito de comunidades cripto, gaming y tech. Setup en 60 segundos con BotFather.",
    icon: SiTelegram,
    color: "#0088cc",
    bullets: [
      "Setup express con BotFather",
      "Bot público o privado",
      "Comandos personalizados",
      "Soporte para grupos y canales",
    ],
    setupSteps: [
      "Creá tu bot con BotFather (/newbot)",
      "Copiá el token a Cappta",
      "Cappta configura el webhook automáticamente",
      "Empezá a chatear",
    ],
    badge: "60s setup",
  },
  {
    slug: "email",
    name: "Email-to-Chat",
    description:
      "Convertí cualquier email en una conversación. Tus clientes escriben a tu casilla y vos respondés desde el inbox.",
    icon: Mail,
    color: "#F59E0B",
    bullets: [
      "Reenvío SMTP a tu dirección Cappta",
      "Plus-addressing soportado",
      "Hilos agrupados por conversación",
      "Respuestas vía Resend",
    ],
    setupSteps: [
      "Activá el canal Email en el panel",
      "Configurá tu dirección de inbound",
      "Reenviá emails desde tu casilla",
      "Respondé desde el inbox unificado",
    ],
  },
  {
    slug: "web",
    name: "Web Chat",
    description:
      "El widget original de Cappta. Embebelo en tu sitio con una línea de código.",
    icon: Globe,
    color: "#10B981",
    bullets: [
      "1 línea de código para instalar",
      "100% personalizable (colores, logos, mensajes)",
      "Carga asíncrona — no afecta SEO",
      "Mobile-first y accesible",
    ],
    setupSteps: [
      "Copiá el snippet desde el panel",
      "Pegalo antes de </body>",
      "Personalizá colores y mensajes",
      "Listo en tu sitio",
    ],
  },
];

export default function CanalesPage() {
  useEffect(() => {
    document.title = "Canales — Omnicanalidad para tu negocio | Cappta AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Conectá WhatsApp, Instagram, Messenger, Telegram, Email y Web Chat en un solo inbox. Setup en minutos, sin código.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <CapptaLogo className="h-8" />
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="/clientes" data-testid="link-clientes">Clientes</a>
            <a href="/comparar" data-testid="link-comparar">Comparativas</a>
            <a href="/enterprise" data-testid="link-enterprise">Enterprise</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild data-testid="button-login">
              <a href="/login">Ingresar</a>
            </Button>
            <Button size="sm" asChild data-testid="button-register">
              <a href="/register">Empezar gratis</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <Badge variant="outline" className="mb-4" data-testid="badge-omnicanal">
          <Zap className="w-3 h-3 mr-1" /> Omnicanalidad
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight" data-testid="text-hero-title">
          Todos tus canales,
          <br />
          <span className="text-primary">un solo inbox.</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8" data-testid="text-hero-subtitle">
          WhatsApp, Instagram, Messenger, Telegram, Email y Web Chat. Conectá lo que ya usás y respondé todo desde un solo lugar.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" asChild data-testid="button-cta-register">
            <a href="/register">
              Empezar gratis <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild data-testid="button-cta-demo">
            <a href="/demo">Ver demo</a>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <article
                key={ch.slug}
                className="rounded-2xl glass-card p-6 hover-elevate transition-all"
                data-testid={`card-channel-${ch.slug}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${ch.color}1A`, color: ch.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {ch.badge && (
                    <Badge variant="secondary" data-testid={`badge-${ch.slug}`}>
                      {ch.badge}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1" data-testid={`text-channel-name-${ch.slug}`}>
                  {ch.name}
                </h2>
                <p className="text-sm text-white/50 mb-4" data-testid={`text-channel-desc-${ch.slug}`}>
                  {ch.description}
                </p>
                <ul className="space-y-2 mb-4">
                  {ch.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">
                    Setup
                  </p>
                  <ol className="space-y-1.5">
                    {ch.setupSteps.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-white/60"
                        data-testid={`text-setup-step-${ch.slug}-${i}`}
                      >
                        <span className="text-primary font-bold min-w-[16px]">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl glass-card p-8 md:p-12 text-center">
          <Inbox className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-black mb-3" data-testid="text-inbox-title">
            Inbox unificado
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-6" data-testid="text-inbox-desc">
            Tus agentes humanos atienden todos los canales desde la misma pantalla. Filtros por canal, badges visuales,
            y respuestas con IA o manuales. Sin saltar entre apps.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { icon: SiWhatsapp, label: "WhatsApp", color: "#25D366" },
              { icon: SiInstagram, label: "Instagram", color: "#E1306C" },
              { icon: SiFacebook, label: "Messenger", color: "#0084FF" },
              { icon: SiTelegram, label: "Telegram", color: "#0088cc" },
              { icon: Mail, label: "Email", color: "#F59E0B" },
              { icon: MessageCircle, label: "Web", color: "#10B981" },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                data-testid={`badge-inbox-${c.label.toLowerCase()}`}
              >
                <c.icon className="w-4 h-4" style={{ color: c.color }} />
                <span className="text-sm">{c.label}</span>
              </div>
            ))}
          </div>
          <Button size="lg" asChild data-testid="button-inbox-cta">
            <a href="/register">
              Probar inbox unificado <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-white/40">
          <CapptaLogo className="h-7 mx-auto mb-3 opacity-60" />
          <p>© 2026 Cappta AI. Conectá todos tus canales en minutos.</p>
        </div>
      </footer>
    </div>
  );
}
