import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  BookOpen,
  Globe,
  Zap,
  Check,
  ArrowRight,
  BarChart3,
  Shield,
  Clock,
  Headphones,
  Code,
  Plug,
  Brain,
  Star,
  Send,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Users,
  TrendingUp,
  MessageSquare,
  Play,
  Bot,
  MousePointerClick,
  Palette,
  ImagePlus,
  ShoppingBag,
  Wifi,
  X,
  Menu,
  UserRound,
  Search,
  Bell,
  Mail,
  LogOut,
  CircleDot,
  Tag,
  Eye,
  Gamepad2,
  FileText,
  PlayCircle,
  Trophy,
  Timer,
  Package,
  Smartphone,
  Download,
  Crown,
  Infinity,
  Handshake,
  CircleCheck,
  Gift,
  UserPlus,
} from "lucide-react";
import { SiShopify, SiWoocommerce, SiWordpress, SiMagento, SiSquarespace, SiWix, SiPrestashop, SiWebflow, SiReact, SiNextdotjs, SiVuedotjs, SiAngular, SiGoogletagmanager } from "react-icons/si";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const features = [
  {
    icon: Brain,
    title: "IA Conversaciónal Avanzada",
    description: "Respuestas inteligentes potenciadas por GPT que entienden contexto, historial y la personalidad de tu marca.",
    iconColor: "#10b981",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  {
    icon: Globe,
    title: "Configuración Automática",
    description: "Pega la URL de tu sitio web y FoxBot extrae productos, servicios, contacto y horarios automáticamente. Cero configuración manual.",
    iconColor: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    icon: Users,
    title: "Equipo Multi-Agente",
    description: "Crea tu equipo con roles: propietario, administrador y ejecutivo. Cada uno ve solo lo que necesita y atiende chats con su identidad.",
    iconColor: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  {
    icon: FileText,
    title: "Entrena con tus Documentos",
    description: "Sube PDFs, manuales, catálogos o archivos Excel. La IA los usa como contexto para dar respuestas precisas y actualizadas.",
    iconColor: "#a855f7",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  {
    icon: ShoppingCart,
    title: "Catálogo en el Chat",
    description: "Tus clientes exploran productos, ven precios y disponibilidad sin salir de la conversación. Compatible con WooCommerce, Shopify y cualquier plataforma.",
    iconColor: "#ef4444",
    glow: "rgba(239, 68, 68, 0.15)",
  },
  {
    icon: Headphones,
    title: "Intervención de Ejecutivos",
    description: "Cuando el cliente necesita atención humana, un ejecutivo toma el control del chat en tiempo real sin que el cliente note el cambio.",
    iconColor: "#6366f1",
    glow: "rgba(99, 102, 241, 0.15)",
  },
  {
    icon: Bell,
    title: "Notificaciones Push",
    description: "Recibe alertas instantáneas cuando un cliente escribe o pide atención. Nunca pierdas una venta por no responder a tiempo.",
    iconColor: "#ec4899",
    glow: "rgba(236, 72, 153, 0.15)",
  },
  {
    icon: BarChart3,
    title: "Dashboard y Analíticas",
    description: "Métricas de sesiones, satisfacción, rendimiento del bot y consumo mensual. Calificaciones con estrellas de tus clientes.",
    iconColor: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.15)",
  },
  {
    icon: Smartphone,
    title: "App Descargable (PWA)",
    description: "Instala FoxBot en tu celular o PC como una app nativa. Funciona offline, recibe notificaciones y responde desde donde estés.",
    iconColor: "#14b8a6",
    glow: "rgba(20, 184, 166, 0.15)",
  },
];

const sharedFeatures = [
  { text: "Chat en vivo con IA + intervención humana", icon: Bot },
  { text: "Widget 100% personalizable en tu sitio", icon: Palette },
  { text: "Configuración automática desde tu URL", icon: Globe },
  { text: "App descargable (PWA) + notificaciones push", icon: Smartphone },
  { text: "Base de conocimiento y entrenamiento con docs", icon: Brain },
  { text: "Catálogo de productos en el chat", icon: ShoppingBag },
  { text: "Atajos, etiquetas y horario comercial", icon: Tag },
  { text: "Multi-agente con asignación y colores", icon: Users },
  { text: "Compatible con cualquier plataforma o API", icon: Plug },
  { text: "Nuestro equipo te ayuda a instalarlo", icon: Handshake },
];

const pricingPlans = [
  {
    name: "Fox Free",
    price: "$0",
    period: "",
    description: "Ideal para probar FoxBot en tu negocio",
    highlights: [
      { text: "10 sesiones / mes", bold: true },
      { text: "100 mensajes / mes", bold: true },
      { text: "1 ejecutivo incluido", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Soporte por email",
    ],
    supportLine: "Nuestro equipo te ayuda a instalarlo gratis",
    cta: "Comenzar Gratis",
    highlighted: false,
    tier: "free" as const,
    borderGradient: "linear-gradient(135deg, hsl(142, 72%, 40%) 0%, hsl(160, 60%, 45%) 50%, hsl(142, 72%, 40%) 100%)",
    bgTint: "rgba(16, 185, 129, 0.03)",
    accentColor: "hsl(142, 72%, 40%)",
    checkBg: "bg-emerald-500/10",
    checkColor: "text-emerald-400",
  },
  {
    name: "Fox Pro",
    price: "$19.990",
    period: " CLP/mes",
    description: "Para negocios que necesitan más volumen",
    highlights: [
      { text: "500 sesiones / mes", bold: true },
      { text: "5.000 mensajes / mes", bold: true },
      { text: "Hasta 3 ejecutivos con roles", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Soporte prioritario",
    ],
    supportLine: "Un ejecutivo de FoxBot te ayuda a configurarlo",
    cta: "Elegir Fox Pro",
    highlighted: true,
    tier: "pro" as const,
    borderGradient: "linear-gradient(135deg, hsl(142, 72%, 40%) 0%, hsl(160, 60%, 35%) 25%, hsl(30, 90%, 52%) 50%, hsl(142, 72%, 40%) 75%, hsl(160, 60%, 35%) 100%)",
    bgTint: "rgba(16, 185, 129, 0.04)",
    accentColor: "hsl(30, 90%, 52%)",
    checkBg: "bg-primary/10",
    checkColor: "text-primary",
  },
  {
    name: "Fox Enterprise",
    price: "$49.990",
    period: " CLP/mes",
    description: "Para empresas con alto volumen de atención",
    highlights: [
      { text: "Sesiones ilimitadas", bold: true },
      { text: "Mensajes ilimitados", bold: true },
      { text: "Hasta 10 ejecutivos con roles", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Analíticas avanzadas y calificaciones",
      "Onboarding personalizado 1 a 1",
      "Ejecutivo dedicado que te acompaña siempre",
      "Soporte prioritario 24/7",
    ],
    supportLine: "Tu ejecutivo dedicado se encarga de todo",
    cta: "Elegir Fox Enterprise",
    highlighted: false,
    tier: "enterprise" as const,
    borderGradient: "linear-gradient(135deg, hsl(38, 92%, 50%) 0%, hsl(45, 93%, 58%) 25%, hsl(28, 80%, 52%) 50%, hsl(38, 92%, 50%) 75%, hsl(45, 93%, 58%) 100%)",
    bgTint: "rgba(245, 158, 11, 0.03)",
    accentColor: "hsl(38, 92%, 50%)",
    checkBg: "bg-amber-500/10",
    checkColor: "text-amber-400",
  },
];


function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}


function CountUp({ target }: { target: string }) {
  const { ref, isVisible } = useInView();
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!isVisible) return;
    const match = target.match(/^([+<]?)(\d+)(.*)/);
    if (!match) { setDisplay(target); return; }
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const suffix = match[3];
    let frame = 0;
    const totalFrames = 40;
    const timer = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplay(prefix + Math.round(num * eased) + suffix);
      if (frame >= totalFrames) { clearInterval(timer); setDisplay(target); }
    }, 25);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span ref={ref as any} className={`${isVisible ? "animate-count-fade" : "opacity-0"}`}>
      {display}
    </span>
  );
}

function FoxBotFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "foxbot-close") {
        setIsOpen(false);
      }
      if (e.data?.type === "foxbot-unread") {
        if (!isOpen) setHasUnread(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) setHasUnread(false);
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-[9999] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10"
          style={{ width: "min(380px, calc(100vw - 32px))", height: "min(560px, calc(100vh - 140px))" }}
          data-testid="foxbot-floating-chat"
        >
          <iframe
            ref={iframeRef}
            src="/widget?tenantId=6&embedded=inline"
            className="w-full h-full border-0 bg-[#0a0a0a] rounded-2xl"
            title="FoxBot Chat"
            allow="microphone"
          />
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          boxShadow: isOpen
            ? "0 4px 12px rgba(16, 185, 129, 0.3)"
            : "0 4px 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.15)",
        }}
        data-testid="button-foxbot-widget"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-[#0a0a0a] animate-pulse" />
        )}
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#10b981]/30 animate-ping" />
        )}
      </button>
    </>
  );
}

export default function Landing() {
  const statsSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const handoffSection = useInView(0.15);
  const stepsSection = useInView(0.1);
  const pricingSection = useInView(0.1);
  const referralSection = useInView(0.15);

  useEffect(() => {
    if (document.getElementById("foxbot-widget")) return;
    const iframe = document.createElement("iframe");
    iframe.id = "foxbot-widget";
    iframe.src = `${window.location.origin}/widget?tenantId=1`;
    iframe.allow = "microphone";
    let pos = "right";
    function setPos(p: string, state: string) {
      const s = p === "left" ? "left" : "right";
      const o = p === "left" ? "right" : "left";
      const mobile = window.innerWidth <= 480;
      if (state === "open") {
        iframe.style.cssText = mobile
          ? "position:fixed;bottom:0;left:0;width:100%;height:100%;border:none;z-index:9999;"
          : `position:fixed;bottom:16px;${s}:16px;${o}:auto;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);`;
      } else {
        iframe.style.cssText = `position:fixed;bottom:12px;${s}:12px;${o}:auto;width:70px;height:70px;border:none;z-index:9999;`;
      }
    }
    setPos(pos, "closed");
    document.body.appendChild(iframe);
    const handler = (e: MessageEvent) => {
      if (!e.data || !e.data.type) return;
      if (e.data.position) pos = e.data.position;
      if (e.data.type === "foxbot_position") { pos = e.data.position; setPos(pos, "closed"); }
      if (e.data.type === "open_chat") setPos(pos, "open");
      if (e.data.type === "close_chat") setPos(pos, "closed");
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      iframe.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto" data-testid="landing-page">
      <MobileNav />

      <section className="relative py-24 sm:py-32 px-6 overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.08) 0%, transparent 60%)" }} />
          <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%, 0.06) 0%, transparent 60%)", animationDelay: "-10s" }} />
          <div className="absolute top-1/3 left-10 w-2 h-2 rounded-full bg-primary/30 animate-float" style={{ animationDelay: "-2s" }} />
          <div className="absolute top-1/4 right-20 w-1.5 h-1.5 rounded-full bg-accent/30 animate-float" style={{ animationDelay: "-4s" }} />
          <div className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "-1s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-border-glow" data-testid="badge-hero">
            <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide">POTENCIADO POR IA AVANZADA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] mb-5 sm:mb-7" data-testid="text-hero-title">
            El chatbot que
            <br />
            <span className="text-gradient-green">vende por ti</span>
            <br />
            <span className="text-white/60">las 24 horas</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed" data-testid="text-hero-description">
            <span className="text-white/80 font-medium">FoxBot</span> es un asistente con inteligencia artificial que atiende, recomienda y cierra ventas.
            Y cuando el cliente necesita atención humana, <span className="text-white/80 font-medium">un ejecutivo toma el control</span> sin interrupciones.
            Se adapta a <span className="text-white/80 font-medium">cualquier plataforma</span>: WordPress, Shopify, WooCommerce, Wix y más.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
            <a href="/register">
              <Button size="lg" className="text-base px-8 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-hero-register">
                Comenzar Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="/demo">
              <Button variant="outline" size="lg" className="text-base px-6 py-6 rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-hero-demo">
                <Play className="w-4 h-4 mr-2 text-primary" />
                Ver Demo en Vivo
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { icon: Check, text: "Sin tarjeta de credito" },
              { icon: Clock, text: "Listo en 5 minutos" },
              { icon: Globe, text: "Cualquier plataforma" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2 text-sm text-white/40">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 px-6 overflow-hidden" data-testid="section-platforms">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-xs font-semibold text-white/30 tracking-[0.2em] uppercase px-4">Integraciones</p>
              <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-sm text-white/25 text-center max-w-md">100% adaptable a cualquier sitio web o plataforma. Solo pega un código y listo.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8" data-testid="platform-logos">
            {[
              { Icon: SiWoocommerce, name: "WooCommerce" },
              { Icon: SiShopify, name: "Shopify" },
              { Icon: SiWordpress, name: "WordPress" },
              { Icon: SiMagento, name: "Magento" },
              { Icon: SiPrestashop, name: "PrestaShop" },
              { Icon: SiSquarespace, name: "Squarespace" },
              { Icon: SiWix, name: "Wix" },
              { Icon: SiWebflow, name: "Webflow" },
              { Icon: SiReact, name: "React" },
              { Icon: SiNextdotjs, name: "Next.js" },
              { Icon: SiVuedotjs, name: "Vue / Nuxt" },
              { Icon: SiAngular, name: "Angular" },
              { Icon: Globe, name: "HTML" },
              { Icon: SiGoogletagmanager, name: "Tag Manager" },
              { Icon: Code, name: "iFrame" },
              { Icon: Plug, name: "Tu API" },
            ].map(({ Icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-2.5 group cursor-default">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl glass-card glass-card-hover transition-all duration-500">
                  <Icon className="w-7 h-7 text-white/30 group-hover:text-primary transition-colors duration-500" />
                </div>
                <span className="text-[11px] text-white/25 font-medium group-hover:text-white/50 transition-colors duration-500">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="py-24 px-6 relative overflow-hidden" ref={statsSection.ref as any} data-testid="section-stats">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: "24/7", label: "Disponibilidad", icon: Clock, desc: "Tu bot nunca descansa", color: "#10b981" },
              { value: "<2s", label: "Respuesta", icon: Zap, desc: "Velocidad de IA", color: "#f59e0b" },
              { value: "5min", label: "Configuración", icon: TrendingUp, desc: "Sin conocimiento técnico", color: "#3b82f6" },
              { value: "+90%", label: "Consultas resueltas", icon: Users, desc: "Sin intervención humana", color: "#a855f7" },
            ].map(({ value, label, icon: Icon, desc, color }, i) => (
              <div key={label} className="group" data-testid={`stat-${label}`}>
                <div className="rounded-2xl glass-card glass-card-hover p-6 text-center transition-all duration-500 h-full" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mx-auto mb-4" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color }}>
                    <CountUp target={value} />
                  </p>
                  <p className="text-sm font-semibold text-white/80">{label}</p>
                  <p className="text-xs text-white/30 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-28 px-6 relative overflow-hidden" ref={featuresSection.ref as any} data-testid="section-features">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[-200px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.05) 0%, transparent 60%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-0 left-[-200px] w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%, 0.04) 0%, transparent 60%)", animationDelay: "-15s" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide">FUNCIONES PRINCIPALES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-features-title">
              Todo lo que necesitas para
              <br />
              <span className="text-gradient-green">automatizar tus ventas</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-features-description">
              Herramientas poderosas de IA para que tu negocio atienda, venda y crezca sin pausas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl glass-card glass-card-hover p-7 transition-all duration-500 ${featuresSection.isVisible ? "animate-count-fade" : "opacity-0"}`}
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`card-feature-${index}`}
              >
                <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${feature.glow} 50%, transparent 100%)` }} />
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg"
                  style={{ backgroundColor: `${feature.iconColor}12`, boxShadow: `0 0 0 0 ${feature.glow}` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.iconColor }} />
                </div>
                <h3 className="text-base font-bold mb-2.5 text-white/90">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden" ref={handoffSection.ref as any} data-testid="section-handoff">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Headphones className="w-3.5 h-3.5 text-[#6366f1]" />
              <span className="text-xs font-semibold text-[#6366f1] tracking-wide">IA + EJECUTIVOS HUMANOS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-handoff-title">
              La IA atiende, el ejecutivo
              <br />
              <span className="text-gradient-green">cierra la venta</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              FoxBot resuelve el 90% de las consultas automáticamente. Pero cuando tu cliente necesita atención humana,
              un ejecutivo toma el control del chat <span className="text-white/60 font-medium">en tiempo real</span>, sin que el cliente se de cuenta del cambio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: "1",
                title: "El bot atiende",
                desc: "FoxBot responde al instante con IA: resuelve dudas, muestra productos y guia al cliente las 24 horas.",
                icon: Bot,
                color: "#10b981",
                gradient: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
              },
              {
                step: "2",
                title: "El cliente pide ayuda",
                desc: "Si necesita algo más complejo, el cliente solicita hablar con un ejecutivo con un solo clic.",
                icon: MessageSquare,
                color: "#f59e0b",
                gradient: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)",
              },
              {
                step: "3",
                title: "El ejecutivo toma el control",
                desc: "Un agente humano entra al chat en vivo, ve todo el historial y continua la conversación sin interrupciones.",
                icon: Headphones,
                color: "#6366f1",
                gradient: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className={`group relative ${handoffSection.isVisible ? "animate-count-fade" : "opacity-0"}`}
                style={{ animationDelay: `${index * 150}ms` }}
                data-testid={`card-handoff-${index}`}
              >
                <div className="rounded-2xl glass-card glass-card-hover p-7 h-full transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: item.gradient }} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: `${item.color}15` }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ color: item.color, backgroundColor: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2.5 text-white/90">{item.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-white/15" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl glass-card p-8 max-w-3xl mx-auto mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { value: "90%", label: "Consultas resueltas por IA", desc: "Sin intervención humana", color: "#10b981" },
                { value: "0s", label: "Tiempo de traspaso", desc: "El ejecutivo entra al instante", color: "#6366f1" },
                { value: "100%", label: "Historial visible", desc: "El agente ve toda la conversación", color: "#f59e0b" },
              ].map(({ value, label, desc, color }) => (
                <div key={label}>
                  <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
                  <p className="text-sm font-semibold text-white/70">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <PreviewTabs />
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden" ref={stepsSection.ref as any} data-testid="section-how-it-works">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 50%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.1) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <MousePointerClick className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">LISTO EN MINUTOS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-how-title">
              <span className="text-gradient-orange">3 pasos</span> y listo
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              No necesitas ser técnico. De cero al chat en vivo en minutos.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(16,185,129,0.12) 20%, rgba(16,185,129,0.12) 80%, transparent 95%)" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: "01",
                  title: "Crea tu cuenta",
                  desc: "Registrate gratis, configura el nombre de tu empresa, colores y mensaje de bienvenida.",
                  icon: Headphones,
                  color: "#10b981",
                },
                {
                  step: "02",
                  title: "Conecta tu tienda",
                  desc: "Integra WooCommerce, Shopify, tu API o entrena la base de conocimiento con tus documentos.",
                  icon: Plug,
                  color: "#3b82f6",
                },
                {
                  step: "03",
                  title: "Copia y pega",
                  desc: "Agrega una línea de código a tu sitio web y FoxBot atiende clientes al instante.",
                  icon: Code,
                  color: "#a855f7",
                },
              ].map((item, index) => (
                <div key={item.step} className={`group ${stepsSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: `${index * 150}ms` }} data-testid={`step-${index}`}>
                  <div className="rounded-2xl glass-card glass-card-hover p-8 h-full text-center transition-all duration-500">
                    <div className="relative mx-auto mb-6">
                      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110" style={{ backgroundColor: `${item.color}10`, boxShadow: `0 0 40px ${item.color}08` }}>
                        <item.icon className="w-9 h-9" style={{ color: item.color }} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-background flex items-center justify-center text-xs font-black" style={{ color: item.color, border: `1px solid ${item.color}30` }}>
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="/demo">
              <Button variant="outline" size="lg" className="rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-steps-demo">
                <Play className="w-4 h-4 mr-2 text-primary" />
                Prueba la demo en vivo
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-28 px-6 relative overflow-hidden" ref={pricingSection.ref as any} data-testid="section-pricing">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.05) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide">PRECIOS TRANSPARENTES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-pricing-title">
              Un plan para <span className="text-gradient-green">cada negocio</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed" data-testid="text-pricing-description">
              Comienza gratis. Escala cuando quieras. Sin contratos.
            </p>
          </div>

          <div className={`mb-14 transition-all duration-700 ${pricingSection.isVisible ? "animate-count-fade" : "opacity-0"}`} data-testid="shared-features-block">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute -inset-[1px] rounded-2xl" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 40%, 0.2) 0%, hsl(160, 60%, 35%, 0.1) 50%, hsl(142, 72%, 40%, 0.2) 100%)" }} />
              <div className="relative glass-card rounded-2xl p-6 sm:p-8" style={{ border: "none" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                    <CircleCheck className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/90">Todos los planes incluyen</h3>
                    <p className="text-xs text-white/35">Sin importar el plan que elijas, tienes acceso a todo</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {sharedFeatures.map((feat) => (
                    <div key={feat.text} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <feat.icon className="w-4 h-4 text-emerald-400/70 shrink-0" />
                      <span className="text-xs text-white/55 leading-tight">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl transition-all duration-500 ${pricingSection.isVisible ? "animate-count-fade" : "opacity-0"} ${plan.highlighted ? "md:scale-105 md:z-10" : ""}`}
                style={{ animationDelay: `${index * 120}ms` }}
                data-testid={`card-pricing-${index}`}
              >
                <div className="absolute -inset-[1px] rounded-3xl animate-gradient-shift z-0" style={{ background: plan.borderGradient, padding: "1px" }}>
                  <div className="w-full h-full rounded-3xl bg-background" />
                </div>

                <div className="absolute -inset-[1px] rounded-3xl z-0 opacity-30 blur-xl animate-subtle-breathe" style={{ background: plan.borderGradient }} />

                <div className="relative z-10 rounded-3xl h-full flex flex-col glass-card" style={{ background: plan.bgTint, border: "none" }}>
                  {plan.tier === "free" && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(150, 60%, 28%) 100%)", color: "white" }}>
                        <Zap className="w-3 h-3" />
                        PLAN INICIAL
                      </div>
                    </div>
                  )}

                  {plan.highlighted && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(150, 60%, 28%) 100%)", color: "white" }}>
                        <Star className="w-3 h-3" />
                        MAS POPULAR
                      </div>
                    </div>
                  )}

                  {plan.tier === "enterprise" && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(38, 92%, 42%) 0%, hsl(28, 80%, 45%) 100%)", color: "white" }}>
                        <Crown className="w-3 h-3" />
                        PREMIUM
                      </div>
                    </div>
                  )}

                  <div className="text-center px-7 pt-7 pb-2">
                    <h3 className="text-xl font-bold mb-1" data-testid={`text-plan-name-${index}`}>
                      {plan.tier === "free" && <><span className="text-gradient-green">Fox</span> Free</>}
                      {plan.tier === "pro" && <><span className="text-gradient-green">Fox</span> <span className="text-gradient-orange">Pro</span></>}
                      {plan.tier === "enterprise" && <><span style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fox</span> <span style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Enterprise</span></>}
                    </h3>
                    <p className="text-sm text-white/35 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-black" style={{ color: plan.accentColor }} data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                      <span className="text-white/35 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <div className="px-7 pb-4 flex-1">
                    <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, transparent, ${plan.accentColor}33, transparent)` }} />

                    <div className="space-y-3 mb-5">
                      {plan.highlights.map((h) => (
                        <div key={h.text} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-lg" style={{ backgroundColor: `${plan.accentColor}18` }}>
                            {h.text.includes("ilimitad") ? (
                              <Infinity className="w-3.5 h-3.5" style={{ color: plan.accentColor }} />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5" style={{ color: plan.accentColor }} />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-white/80">{h.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, transparent, ${plan.accentColor}15, transparent)` }} />

                    <ul className="space-y-3">
                      {plan.extras.map((extra) => (
                        <li key={extra} className="flex items-start gap-3 text-sm">
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full ${plan.checkBg} shrink-0 mt-0.5`}>
                            <Check className={`w-3 h-3 ${plan.checkColor}`} />
                          </div>
                          <span className="text-white/55">{extra}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed" style={{ borderColor: `${plan.accentColor}25`, backgroundColor: `${plan.accentColor}06` }}>
                      <Handshake className="w-4 h-4 shrink-0" style={{ color: plan.accentColor }} />
                      <span className="text-xs font-medium" style={{ color: `${plan.accentColor}cc` }}>{plan.supportLine}</span>
                    </div>
                  </div>

                  <div className="px-7 pb-7 pt-4">
                    <a href="/register" className="block">
                      {plan.tier === "free" && (
                        <Button
                          className="w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                          variant="outline"
                          data-testid={`button-plan-cta-${index}`}
                        >
                          {plan.cta}
                        </Button>
                      )}
                      {plan.tier === "pro" && (
                        <Button
                          className="w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-primary/15"
                          data-testid={`button-plan-cta-${index}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      )}
                      {plan.tier === "enterprise" && (
                        <Button
                          className="w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-amber-500/15 border-0 text-white"
                          style={{ background: "linear-gradient(135deg, hsl(38, 92%, 42%) 0%, hsl(28, 80%, 40%) 100%)" }}
                          data-testid={`button-plan-cta-${index}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      )}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-white/25 mt-12">
            Todas las funcionalidades incluidas en cada plan. Solo cambia la cantidad. Sin contratos de permanencia.
          </p>
        </div>
      </section>

      <section id="referidos" className="py-28 px-6 relative overflow-hidden" ref={referralSection.ref as any} data-testid="section-referral">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.2) 50%, transparent 100%)" }} />
          <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 50%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 50%)", animationDelay: "-15s" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 tracking-wide">PROGRAMA EXCLUSIVO DE REFERIDOS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-referral-title">
              Invita negocios,
              <br />
              <span className="text-gradient-green">gana dinero real</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              Recomienda FoxBot a otros negocios. Por cada referido que <span className="text-white/60 font-semibold">compra un plan de pago</span>,
              <span className="text-amber-400 font-semibold"> tú ganas $3.000 CLP</span> + meses de plan premium gratis. Sin trámites, sin esperas, sin límite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            <div className={`relative rounded-2xl glass-card p-7 transition-all duration-500 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "100ms" }} data-testid="referral-step-1">
              <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))" }}>
                <UserPlus className="w-6 h-6 text-amber-400" />
              </div>
              <div className="absolute top-7 right-7 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                <span className="text-sm font-black text-amber-400">1</span>
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Comparte tu enlace</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Desde tu dashboard, copia tu enlace único de referido y compártelo con cualquier negocio que necesite un chatbot inteligente.
              </p>
            </div>

            <div className={`relative rounded-2xl glass-card p-7 transition-all duration-500 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "250ms" }} data-testid="referral-step-2">
              <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))" }}>
                <CircleCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute top-7 right-7 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-black text-primary">2</span>
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Tu referido compra un plan</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Cuando el negocio se registra con tu enlace y luego compra Fox Pro o Fox Enterprise, el referido se confirma automáticamente.
              </p>
            </div>

            <div className={`relative rounded-2xl glass-card p-7 transition-all duration-500 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "400ms" }} data-testid="referral-step-3">
              <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))" }}>
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div className="absolute top-7 right-7 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                <span className="text-sm font-black text-amber-400">3</span>
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Tú ganas automáticamente</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Al confirmarse la compra, recibes <span className="text-amber-400 font-semibold">$3.000 CLP en saldo</span> + meses de plan premium gratis al instante. Sin solicitudes ni trámites.
              </p>
            </div>
          </div>

          <div className={`mb-14 transition-all duration-700 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "550ms" }}>
            <h3 className="text-center text-lg font-bold text-white/70 mb-8">Escalera de recompensas</h3>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                { refs: 1, reward: "$3.000 CLP + 1 mes Fox Pro", detail: "Tu primer referido: dinero real + plan premium", color: "16,185,129", icon: <Gift className="w-5 h-5" />, tier: "$3.000" },
                { refs: 3, reward: "$9.000 CLP + 2 meses Fox Pro", detail: "$3.000 por cada referido, se acumula sin límite", color: "59,130,246", icon: <Star className="w-5 h-5" />, tier: "$9.000" },
                { refs: 5, reward: "$15.000 CLP + 3 meses Fox Enterprise", detail: "Sesiones y mensajes ilimitados + dinero en tu cuenta", color: "245,158,11", icon: <Trophy className="w-5 h-5" />, tier: "$15.000" },
                { refs: 10, reward: "$30.000 CLP + 6 meses Fox Enterprise", detail: "Nivel experto: el mejor plan + $30.000 acumulados", color: "168,85,247", icon: <Crown className="w-5 h-5" />, tier: "$30.000" },
                { refs: 15, reward: "$45.000 CLP + 12 meses Fox Enterprise", detail: "Embajador FoxBot: 1 año gratis + $45.000 en saldo", color: "236,72,153", icon: <Sparkles className="w-5 h-5" />, tier: "Embajador" },
              ].map((tier, i) => (
                <div
                  key={tier.refs}
                  className={`group relative flex items-center gap-5 rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`}
                  style={{
                    animationDelay: `${600 + i * 120}ms`,
                    background: `linear-gradient(135deg, rgba(${tier.color},0.08), rgba(${tier.color},0.02))`,
                    border: `1px solid rgba(${tier.color},0.15)`,
                  }}
                  data-testid={`referral-tier-${tier.refs}`}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, rgba(${tier.color},0.25), rgba(${tier.color},0.08))` }}>
                    <span style={{ color: `rgb(${tier.color})` }}>{tier.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-lg font-black" style={{ color: `rgb(${tier.color})` }}>{tier.refs} {tier.refs === 1 ? "referido" : "referidos"}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider" style={{ background: `rgba(${tier.color},0.15)`, color: `rgb(${tier.color})` }}>{tier.tier}</span>
                    </div>
                    <p className="text-sm font-semibold text-white/70">{tier.reward}</p>
                    <p className="text-xs text-white/30 mt-0.5">{tier.detail}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: `rgba(${tier.color},0.4)` }} />
                </div>
              ))}
            </div>
          </div>

          <div className={`max-w-3xl mx-auto rounded-2xl p-6 mb-14 transition-all duration-700 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "1000ms", background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))", border: "1px solid rgba(16,185,129,0.1)" }} data-testid="referral-both-win">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))" }}>
                <Handshake className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white/80 mb-2">¿Cómo funciona exactamente?</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  Tu referido se registra gratis con tu enlace y prueba FoxBot sin compromiso. Cuando decide comprar <span className="text-primary font-semibold">Fox Pro o Fox Enterprise</span>, tú recibes <span className="text-amber-400 font-semibold">$3.000 CLP en saldo</span> automáticamente al instante. Además, al alcanzar hitos (1, 3, 5, 10, 15 referidos) desbloqueas meses de plan premium gratis. El saldo se aplica como descuento en tu próxima factura. Sin límite de referidos.
                </p>
              </div>
            </div>
          </div>

          <div className={`text-center transition-all duration-700 ${referralSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "1100ms" }}>
            <a href="/register">
              <Button size="lg" className="text-base px-10 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-referral-register">
                Crear mi cuenta y empezar a referir
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <p className="text-sm text-white/25 mt-4">
              Tu enlace de referido se activa automáticamente al crear tu cuenta. Sin límite de invitaciones.
            </p>
          </div>
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.2) 50%, transparent 100%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.06) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-10">
            <div className="w-28 h-28 rounded-3xl glass-card flex items-center justify-center mx-auto animate-float" style={{ boxShadow: "0 0 60px rgba(16, 185, 129, 0.1)" }}>
              <img src={logoSinFondo} alt="FoxBot" className="w-20 h-20 object-contain" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(150, 60%, 28%) 100%)" }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight" data-testid="text-cta-title">
            Dale a tu negocio el
            <br />
            <span className="text-gradient-green">soporte que merece</span>
          </h2>
          <p className="text-white/40 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Negocios de todos los tamaños ya usan FoxBot para vender más y atender mejor.
            Empieza gratis hoy.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/register">
              <Button size="lg" className="text-base px-10 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-cta-register">
                Crear Mi Cuenta Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="/demo">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-cta-demo">
                <Play className="w-4 h-4 mr-2 text-primary" />
                Probar Demo
              </Button>
            </a>
          </div>
          <p className="text-sm text-white/20 mt-6">
            Sin tarjeta de credito. Sin compromisos. Cancela cuando quieras.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-16 px-6 relative" data-testid="footer">
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <img src={logoSinFondo} alt="FoxBot" className="w-10 h-10 object-contain" />
                <span className="text-xl font-extrabold">
                  <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
                </span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed mb-4">
                Chatbot con IA para atención al cliente.
                100% adaptable a cualquier plataforma.
              </p>
              <p className="text-xs text-white/15">Un producto de Web Maker Chile</p>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-white/60 tracking-wide">Producto</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><a href="#features" className="hover:text-primary transition-colors" data-testid="link-footer-features">Características</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors" data-testid="link-footer-pricing">Precios</a></li>
                <li><a href="/demo" className="hover:text-primary transition-colors" data-testid="link-footer-demo">Demo en vivo</a></li>
                <li><a href="/guias" className="hover:text-primary transition-colors" data-testid="link-footer-guides">Guías de instalación</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-white/60 tracking-wide">Integraciones</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><span data-testid="link-footer-woo">WooCommerce</span></li>
                <li><span data-testid="link-footer-shopify">Shopify</span></li>
                <li><span data-testid="link-footer-wordpress">WordPress</span></li>
                <li><span data-testid="link-footer-api">API Custom</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-white/60 tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><span data-testid="link-footer-privacy">Privacidad</span></li>
                <li><span data-testid="link-footer-terms">Terminos de Uso</span></li>
                <li><span data-testid="link-footer-contact">Contacto</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] mt-12 pt-8 text-center text-sm text-white/20" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} FoxBot by Web Maker Chile. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <FoxBotFloatingWidget />
    </div>
  );
}
