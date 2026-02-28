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
} from "lucide-react";
import { SiShopify, SiWoocommerce, SiWordpress, SiMagento } from "react-icons/si";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const features = [
  {
    icon: Brain,
    title: "IA Conversacional Avanzada",
    description: "Respuestas inteligentes potenciadas por GPT que entienden contexto, historial y la personalidad de tu marca.",
  },
  {
    icon: Plug,
    title: "Conecta Cualquier Plataforma",
    description: "WooCommerce, Shopify, Magento, APIs propias o cualquier sistema. Sin limites de integracion.",
  },
  {
    icon: BookOpen,
    title: "Base de Conocimiento con IA",
    description: "Entrena tu bot con documentos, FAQs y politicas. Aprende automaticamente de cada conversacion.",
  },
  {
    icon: ShoppingCart,
    title: "Catalogo en el Chat",
    description: "Tus clientes exploran productos, ven precios y disponibilidad sin salir de la conversacion.",
  },
  {
    icon: BarChart3,
    title: "Dashboard en Tiempo Real",
    description: "Metricas de sesiones, satisfaccion, rendimiento del bot y consumo — todo en un solo lugar.",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Filtro de contenido, proteccion anti-spam, aislamiento total de datos entre clientes.",
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

function PlatformLogos() {
  return (
    <div className="flex items-center justify-center gap-8 flex-wrap opacity-60" data-testid="platform-logos">
      <div className="flex flex-col items-center gap-1">
        <SiWoocommerce className="w-8 h-8" />
        <span className="text-[10px] text-muted-foreground">WooCommerce</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SiShopify className="w-8 h-8" />
        <span className="text-[10px] text-muted-foreground">Shopify</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SiWordpress className="w-8 h-8" />
        <span className="text-[10px] text-muted-foreground">WordPress</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SiMagento className="w-8 h-8" />
        <span className="text-[10px] text-muted-foreground">Magento</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Code className="w-8 h-8" />
        <span className="text-[10px] text-muted-foreground">Tu API</span>
      </div>
    </div>
  );
}

function StatsCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
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

      <section className="py-12 px-6 border-y border-border bg-card/50" data-testid="section-platforms">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">Funciona con las plataformas que ya usas</p>
          <PlatformLogos />
        </div>
      </section>

      <section className="lg:hidden py-12 px-6" id="demo-mobile" data-testid="section-demo-mobile">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Mira a FoxBot en accion</h2>
          <AnimatedChat />
        </div>
      </section>

      <section className="py-16 px-6 bg-card/30" data-testid="section-stats">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatsCounter value="24/7" label="Disponibilidad" />
          <StatsCounter value="<2s" label="Tiempo de respuesta" />
          <StatsCounter value="95%" label="Margen de ganancia" />
          <StatsCounter value="5min" label="Configuracion" />
        </div>
      </section>

      <section id="features" className="py-20 px-6" data-testid="section-features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Caracteristicas
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-features-title">
              Todo lo que tu negocio necesita
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-features-description">
              Herramientas poderosas para automatizar, personalizar y escalar tu atencion al cliente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="group hover:border-primary/30 transition-colors duration-300" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card" data-testid="section-how-it-works">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Clock className="w-3 h-3 mr-1" />
            Rapido y simple
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-how-title">
            En 3 pasos, listo para vender
          </h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            No necesitas ser tecnico. Desde el registro hasta el chat en vivo en minutos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Crea tu cuenta", desc: "Registrate gratis y configura el nombre de tu empresa, colores y mensaje de bienvenida.", icon: Headphones },
              { step: "2", title: "Conecta tu tienda", desc: "Integra WooCommerce, Shopify, tu API propia o simplemente entrena la base de conocimiento.", icon: Plug },
              { step: "3", title: "Copia y pega", desc: "Agrega una linea de codigo a tu sitio web y FoxBot empieza a atender clientes al instante.", icon: Code },
            ].map((item, index) => (
              <div key={item.step} className="flex flex-col items-center gap-4 relative" data-testid={`step-${index}`}>
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6" data-testid="section-pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Precios transparentes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-pricing-title">
              Un plan para cada negocio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-pricing-description">
              Comienza gratis. Escala cuando quieras. Sin contratos ni compromisos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 ${plan.highlighted ? "border-primary border-2 shadow-xl shadow-primary/10 scale-[1.02]" : "hover:border-primary/20"}`}
                data-testid={`card-pricing-${index}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                )}
                {plan.highlighted && (
                  <div className="absolute right-4 top-0">
                    <Badge className="rounded-t-none rounded-b-lg shadow-md" data-testid="badge-popular">
                      Mas Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl" data-testid={`text-plan-name-${index}`}>{plan.name}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                  <div className="mt-5 mb-1">
                    <span className="text-4xl font-extrabold" data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pb-8">
                  <a href="/register" className="w-full">
                    <Button
                      className={`w-full py-5 rounded-xl text-sm font-semibold ${plan.highlighted ? "shadow-lg shadow-primary/20" : ""}`}
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={`button-plan-cta-${index}`}
                    >
                      {plan.cta}
                      {plan.highlighted && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Todos los planes incluyen soporte tecnico, actualizaciones gratuitas y sin contratos de permanencia.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%) 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={logoSinFondo} alt="FoxBot" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" data-testid="text-cta-title">
            Dale a tu negocio el soporte que merece
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Mas de <strong className="text-foreground">100 negocios</strong> ya usan FoxBot para vender mas y atender mejor.
            Empieza gratis hoy.
          </p>
          <a href="/register">
            <Button size="lg" className="text-base px-10 py-6 rounded-xl shadow-xl shadow-primary/20" data-testid="button-cta-register">
              Crear Mi Cuenta Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            Sin tarjeta de credito. Sin compromisos. Cancela cuando quieras.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-6 bg-card/50" data-testid="footer">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src={logoSinFondo} alt="FoxBot" className="w-9 h-9 object-contain" />
                <span className="text-xl font-extrabold">
                  <span className="text-primary">Fox</span><span className="text-accent">Bot</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chatbot con IA para atencion al cliente. 
                Funciona con cualquier plataforma.
              </p>
              <p className="text-xs text-muted-foreground mt-3">Un producto de Web Maker Chile</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Caracteristicas</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Precios</a></li>
                <li><a href="/demo" className="hover:text-foreground transition-colors" data-testid="link-footer-demo">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Integraciones</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-woo">WooCommerce</span></li>
                <li><span data-testid="link-footer-shopify">Shopify</span></li>
                <li><span data-testid="link-footer-wordpress">WordPress</span></li>
                <li><span data-testid="link-footer-api">API Custom</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-privacy">Privacidad</span></li>
                <li><span data-testid="link-footer-terms">Terminos de Uso</span></li>
                <li><span data-testid="link-footer-contact">Contacto</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} FoxBot by Web Maker Chile. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
