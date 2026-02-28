import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Bot,
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
} from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const features = [
  {
    icon: Bot,
    title: "Respuestas con IA",
    description: "Chatbot inteligente que responde preguntas frecuentes y guia a tus clientes automaticamente.",
  },
  {
    icon: ShoppingCart,
    title: "Catalogo de Productos",
    description: "Integra tu tienda WooCommerce y permite a los clientes explorar productos desde el chat.",
  },
  {
    icon: BookOpen,
    title: "Base de Conocimiento",
    description: "Entrena tu bot con documentos, FAQs y politicas para respuestas precisas y contextuales.",
  },
  {
    icon: Globe,
    title: "Multi-canal",
    description: "Un solo widget que funciona en tu sitio web, tienda online y cualquier plataforma.",
  },
  {
    icon: BarChart3,
    title: "Analiticas en Tiempo Real",
    description: "Monitorea sesiones, satisfaccion del cliente y rendimiento del bot desde tu dashboard.",
  },
  {
    icon: Shield,
    title: "Filtro de Contenido",
    description: "Proteccion automatica contra lenguaje inapropiado y spam en las conversaciones.",
  },
];

const pricingPlans = [
  {
    name: "Gratis",
    price: "$0",
    period: "/mes",
    description: "Perfecto para probar y proyectos pequenos",
    features: [
      "100 mensajes/mes",
      "1 agente",
      "Widget personalizable",
      "Respuestas automaticas basicas",
      "Soporte por email",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mes",
    description: "Para negocios en crecimiento que necesitan mas",
    features: [
      "5,000 mensajes/mes",
      "5 agentes",
      "IA avanzada con GPT",
      "Integracion WooCommerce",
      "Base de conocimiento",
      "Analiticas completas",
      "Soporte prioritario",
    ],
    cta: "Comenzar con Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Soluciones a medida para grandes empresas",
    features: [
      "Mensajes ilimitados",
      "Agentes ilimitados",
      "IA personalizada",
      "API dedicada",
      "SLA garantizado",
      "Onboarding personalizado",
      "Soporte 24/7",
      "Multi-idioma",
    ],
    cta: "Contactar Ventas",
    highlighted: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto" data-testid="landing-page">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" data-testid="nav-bar">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <img src={logoSinFondo} alt="Web Maker Chile" className="w-10 h-10 object-contain" data-testid="img-nav-logo" />
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              <span className="text-primary">FoxBot</span>
            </span>
          </a>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/login">
              <Button variant="ghost" data-testid="link-login">Iniciar Sesion</Button>
            </a>
            <a href="/register">
              <Button data-testid="link-register">Registrarse</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative py-24 px-6" data-testid="section-hero">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <img src={logoSinFondo} alt="FoxBot" className="w-24 h-24 mx-auto mb-6 object-contain" data-testid="img-hero-logo" />
          <Badge variant="secondary" className="mb-6" data-testid="badge-hero">
            <Zap className="w-3 h-3 mr-1" />
            Potenciado por Inteligencia Artificial
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
            Soporte al cliente
            <br />
            <span className="text-primary">inteligente y automatico</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10" data-testid="text-hero-description">
            Transforma la atencion al cliente de tu negocio con un chatbot de IA que responde 24/7,
            integra tu catalogo de productos y aprende de tu base de conocimiento.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/register">
              <Button size="lg" data-testid="button-hero-register">
                Comenzar Gratis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg" data-testid="button-hero-features">
                Ver Caracteristicas
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-primary" />
              Sin tarjeta de credito
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              Configuracion en 5 min
            </span>
            <span className="flex items-center gap-1">
              <Headphones className="w-4 h-4 text-primary" />
              Soporte incluido
            </span>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-card" data-testid="section-features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-features-title">
              Todo lo que necesitas para atender mejor
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-features-description">
              Herramientas poderosas para automatizar, personalizar y escalar tu soporte al cliente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" data-testid="section-how-it-works">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-how-title">
            Implementa en 3 pasos
          </h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Desde el registro hasta el chat en vivo en minutos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Registrate", desc: "Crea tu cuenta gratuita y configura tu empresa." },
              { step: "2", title: "Personaliza", desc: "Ajusta colores, mensajes y entrena tu base de conocimiento." },
              { step: "3", title: "Integra", desc: "Copia el codigo embed y pegalo en tu sitio web." },
            ].map((item, index) => (
              <div key={item.step} className="flex flex-col items-center gap-4" data-testid={`step-${index}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6 bg-card" data-testid="section-pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-pricing-title">
              Planes para cada negocio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-pricing-description">
              Comienza gratis y escala a medida que crece tu negocio.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, index) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? "border-primary border-2 relative" : ""}
                data-testid={`card-pricing-${index}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge data-testid="badge-popular">Mas Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl" data-testid={`text-plan-name-${index}`}>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/register" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={`button-plan-cta-${index}`}
                    >
                      {plan.cta}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" data-testid="section-cta">
        <div className="max-w-3xl mx-auto text-center">
          <MessageSquare className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-cta-title">
            Listo para transformar tu atencion al cliente?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Unete a cientos de negocios que ya usan nuestro chatbot de IA para atender mejor y mas rapido.
          </p>
          <a href="/register">
            <Button size="lg" data-testid="button-cta-register">
              Crear Cuenta Gratis
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src={logoSinFondo} alt="Web Maker Chile" className="w-8 h-8 object-contain" />
                <span className="text-lg font-bold">
                  <span className="text-primary">Fox</span>Bot
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Soporte al cliente potenciado por inteligencia artificial.
                <br />
                Un producto de Web Maker Chile.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover-elevate rounded-md px-1 py-0.5" data-testid="link-footer-features">Caracteristicas</a></li>
                <li><a href="#pricing" className="hover-elevate rounded-md px-1 py-0.5" data-testid="link-footer-pricing">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-about">Acerca de</span></li>
                <li><span data-testid="link-footer-contact">Contacto</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span data-testid="link-footer-privacy">Privacidad</span></li>
                <li><span data-testid="link-footer-terms">Terminos</span></li>
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
