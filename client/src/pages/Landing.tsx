import { useState, useEffect, useRef } from "react";
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
  Users,
  TrendingUp,
  MessageSquare,
  Play,
  Bot,
  MousePointerClick,
  Palette,
} from "lucide-react";
import { SiShopify, SiWoocommerce, SiWordpress, SiMagento } from "react-icons/si";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const features = [
  {
    icon: Brain,
    title: "IA Conversacional Avanzada",
    description: "Respuestas inteligentes potenciadas por GPT que entienden contexto, historial y la personalidad de tu marca.",
    iconColor: "#10b981",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  {
    icon: Plug,
    title: "Conecta Cualquier Plataforma",
    description: "WooCommerce, Shopify, Magento, APIs propias o cualquier sistema. Sin limites de integracion.",
    iconColor: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  {
    icon: BookOpen,
    title: "Base de Conocimiento con IA",
    description: "Entrena tu bot con documentos, FAQs y politicas. Aprende automaticamente de cada conversacion.",
    iconColor: "#a855f7",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  {
    icon: ShoppingCart,
    title: "Catalogo en el Chat",
    description: "Tus clientes exploran productos, ven precios y disponibilidad sin salir de la conversacion.",
    iconColor: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    icon: BarChart3,
    title: "Dashboard en Tiempo Real",
    description: "Metricas de sesiones, satisfaccion, rendimiento del bot y consumo — todo en un solo lugar.",
    iconColor: "#ef4444",
    glow: "rgba(239, 68, 68, 0.15)",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Filtro de contenido, proteccion anti-spam, aislamiento total de datos entre clientes.",
    iconColor: "#6366f1",
    glow: "rgba(99, 102, 241, 0.15)",
  },
];

const pricingPlans = [
  {
    name: "Gratis",
    price: "$0",
    period: "",
    description: "Ideal para probar FoxBot en tu negocio",
    features: [
      "50 sesiones / mes",
      "500 mensajes / mes",
      "Chat en vivo con tus clientes",
      "Respuestas automaticas basicas",
      "Widget personalizable",
      "Soporte por email",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.990",
    period: " CLP/mes",
    description: "Para negocios que quieren crecer con IA",
    features: [
      "500 sesiones / mes",
      "5.000 mensajes / mes",
      "IA avanzada con GPT",
      "Conecta WooCommerce, Shopify o tu API",
      "Base de conocimiento ilimitada",
      "Catalogo de productos en el chat",
      "Analiticas completas",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$49.990",
    period: " CLP/mes",
    description: "Para empresas con alto volumen de atencion",
    features: [
      "Sesiones ilimitadas",
      "Mensajes ilimitados",
      "IA personalizada para tu marca",
      "Integraciones a medida",
      "API dedicada",
      "Multi-agente con asignacion",
      "Soporte 24/7 dedicado",
      "Onboarding personalizado",
    ],
    cta: "Elegir Enterprise",
    highlighted: false,
  },
];

const brandThemes = [
  {
    name: "TechStore",
    headerBg: "linear-gradient(135deg, hsl(142, 72%, 29%) 0%, hsl(150, 60%, 22%) 100%)",
    userBubble: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(142, 72%, 26%) 100%)",
    accent: "#10b981",
    accentGlow: "rgba(16, 185, 129, 0.08)",
    statusColor: "#4ade80",
    statusBorder: "#166534",
    subtitleColor: "rgba(187, 247, 208, 0.8)",
    sendBg: "rgba(16, 185, 129, 0.2)",
    sendIcon: "#10b981",
    label: "Verde",
    messages: [
      { sender: "user", text: "Hola, tienen el iPhone 15 Pro disponible?" },
      { sender: "bot", text: "Hola! Si, tenemos el iPhone 15 Pro en stock. Disponible en Titanio Natural, Azul y Negro. Desde $999.990 CLP. Te envio el link?" },
      { sender: "user", text: "Si, el Titanio Azul por favor" },
      { sender: "bot", text: "Aqui tienes! tienda.cl/iphone15pro-azul. Envio gratis en compras sobre $500.000. Algo mas?" },
    ],
  },
  {
    name: "Sabor Criollo",
    headerBg: "linear-gradient(135deg, hsl(25, 85%, 38%) 0%, hsl(15, 70%, 28%) 100%)",
    userBubble: "linear-gradient(135deg, hsl(25, 85%, 42%) 0%, hsl(25, 80%, 34%) 100%)",
    accent: "#f97316",
    accentGlow: "rgba(249, 115, 22, 0.08)",
    statusColor: "#fb923c",
    statusBorder: "#7c2d12",
    subtitleColor: "rgba(254, 215, 170, 0.8)",
    sendBg: "rgba(249, 115, 22, 0.2)",
    sendIcon: "#f97316",
    label: "Naranja",
    messages: [
      { sender: "user", text: "Hola! Tienen delivery disponible?" },
      { sender: "bot", text: "Si! Hacemos delivery de Lunes a Sabado de 12:00 a 22:00. Envio gratis sobre $15.000. Quieres ver el menu?" },
      { sender: "user", text: "Si, quiero empanadas y cazuela" },
      { sender: "bot", text: "Excelente! Empanadas $2.500 c/u y Cazuela $9.990. Total con delivery gratis: $14.990. Confirmo tu pedido?" },
    ],
  },
  {
    name: "VidaSana Clinica",
    headerBg: "linear-gradient(135deg, hsl(217, 75%, 42%) 0%, hsl(225, 65%, 30%) 100%)",
    userBubble: "linear-gradient(135deg, hsl(217, 75%, 46%) 0%, hsl(217, 70%, 36%) 100%)",
    accent: "#3b82f6",
    accentGlow: "rgba(59, 130, 246, 0.08)",
    statusColor: "#60a5fa",
    statusBorder: "#1e3a8a",
    subtitleColor: "rgba(191, 219, 254, 0.8)",
    sendBg: "rgba(59, 130, 246, 0.2)",
    sendIcon: "#3b82f6",
    label: "Azul",
    messages: [
      { sender: "user", text: "Quiero agendar un blanqueamiento dental" },
      { sender: "bot", text: "Con gusto! Nuestro blanqueamiento tiene un valor de $89.990. Tenemos horas disponibles esta semana. Que dia te acomoda?" },
      { sender: "user", text: "El viernes en la tarde" },
      { sender: "bot", text: "Perfecto! Te agendo para el Viernes a las 16:00. Recuerda que la primera evaluacion es gratuita. Te envio confirmacion por email?" },
    ],
  },
  {
    name: "Moda Urbana",
    headerBg: "linear-gradient(135deg, hsl(280, 65%, 40%) 0%, hsl(270, 55%, 28%) 100%)",
    userBubble: "linear-gradient(135deg, hsl(280, 65%, 44%) 0%, hsl(280, 60%, 34%) 100%)",
    accent: "#a855f7",
    accentGlow: "rgba(168, 85, 247, 0.08)",
    statusColor: "#c084fc",
    statusBorder: "#581c87",
    subtitleColor: "rgba(233, 213, 255, 0.8)",
    sendBg: "rgba(168, 85, 247, 0.2)",
    sendIcon: "#a855f7",
    label: "Morado",
    messages: [
      { sender: "user", text: "Hola! Busco zapatillas talla 42" },
      { sender: "bot", text: "Tenemos varias opciones en talla 42! Zapatillas urbanas desde $39.990 y deportivas desde $54.990. Te muestro las mas vendidas?" },
      { sender: "user", text: "Si, las urbanas por favor" },
      { sender: "bot", text: "Estas son top: Nike Air Force $59.990, Adidas Stan Smith $54.990. Envio gratis sobre $40.000. Quieres agregar algo al carrito?" },
    ],
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

function AnimatedChat() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = brandThemes[themeIndex];

  const clearAllTimers = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  useEffect(() => {
    if (transitioning) return;
    if (visibleMessages < theme.messages.length) {
      const timer = setTimeout(() => setVisibleMessages((v) => v + 1), visibleMessages === 0 ? 800 : 1800);
      return () => clearTimeout(timer);
    } else {
      const autoAdvance = setTimeout(() => {
        clearAllTimers();
        setTransitioning(true);
        transitionTimerRef.current = setTimeout(() => {
          setThemeIndex((i) => (i + 1) % brandThemes.length);
          setVisibleMessages(0);
          setTransitioning(false);
          transitionTimerRef.current = null;
        }, 500);
      }, 3000);
      return () => clearTimeout(autoAdvance);
    }
  }, [visibleMessages, theme.messages.length, transitioning, themeIndex]);

  return (
    <div className="w-full max-w-sm mx-auto" data-testid="chat-demo">
      <div className="relative">
        <div
          className="rounded-3xl overflow-hidden border border-white/[0.08] relative"
          style={{
            background: "linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.98) 100%)",
            boxShadow: `0 0 80px ${theme.accentGlow}, 0 25px 50px rgba(0,0,0,0.4)`,
            transition: "box-shadow 0.6s ease",
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "scale(0.97) translateY(8px)" : "scale(1) translateY(0)",
            transitionProperty: "opacity, transform, box-shadow",
            transitionDuration: "0.5s",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.accent}0d 0%, transparent 40%, ${theme.accent}08 100%)`, transition: "background 0.6s ease" }} />
          <div className="relative px-4 py-3.5 flex items-center gap-3" style={{ background: theme.headerBg, transition: "background 0.6s ease" }}>
            <div className="relative">
              <img src={logoSinFondo} alt="FoxBot" className="w-9 h-9 rounded-full bg-white/15 p-0.5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: theme.statusColor, borderColor: theme.statusBorder, transition: "background-color 0.6s, border-color 0.6s" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">{theme.name}</p>
              <p className="text-[10px]" style={{ color: theme.subtitleColor, transition: "color 0.6s" }}>Responde al instante con IA</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="relative p-4 space-y-3 min-h-[220px]">
            {theme.messages.slice(0, visibleMessages).map((msg, i) => (
              <div key={`${themeIndex}-${i}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`} style={{ animation: "count-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                <div className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.sender === "user" ? "rounded-2xl rounded-br-sm text-white" : "rounded-2xl rounded-bl-sm text-white/90"}`} style={{ background: msg.sender === "user" ? theme.userBubble : "rgba(255,255,255,0.07)" }}>
                  {msg.sender === "bot" && (
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3" style={{ color: theme.accent }} />
                      <span className="text-[10px] font-semibold" style={{ color: theme.accent }}>IA</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {visibleMessages < theme.messages.length && (
              <div className="flex justify-start">
                <div className="bg-white/[0.07] px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `${theme.accent}99`, animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `${theme.accent}99`, animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `${theme.accent}99`, animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative px-4 pb-3.5">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5">
              <span className="text-white/25 text-sm flex-1">Escribe un mensaje...</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.sendBg, transition: "background-color 0.6s" }}>
                <Send className="w-4 h-4" style={{ color: theme.sendIcon, transition: "color 0.6s" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2" data-testid="theme-indicators">
          {brandThemes.map((t, i) => (
            <button
              key={t.name}
              data-testid={`theme-dot-${i}`}
              onClick={() => {
                if (i === themeIndex || transitioning) return;
                clearAllTimers();
                setTransitioning(true);
                transitionTimerRef.current = setTimeout(() => {
                  setThemeIndex(i);
                  setVisibleMessages(0);
                  setTransitioning(false);
                  transitionTimerRef.current = null;
                }, 400);
              }}
              className="relative group flex flex-col items-center gap-1.5"
            >
              <div
                className="w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
                style={{
                  backgroundColor: i === themeIndex ? t.accent : `${t.accent}30`,
                  borderColor: i === themeIndex ? t.accent : `${t.accent}50`,
                  transform: i === themeIndex ? "scale(1.15)" : "scale(1)",
                  boxShadow: i === themeIndex ? `0 0 12px ${t.accent}40` : "none",
                }}
              >
                {i === themeIndex && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[10px] font-medium transition-colors duration-300" style={{ color: i === themeIndex ? t.accent : "rgba(255,255,255,0.3)" }}>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/30">
          <Palette className="w-3.5 h-3.5" style={{ color: theme.accent, transition: "color 0.6s" }} />
          <span>Colores 100% personalizables por negocio</span>
        </div>
      </div>
    </div>
  );
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

export default function Landing() {
  const statsSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const stepsSection = useInView(0.1);
  const pricingSection = useInView(0.1);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto" data-testid="landing-page">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl" data-testid="nav-bar">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <a href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
            <img src={logoSinFondo} alt="FoxBot" className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110" data-testid="img-nav-logo" />
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href="#features">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-features">Funciones</Button>
            </a>
            <a href="#pricing">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-pricing">Precios</Button>
            </a>
            <a href="/demo">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-demo-nav">Demo</Button>
            </a>
            <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
            <a href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">Iniciar Sesion</Button>
            </a>
            <a href="/register">
              <Button size="sm" className="rounded-xl px-4" data-testid="link-register">
                Prueba Gratis
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative py-24 sm:py-32 px-6 overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.08) 0%, transparent 60%)" }} />
          <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%, 0.06) 0%, transparent 60%)", animationDelay: "-10s" }} />
          <div className="absolute top-1/3 left-10 w-2 h-2 rounded-full bg-primary/30 animate-float" style={{ animationDelay: "-2s" }} />
          <div className="absolute top-1/4 right-20 w-1.5 h-1.5 rounded-full bg-accent/30 animate-float" style={{ animationDelay: "-4s" }} />
          <div className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "-1s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-border-glow" data-testid="badge-hero">
              <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">POTENCIADO POR IA AVANZADA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] mb-7" data-testid="text-hero-title">
              El chatbot que
              <br />
              <span className="text-gradient-green">vende por ti</span>
              <br />
              <span className="text-white/60">las 24 horas</span>
            </h1>

            <p className="text-lg text-white/50 max-w-lg mb-10 leading-relaxed" data-testid="text-hero-description">
              <span className="text-white/80 font-medium">FoxBot</span> es un asistente con inteligencia artificial que atiende, recomienda y cierra ventas.
              Se conecta a tu tienda en minutos. Funciona con <span className="text-white/80 font-medium">cualquier plataforma</span>.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-10">
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

            <div className="flex items-center gap-6 flex-wrap">
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

          <div className="hidden lg:block" id="demo">
            <AnimatedChat />
          </div>
        </div>
      </section>

      <section className="relative py-12 px-6 overflow-hidden" data-testid="section-platforms">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/10" />
            <p className="text-xs font-semibold text-white/30 tracking-[0.2em] uppercase px-4">Integraciones</p>
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap" data-testid="platform-logos">
            {[
              { Icon: SiWoocommerce, name: "WooCommerce" },
              { Icon: SiShopify, name: "Shopify" },
              { Icon: SiWordpress, name: "WordPress" },
              { Icon: SiMagento, name: "Magento" },
              { Icon: Code, name: "Tu API" },
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

      <section className="lg:hidden py-12 px-6" id="demo-mobile" data-testid="section-demo-mobile">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Mira a FoxBot en accion</h2>
          <AnimatedChat />
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
              { value: "5min", label: "Configuracion", icon: TrendingUp, desc: "Sin conocimiento tecnico", color: "#3b82f6" },
              { value: "+90%", label: "Consultas resueltas", icon: Users, desc: "Sin intervencion humana", color: "#a855f7" },
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
              No necesitas ser tecnico. De cero al chat en vivo en minutos.
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
                  desc: "Agrega una linea de codigo a tu sitio web y FoxBot atiende clientes al instante.",
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl transition-all duration-500 ${pricingSection.isVisible ? "animate-count-fade" : "opacity-0"} ${plan.highlighted ? "md:scale-105 md:z-10" : ""}`}
                style={{ animationDelay: `${index * 120}ms` }}
                data-testid={`card-pricing-${index}`}
              >
                {plan.highlighted && (
                  <div className="absolute -inset-[1px] rounded-3xl animate-gradient-shift z-0" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 40%) 0%, hsl(160, 60%, 35%) 25%, hsl(30, 90%, 52%) 50%, hsl(142, 72%, 40%) 75%, hsl(160, 60%, 35%) 100%)", padding: "1px" }}>
                    <div className="w-full h-full rounded-3xl bg-background" />
                  </div>
                )}

                <div className={`relative z-10 rounded-3xl h-full flex flex-col ${plan.highlighted ? "glass-card" : "glass-card"}`} style={plan.highlighted ? { background: "rgba(16, 185, 129, 0.04)", border: "none" } : {}}>
                  {plan.highlighted && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(150, 60%, 28%) 100%)", color: "white" }}>
                        <Star className="w-3 h-3" />
                        MAS POPULAR
                      </div>
                    </div>
                  )}

                  <div className="text-center px-7 pt-7 pb-2">
                    <h3 className="text-xl font-bold mb-1" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                    <p className="text-sm text-white/35 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-black" data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                      <span className="text-white/35 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <div className="px-7 pb-4 flex-1">
                    <div className="h-px bg-white/[0.06] mb-6" />
                    <ul className="space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-white/60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-7 pb-7 pt-4">
                    <a href="/register" className="block">
                      <Button
                        className={`w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] ${plan.highlighted ? "shadow-xl shadow-primary/15" : ""}`}
                        variant={plan.highlighted ? "default" : "outline"}
                        data-testid={`button-plan-cta-${index}`}
                      >
                        {plan.cta}
                        {plan.highlighted && <ArrowRight className="w-4 h-4 ml-1.5" />}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-white/25 mt-12">
            Todos los planes incluyen soporte tecnico, actualizaciones gratuitas y sin contratos de permanencia.
          </p>
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
            Negocios de todos los tamanos ya usan FoxBot para vender mas y atender mejor.
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
                Chatbot con IA para atencion al cliente.
                Funciona con cualquier plataforma.
              </p>
              <p className="text-xs text-white/15">Un producto de Web Maker Chile</p>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-white/60 tracking-wide">Producto</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><a href="#features" className="hover:text-primary transition-colors" data-testid="link-footer-features">Caracteristicas</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors" data-testid="link-footer-pricing">Precios</a></li>
                <li><a href="/demo" className="hover:text-primary transition-colors" data-testid="link-footer-demo">Demo en vivo</a></li>
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
    </div>
  );
}
