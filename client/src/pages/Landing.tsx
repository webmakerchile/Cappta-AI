import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
} from "lucide-react";
import { SiShopify, SiWoocommerce, SiWordpress, SiMagento } from "react-icons/si";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const features = [
  {
    icon: Brain,
    title: "IA Conversacional Avanzada",
    description: "Respuestas inteligentes potenciadas por GPT que entienden contexto, historial y la personalidad de tu marca.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "#10b981",
  },
  {
    icon: Plug,
    title: "Conecta Cualquier Plataforma",
    description: "WooCommerce, Shopify, Magento, APIs propias o cualquier sistema. Sin limites de integracion.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "#3b82f6",
  },
  {
    icon: BookOpen,
    title: "Base de Conocimiento con IA",
    description: "Entrena tu bot con documentos, FAQs y politicas. Aprende automaticamente de cada conversacion.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "#a855f7",
  },
  {
    icon: ShoppingCart,
    title: "Catalogo en el Chat",
    description: "Tus clientes exploran productos, ven precios y disponibilidad sin salir de la conversacion.",
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "Dashboard en Tiempo Real",
    description: "Metricas de sesiones, satisfaccion, rendimiento del bot y consumo — todo en un solo lugar.",
    gradient: "from-rose-500/20 to-red-500/20",
    iconColor: "#ef4444",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Filtro de contenido, proteccion anti-spam, aislamiento total de datos entre clientes.",
    gradient: "from-indigo-500/20 to-violet-500/20",
    iconColor: "#6366f1",
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
    planKey: "free",
  },
  {
    name: "Pro",
    price: "$19,990",
    period: " CLP/mes",
    description: "Para negocios que quieren crecer con IA",
    features: [
      "500 sesiones / mes",
      "5,000 mensajes / mes",
      "IA avanzada con GPT",
      "Conecta WooCommerce, Shopify o tu API",
      "Base de conocimiento ilimitada",
      "Catalogo de productos en el chat",
      "Analiticas completas",
      "Soporte prioritario",
    ],
    cta: "Comenzar con Pro",
    highlighted: true,
    planKey: "basic",
  },
  {
    name: "Enterprise",
    price: "$49,990",
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
    cta: "Comenzar Enterprise",
    highlighted: false,
    planKey: "pro",
  },
];

const chatDemo = [
  { sender: "user", text: "Hola, tienen el iPhone 15 Pro disponible?" },
  { sender: "bot", text: "Hola! Si, tenemos el iPhone 15 Pro en stock. Esta disponible en 3 colores: Titanio Natural, Titanio Azul y Titanio Negro. Precio desde $999.990 CLP. Quieres que te envie el link para comprarlo?" },
  { sender: "user", text: "Si, el Titanio Azul por favor" },
  { sender: "bot", text: "Aqui tienes! iPhone 15 Pro - Titanio Azul: tienda.cl/iphone15pro-azul. Tambien tenemos envio gratis por compras sobre $500.000. Algo mas en que pueda ayudarte?" },
];

function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (visibleMessages < chatDemo.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((v) => v + 1);
      }, visibleMessages === 0 ? 800 : 1800);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages]);

  return (
    <div className="w-full max-w-sm mx-auto" data-testid="chat-demo">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ background: "linear-gradient(145deg, #1a1a1a 0%, #0d1117 100%)" }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(142, 72%, 24%) 100%)" }}>
          <img src={logoSinFondo} alt="FoxBot" className="w-8 h-8 rounded-full bg-white/15 p-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">FoxBot Demo</p>
            <p className="text-[10px] text-green-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
              En linea
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3 min-h-[240px]">
          {chatDemo.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white/10 text-white/90 rounded-bl-md"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span className="text-[10px] text-accent font-medium">IA</span>
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {visibleMessages < chatDemo.length && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-white/30 text-sm flex-1">Escribe un mensaje...</span>
            <Send className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto" data-testid="landing-page">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" data-testid="nav-bar">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logoSinFondo} alt="FoxBot" className="w-10 h-10 object-contain" data-testid="img-nav-logo" />
            <span className="text-xl font-extrabold tracking-tight" data-testid="link-home">
              <span className="text-primary">Fox</span><span className="text-accent">Bot</span>
            </span>
          </a>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="#pricing">
              <Button variant="ghost" size="sm" data-testid="link-pricing">Precios</Button>
            </a>
            <a href="/demo">
              <Button variant="ghost" size="sm" data-testid="link-demo-nav">Demo</Button>
            </a>
            <a href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">Iniciar Sesion</Button>
            </a>
            <a href="/register">
              <Button size="sm" data-testid="link-register">
                Prueba Gratis
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative py-20 sm:py-28 px-6 overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <Badge variant="secondary" className="mb-6 text-xs px-3 py-1" data-testid="badge-hero">
              <Sparkles className="w-3 h-3 mr-1.5 text-accent" />
              Potenciado por Inteligencia Artificial
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6" data-testid="text-hero-title">
              Tu asistente de
              <br />
              ventas con{" "}
              <span className="relative inline-block">
                <span className="text-primary">IA</span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-accent/60 rounded-full" />
              </span>
              {" "}que nunca
              <br />
              duerme
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed" data-testid="text-hero-description">
              <strong className="text-foreground">FoxBot</strong> atiende a tus clientes 24/7 con inteligencia artificial,
              conecta tu catalogo de productos y aprende de cada conversacion.
              Funciona con <strong className="text-foreground">cualquier plataforma</strong>.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-8">
              <a href="/register">
                <Button size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg" data-testid="button-hero-register">
                  Comenzar Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="/demo">
                <Button variant="outline" size="lg" className="text-base px-6 py-6 rounded-xl" data-testid="button-hero-demo">
                  Probar Demo Gratis
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-5 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                Sin tarjeta de credito
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Listo en 5 minutos
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                Cualquier plataforma
              </span>
            </div>
          </div>

          <div className="hidden lg:block" id="demo">
            <AnimatedChat />
          </div>
        </div>
      </section>

      <section className="relative py-14 px-6 overflow-hidden" data-testid="section-platforms">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(142, 72%, 32%, 0.03) 0%, transparent 50%, hsl(142, 72%, 32%, 0.03) 100%)" }} />
        <div className="relative max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 tracking-wide uppercase">Compatible con las plataformas que ya usas</p>
          <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap" data-testid="platform-logos">
            {[
              { Icon: SiWoocommerce, name: "WooCommerce" },
              { Icon: SiShopify, name: "Shopify" },
              { Icon: SiWordpress, name: "WordPress" },
              { Icon: SiMagento, name: "Magento" },
              { Icon: Code, name: "Tu API" },
            ].map(({ Icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-2 group">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-border bg-card/50 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                  <Icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{name}</span>
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

      <section className="py-20 px-6 relative overflow-hidden" data-testid="section-stats">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%, 0.04) 0%, transparent 50%, hsl(30, 90%, 52%, 0.03) 100%)" }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "24/7", label: "Disponibilidad total", icon: Clock, desc: "Tu bot nunca descansa" },
              { value: "<2s", label: "Respuesta instantanea", icon: Zap, desc: "Velocidad de IA" },
              { value: "5min", label: "Configuracion rapida", icon: TrendingUp, desc: "Sin conocimiento tecnico" },
              { value: "+90%", label: "Consultas resueltas", icon: Users, desc: "Sin intervencion humana" },
            ].map(({ value, label, icon: Icon, desc }) => (
              <div key={label} className="relative group" data-testid={`stat-${label}`}>
                <div className="rounded-2xl border border-border bg-card/50 p-6 text-center group-hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mx-auto mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">{value}</p>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 relative overflow-hidden" data-testid="section-features">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%) 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">
              <Zap className="w-3 h-3 mr-1.5 text-accent" />
              Caracteristicas
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5" data-testid="text-features-title">
              Todo lo que tu negocio necesita
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-features-description">
              Herramientas poderosas para automatizar, personalizar y escalar tu atencion al cliente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card/30 p-6 hover:border-white/10 transition-all duration-300"
                data-testid={`card-feature-${index}`}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.iconColor}15` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.iconColor }} />
                  </div>
                  <h3 className="text-base font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden" data-testid="section-how-it-works">
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(142, 72%, 32%, 0.03) 0%, transparent 30%, transparent 70%, hsl(142, 72%, 32%, 0.03) 100%)" }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">
              <Clock className="w-3 h-3 mr-1.5 text-accent" />
              Rapido y simple
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5" data-testid="text-how-title">
              En 3 pasos, listo para vender
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              No necesitas ser tecnico. Desde el registro hasta el chat en vivo en minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Crea tu cuenta",
                desc: "Registrate gratis y configura el nombre de tu empresa, colores y mensaje de bienvenida.",
                icon: Headphones,
                color: "#10b981",
              },
              {
                step: "02",
                title: "Conecta tu tienda",
                desc: "Integra WooCommerce, Shopify, tu API propia o entrena la base de conocimiento con tus documentos.",
                icon: Plug,
                color: "#3b82f6",
              },
              {
                step: "03",
                title: "Copia y pega",
                desc: "Agrega una linea de codigo a tu sitio web y FoxBot empieza a atender clientes al instante.",
                icon: Code,
                color: "#a855f7",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative group" data-testid={`step-${index}`}>
                <div className="rounded-2xl border border-border bg-card/30 p-7 h-full hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <item.icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <span className="text-4xl font-extrabold text-white/5">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="/demo">
              <Button variant="outline" size="lg" data-testid="button-steps-demo">
                Prueba la demo en vivo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 relative overflow-hidden" data-testid="section-pricing">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%) 0%, transparent 60%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">
              <Star className="w-3 h-3 mr-1.5 text-accent" />
              Precios transparentes
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5" data-testid="text-pricing-title">
              Un plan para cada negocio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-pricing-description">
              Comienza gratis. Escala cuando quieras. Sin contratos ni compromisos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-[1px] transition-all duration-300 ${
                  plan.highlighted
                    ? "border-0 bg-gradient-to-b from-primary/50 via-primary/20 to-accent/20 shadow-2xl shadow-primary/10 scale-[1.03]"
                    : "border-border hover:border-white/10"
                }`}
                data-testid={`card-pricing-${index}`}
              >
                <div className={`rounded-2xl bg-background h-full ${plan.highlighted ? "p-0" : ""}`}>
                  {plan.highlighted && (
                    <div className="flex justify-center pt-4">
                      <Badge className="shadow-lg" data-testid="badge-popular">
                        <Star className="w-3 h-3 mr-1" />
                        Mas Popular
                      </Badge>
                    </div>
                  )}
                  <div className="text-center px-6 pt-7 pb-2">
                    <h3 className="text-xl font-bold mb-1" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-extrabold" data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    <div className="h-px bg-border mb-5" />
                    <ul className="space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pb-7 pt-3">
                    <a href="/register" className="block">
                      <Button
                        className={`w-full py-5 rounded-xl text-sm font-semibold ${plan.highlighted ? "shadow-lg shadow-primary/20" : ""}`}
                        variant={plan.highlighted ? "default" : "outline"}
                        data-testid={`button-plan-cta-${index}`}
                      >
                        {plan.cta}
                        {plan.highlighted && <ArrowRight className="w-4 h-4 ml-1" />}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Todos los planes incluyen soporte tecnico, actualizaciones gratuitas y sin contratos de permanencia.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(142, 72%, 32%, 0.2) 50%, transparent 100%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%) 0%, transparent 60%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <img src={logoSinFondo} alt="FoxBot" className="w-24 h-24 object-contain" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight" data-testid="text-cta-title">
            Dale a tu negocio el
            <br />
            <span className="text-primary">soporte que merece</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Negocios de todos los tamanos ya usan FoxBot para vender mas y atender mejor.
            Empieza gratis hoy.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/register">
              <Button size="lg" className="text-base px-10 py-6 rounded-xl shadow-xl shadow-primary/20" data-testid="button-cta-register">
                Crear Mi Cuenta Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="/demo">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl" data-testid="button-cta-demo">
                Probar Demo
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-5">
            Sin tarjeta de credito. Sin compromisos. Cancela cuando quieras.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-14 px-6 relative" data-testid="footer">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(142, 72%, 32%, 0.02) 0%, transparent 100%)" }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src={logoSinFondo} alt="FoxBot" className="w-10 h-10 object-contain" />
                <span className="text-xl font-extrabold">
                  <span className="text-primary">Fox</span><span className="text-accent">Bot</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Chatbot con IA para atencion al cliente.
                Funciona con cualquier plataforma.
              </p>
              <p className="text-xs text-muted-foreground/60">Un producto de Web Maker Chile</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Producto</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Caracteristicas</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Precios</a></li>
                <li><a href="/demo" className="hover:text-foreground transition-colors" data-testid="link-footer-demo">Demo en vivo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Integraciones</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-woo">WooCommerce</span></li>
                <li><span data-testid="link-footer-shopify">Shopify</span></li>
                <li><span data-testid="link-footer-wordpress">WordPress</span></li>
                <li><span data-testid="link-footer-api">API Custom</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-privacy">Privacidad</span></li>
                <li><span data-testid="link-footer-terms">Terminos de Uso</span></li>
                <li><span data-testid="link-footer-contact">Contacto</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-10 pt-8 text-center text-sm text-muted-foreground" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} FoxBot by Web Maker Chile. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
