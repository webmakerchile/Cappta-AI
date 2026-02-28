import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  ArrowRight,
  Bot,
  Loader2,
  Smartphone,
  UtensilsCrossed,
  Shirt,
  HeartPulse,
  Home,
  MessageSquare,
  Search,
  GraduationCap,
  Car,
  Dumbbell,
  PawPrint,
  Plane,
  Wrench,
  Scale,
  Camera,
  Flower2,
  Music,
  Scissors,
  BookOpen,
  Baby,
  Hammer,
  Briefcase,
  Pizza,
  Wine,
  ShoppingCart,
  Gem,
  Gamepad2,
  Bike,
  Palette,
} from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DemoContext {
  id: string;
  name: string;
  business: string;
  description: string;
  icon: typeof Smartphone;
  color: string;
  colorAccent: string;
  category: string;
  suggestions: string[];
}

const DEMO_CONTEXTS: DemoContext[] = [
  {
    id: "tech",
    name: "Tienda de Tecnologia",
    business: "TechStore Chile",
    description: "Smartphones, laptops, accesorios y gadgets",
    icon: Smartphone,
    color: "#0ea5e9",
    colorAccent: "#38bdf8",
    category: "Retail",
    suggestions: ["Que smartphones tienen?", "Tienen el iPhone 15 Pro?", "Busco un notebook gamer", "Precios de audifonos"],
  },
  {
    id: "restaurant",
    name: "Restaurante",
    business: "Sabor Criollo",
    description: "Comida chilena, menu del dia, delivery y reservas",
    icon: UtensilsCrossed,
    color: "#ef4444",
    colorAccent: "#f87171",
    category: "Gastronomia",
    suggestions: ["Cual es el menu del dia?", "Tienen delivery?", "Quiero pedir empanadas", "Hacen reservas para grupos?"],
  },
  {
    id: "clothing",
    name: "Tienda de Ropa",
    business: "Moda Urbana",
    description: "Ropa, calzado, accesorios y tendencias",
    icon: Shirt,
    color: "#a855f7",
    colorAccent: "#c084fc",
    category: "Retail",
    suggestions: ["Que zapatillas tienen?", "Busco jeans talla 32", "Tienen descuentos?", "Politica de cambios?"],
  },
  {
    id: "health",
    name: "Clinica Dental",
    business: "VidaSana",
    description: "Tratamientos dentales, blanqueamiento y ortodoncia",
    icon: HeartPulse,
    color: "#06b6d4",
    colorAccent: "#22d3ee",
    category: "Salud",
    suggestions: ["Cuanto cuesta un blanqueamiento?", "Quiero agendar una hora", "Tienen ortodoncia invisible?", "La primera consulta es gratis?"],
  },
  {
    id: "realestate",
    name: "Corredora de Propiedades",
    business: "Hogar Propiedades",
    description: "Departamentos, casas, arriendo y venta",
    icon: Home,
    color: "#f59e0b",
    colorAccent: "#fbbf24",
    category: "Servicios",
    suggestions: ["Busco depto en Providencia", "Tienen casas en arriendo?", "Rango de precios en Las Condes?", "Puedo agendar una visita?"],
  },
  {
    id: "education",
    name: "Centro de Estudios",
    business: "AcademiaTop",
    description: "Cursos, talleres, preparacion PSU y clases particulares",
    icon: GraduationCap,
    color: "#8b5cf6",
    colorAccent: "#a78bfa",
    category: "Educacion",
    suggestions: ["Que cursos tienen?", "Cuanto cuesta la preparacion PSU?", "Tienen clases de ingles?", "Horarios disponibles?"],
  },
  {
    id: "automotive",
    name: "Automotora",
    business: "AutoChile",
    description: "Venta de autos nuevos y usados, financiamiento",
    icon: Car,
    color: "#64748b",
    colorAccent: "#94a3b8",
    category: "Automotriz",
    suggestions: ["Que autos tienen?", "Busco un SUV familiar", "Ofrecen financiamiento?", "Puedo agendar una prueba de manejo?"],
  },
  {
    id: "gym",
    name: "Gimnasio",
    business: "FitZone",
    description: "Planes de entrenamiento, clases grupales y nutricion",
    icon: Dumbbell,
    color: "#f97316",
    colorAccent: "#fb923c",
    category: "Deporte",
    suggestions: ["Cuales son los planes?", "Tienen clases de crossfit?", "Horarios de apertura?", "Ofrecen nutricionista?"],
  },
  {
    id: "veterinary",
    name: "Veterinaria",
    business: "PetCare",
    description: "Consultas, vacunas, cirugia y peluqueria canina",
    icon: PawPrint,
    color: "#84cc16",
    colorAccent: "#a3e635",
    category: "Mascotas",
    suggestions: ["Cuanto cuesta una consulta?", "Necesito vacunar a mi perro", "Tienen peluqueria canina?", "Atienden emergencias?"],
  },
  {
    id: "travel",
    name: "Agencia de Viajes",
    business: "ViajaChile",
    description: "Paquetes turisticos, vuelos, hoteles y excursiones",
    icon: Plane,
    color: "#0891b2",
    colorAccent: "#22d3ee",
    category: "Turismo",
    suggestions: ["Paquetes a Cancun?", "Busco vuelos baratos a Europa", "Tienen tours en Patagonia?", "All inclusive en Caribe?"],
  },
  {
    id: "mechanic",
    name: "Taller Mecanico",
    business: "MasterMotors",
    description: "Mantencion, reparacion, scanner y alineamiento",
    icon: Wrench,
    color: "#78716c",
    colorAccent: "#a8a29e",
    category: "Automotriz",
    suggestions: ["Cuanto cuesta un cambio de aceite?", "Necesito alineacion y balanceo", "Hacen scanner automotriz?", "Tienen servicio de grua?"],
  },
  {
    id: "legal",
    name: "Estudio Juridico",
    business: "LegalPro",
    description: "Asesoria legal, contratos, laboral y familia",
    icon: Scale,
    color: "#1e293b",
    colorAccent: "#475569",
    category: "Servicios",
    suggestions: ["Necesito un abogado laboral", "Cuanto cobra la consulta?", "Ayudan con divorcios?", "Pueden revisar un contrato?"],
  },
  {
    id: "photography",
    name: "Estudio Fotografico",
    business: "CapturaMomentos",
    description: "Sesiones, eventos, book profesional y video",
    icon: Camera,
    color: "#be185d",
    colorAccent: "#ec4899",
    category: "Creativos",
    suggestions: ["Cuanto cuesta una sesion?", "Cubren matrimonios?", "Hacen fotos para CV?", "Tienen estudio propio?"],
  },
  {
    id: "florist",
    name: "Floreria",
    business: "FloraViva",
    description: "Arreglos florales, ramos, eventos y delivery",
    icon: Flower2,
    color: "#e11d48",
    colorAccent: "#fb7185",
    category: "Retail",
    suggestions: ["Ramos para cumpleanos?", "Hacen arreglos para eventos?", "Tienen delivery hoy?", "Flores para funeral?"],
  },
  {
    id: "music",
    name: "Escuela de Musica",
    business: "SoundAcademy",
    description: "Clases de guitarra, piano, canto y bateria",
    icon: Music,
    color: "#7c3aed",
    colorAccent: "#a78bfa",
    category: "Educacion",
    suggestions: ["Cuanto cuestan las clases de guitarra?", "Tienen clases para ninos?", "Ofrecen clases de canto?", "Horarios disponibles?"],
  },
  {
    id: "barbershop",
    name: "Barberia",
    business: "BarberKing",
    description: "Cortes, barba, tratamientos capilares y afeitado",
    icon: Scissors,
    color: "#b45309",
    colorAccent: "#d97706",
    category: "Belleza",
    suggestions: ["Cuanto cuesta un corte?", "Hacen tratamientos de barba?", "Puedo agendar hora?", "Trabajan los domingos?"],
  },
  {
    id: "bookstore",
    name: "Libreria",
    business: "LibroMundo",
    description: "Libros, comics, papeleria y regalos literarios",
    icon: BookOpen,
    color: "#0f766e",
    colorAccent: "#14b8a6",
    category: "Retail",
    suggestions: ["Busco libros de fantasia", "Tienen el ultimo de Colleen Hoover?", "Hacen envios a regiones?", "Libros para ninos de 8 anos?"],
  },
  {
    id: "daycare",
    name: "Jardin Infantil",
    business: "PequeExplora",
    description: "Cuidado infantil, estimulacion temprana y talleres",
    icon: Baby,
    color: "#ec4899",
    colorAccent: "#f472b6",
    category: "Educacion",
    suggestions: ["Desde que edad reciben ninos?", "Cual es la mensualidad?", "Tienen estimulacion temprana?", "Horario de funcionamiento?"],
  },
  {
    id: "construction",
    name: "Constructora",
    business: "ConstruMax",
    description: "Remodelaciones, ampliaciones y proyectos inmobiliarios",
    icon: Hammer,
    color: "#ea580c",
    colorAccent: "#f97316",
    category: "Servicios",
    suggestions: ["Cuanto cuesta remodelar un bano?", "Hacen ampliaciones?", "Trabajan con permisos municipales?", "Tienen portfolio?"],
  },
  {
    id: "coworking",
    name: "Coworking",
    business: "WorkHub",
    description: "Oficinas compartidas, salas de reunion y escritorios",
    icon: Briefcase,
    color: "#2563eb",
    colorAccent: "#3b82f6",
    category: "Servicios",
    suggestions: ["Cuanto cuesta un escritorio?", "Tienen salas de reunion?", "Planes mensuales?", "Hay wifi incluido?"],
  },
  {
    id: "pizza",
    name: "Pizzeria",
    business: "PizzaMaster",
    description: "Pizzas artesanales, delivery y pedidos para llevar",
    icon: Pizza,
    color: "#dc2626",
    colorAccent: "#ef4444",
    category: "Gastronomia",
    suggestions: ["Cual es la pizza mas vendida?", "Tienen delivery?", "Hacen pizzas sin gluten?", "Combo familiar?"],
  },
  {
    id: "winery",
    name: "Vina / Enoteca",
    business: "VinoSelecto",
    description: "Vinos chilenos premium, degustaciones y tours",
    icon: Wine,
    color: "#7f1d1d",
    colorAccent: "#991b1b",
    category: "Gastronomia",
    suggestions: ["Que vinos recomiendan?", "Hacen degustaciones?", "Tienen Carmenere reserva?", "Envian a domicilio?"],
  },
  {
    id: "supermarket",
    name: "Minimarket",
    business: "FrescoMarket",
    description: "Abarrotes, frutas, verduras y productos basicos",
    icon: ShoppingCart,
    color: "#16a34a",
    colorAccent: "#22c55e",
    category: "Retail",
    suggestions: ["Hacen delivery?", "Tienen ofertas hoy?", "Venden frutas organicas?", "Hasta que hora estan abiertos?"],
  },
  {
    id: "jewelry",
    name: "Joyeria",
    business: "BrilloEterno",
    description: "Anillos, collares, relojes y joyeria personalizada",
    icon: Gem,
    color: "#ca8a04",
    colorAccent: "#eab308",
    category: "Retail",
    suggestions: ["Busco un anillo de compromiso", "Hacen grabados personalizados?", "Tienen relojes?", "Precios de cadenas de oro?"],
  },
  {
    id: "gaming",
    name: "Tienda Gamer",
    business: "GameZone",
    description: "Consolas, videojuegos, accesorios y PC gaming",
    icon: Gamepad2,
    color: "#7c3aed",
    colorAccent: "#8b5cf6",
    category: "Entretenimiento",
    suggestions: ["Tienen PS5 en stock?", "Busco un teclado mecanico", "Juegos de Nintendo Switch?", "Arman PCs a medida?"],
  },
  {
    id: "bikeshop",
    name: "Tienda de Bicicletas",
    business: "PedalChile",
    description: "Bicicletas, repuestos, servicio tecnico y arriendo",
    icon: Bike,
    color: "#059669",
    colorAccent: "#10b981",
    category: "Deporte",
    suggestions: ["Tienen bicicletas de ruta?", "Cuanto cuesta una mantencion?", "Arriendan bicicletas?", "Repuestos Shimano?"],
  },
  {
    id: "art",
    name: "Galeria de Arte",
    business: "ArteVivo",
    description: "Exposiciones, obras originales, talleres y enmarcado",
    icon: Palette,
    color: "#c026d3",
    colorAccent: "#d946ef",
    category: "Creativos",
    suggestions: ["Que exposiciones tienen?", "Venden cuadros originales?", "Ofrecen talleres de pintura?", "Hacen enmarcado?"],
  },
];

const CATEGORIES = [...new Set(DEMO_CONTEXTS.map((c) => c.category))].sort();

const MAX_DEMO_MESSAGES = 30;

function ContextSelector({ onSelect }: { onSelect: (ctx: DemoContext) => void }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = DEMO_CONTEXTS;
    if (activeCategory) {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.business.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" data-testid="demo-context-page">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3 animate-dash-fade-in">
            <a href="/" className="flex items-center gap-2 text-white/30 hover:text-primary transition-colors" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <img src={logoSinFondo} alt="FoxBot" className="w-8 h-8 object-contain" />
            <span className="text-lg font-extrabold">
              <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold tracking-wider">DEMO</span>
          </div>
          <a href="/register">
            <Button size="sm" className="rounded-xl font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group" data-testid="button-context-register">
              <span className="absolute inset-0 animate-shimmer-line opacity-0 group-hover:opacity-20 transition-opacity" />
              Registrarse
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          </a>
        </div>
      </nav>

      <div className="flex-1 px-4 py-10 relative overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full animate-orb-drift pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)" }} />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] rounded-full animate-orb-drift pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.03), transparent 60%)", animationDelay: "-12s" }} />

        <div className="max-w-5xl w-full mx-auto relative">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-5 animate-dash-fade-up">
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center animate-float">
                <img src={logoSinFondo} alt="FoxBot" className="w-11 h-11 object-contain" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center animate-icon-pop dash-stagger-2" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%), hsl(150, 60%, 28%))" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-3 animate-dash-fade-up dash-stagger-1" data-testid="text-context-title">
              Elige un tipo de negocio para probar
            </h1>
            <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto leading-relaxed animate-dash-fade-up dash-stagger-2">
              FoxBot se adapta a cualquier negocio. Elige un escenario y comprueba como el chatbot se ajusta automaticamente.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 animate-dash-fade-up dash-stagger-3">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">
                {MAX_DEMO_MESSAGES} mensajes de prueba gratuitos
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto mb-6 animate-dash-scale-in dash-stagger-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-primary transition-colors duration-300" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoria, negocio o rubro..."
                className="h-12 pl-11 rounded-2xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_24px_rgba(16,185,129,0.08)]"
                data-testid="input-search-context"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  data-testid="button-clear-search"
                >
                  <span className="text-xs">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-dash-fade-up dash-stagger-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                !activeCategory
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                  : "bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"
              }`}
              data-testid="button-category-all"
            >
              Todas ({DEMO_CONTEXTS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = DEMO_CONTEXTS.filter((c) => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                      : "bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"
                  }`}
                  data-testid={`button-category-${cat.toLowerCase()}`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 animate-dash-fade-in">
              <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">No se encontraron negocios con "{search}"</p>
              <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="text-primary text-sm font-medium mt-2 hover:text-primary/80 transition-colors" data-testid="button-clear-filters">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ctx, i) => (
                <div
                  key={ctx.id}
                  className={`rounded-2xl glass-card glass-card-hover p-5 cursor-pointer group transition-all duration-300 animate-dash-fade-up relative overflow-hidden`}
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                  onClick={() => onSelect(ctx)}
                  data-testid={`card-context-${ctx.id}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${ctx.color}60, transparent)` }} />
                  <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" style={{ background: `radial-gradient(circle, ${ctx.color}08, transparent 60%)` }} />

                  <div className="flex items-start gap-3 relative">
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${ctx.color}15` }}
                    >
                      <ctx.icon className="w-5 h-5 transition-all duration-300" style={{ color: ctx.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-sm group-hover:text-white transition-colors duration-300">{ctx.name}</h3>
                      </div>
                      <p className="text-[11px] font-semibold mb-1 transition-colors duration-300" style={{ color: ctx.color }}>{ctx.business}</p>
                      <p className="text-xs text-white/30 leading-relaxed group-hover:text-white/45 transition-colors duration-300">{ctx.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all duration-300 group-hover:translate-x-0.5 shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/25 font-medium">{ctx.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-white/20 mt-10 animate-dash-fade-in max-w-lg mx-auto">
            Esto es solo una muestra. Con FoxBot puedes crear el chatbot perfecto para tu negocio, con tu propia base de conocimiento y catalogo real.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [selectedContext, setSelectedContext] = useState<DemoContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Demo - FoxBot by Web Maker Chile";
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedContext) {
      inputRef.current?.focus();
    }
  }, [selectedContext]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading || !selectedContext) return;

    if (messageCount >= MAX_DEMO_MESSAGES) {
      setError("Has usado tus 30 mensajes de prueba. Registrate gratis para seguir usando FoxBot sin limites.");
      return;
    }

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: selectedContext.id }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessageCount(MAX_DEMO_MESSAGES);
        setError(data.message || "Limite de mensajes alcanzado.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Error al enviar mensaje");
        setIsLoading(false);
        return;
      }

      setMessageCount((c) => c + 1);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function resetChat() {
    setMessages([]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }

  function changeContext() {
    setSelectedContext(null);
    setMessages([]);
    setInput("");
    setError(null);
  }

  if (!selectedContext) {
    return <ContextSelector onSelect={setSelectedContext} />;
  }

  const ctx = selectedContext;
  const remaining = MAX_DEMO_MESSAGES - messageCount;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden" data-testid="demo-page">
      <div className="absolute top-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full animate-orb-drift pointer-events-none" style={{ background: `radial-gradient(circle, ${ctx.color}06, transparent 60%)` }} />
      <div className="absolute bottom-[-150px] left-[-100px] w-[350px] h-[350px] rounded-full animate-orb-drift pointer-events-none" style={{ background: `radial-gradient(circle, ${ctx.color}04, transparent 60%)`, animationDelay: "-10s" }} />

      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl animate-dash-fade-in" data-testid="demo-nav">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={changeContext} className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors duration-300" data-testid="button-change-context">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-xl transition-transform duration-300 hover:scale-110" style={{ backgroundColor: `${ctx.color}15` }}>
              <ctx.icon className="w-4 h-4" style={{ color: ctx.color }} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight" style={{ color: ctx.color }}>{ctx.business}</span>
              <span className="text-[10px] text-white/25 leading-tight">Powered by FoxBot</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30 font-medium" data-testid="badge-remaining">
              {remaining} restantes
            </span>
            <Button variant="ghost" size="sm" onClick={resetChat} className="text-white/30 hover:text-white/60 rounded-xl transition-all duration-300" data-testid="button-reset-chat">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Nueva
            </Button>
            <a href="/register" className="hidden sm:block">
              <Button size="sm" className="rounded-xl font-bold" data-testid="button-demo-register">
                Registrarse
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full relative">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" data-testid="demo-messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 animate-dash-scale-in animate-float"
                style={{ backgroundColor: `${ctx.color}10`, animationDuration: "6s" }}
              >
                <ctx.icon className="w-8 h-8" style={{ color: ctx.color }} />
              </div>
              <h2 className="text-xl font-bold mb-2 animate-dash-fade-up dash-stagger-1" data-testid="text-demo-title">
                Chatea con el asistente de {ctx.business}
              </h2>
              <p className="text-white/35 text-sm mb-6 max-w-md leading-relaxed animate-dash-fade-up dash-stagger-2">
                Este es un ejemplo de como FoxBot atiende clientes en una {ctx.name.toLowerCase()}.
                Prueba preguntando lo que quieras.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {ctx.suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(s)}
                    className={`rounded-xl border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 hover:scale-[1.03] animate-dash-fade-up`}
                    style={{ animationDelay: `${0.15 + i * 0.06}s` }}
                    data-testid={`button-suggestion-${i}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-dash-fade-up`}
              data-testid={`message-${msg.role}-${i}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-300 ${
                  msg.role === "user"
                    ? "text-white rounded-br-md shadow-lg"
                    : "glass-card rounded-bl-md"
                }`}
                style={msg.role === "user" ? { backgroundColor: ctx.color, boxShadow: `0 4px 20px ${ctx.color}25` } : undefined}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5" style={{ color: ctx.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: ctx.color }}>{ctx.business}</span>
                  </div>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-dash-fade-up">
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: ctx.color }} />
                  <span className="text-sm text-white/40">Escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center animate-dash-scale-in">
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl" data-testid="text-demo-error">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3 bg-background/60 backdrop-blur-xl">
          {remaining <= 0 ? (
            <div className="text-center py-3 animate-dash-fade-up">
              <p className="text-sm text-white/35 mb-3">
                Has usado tus {MAX_DEMO_MESSAGES} mensajes de prueba
              </p>
              <a href="/register">
                <Button className="rounded-xl font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-limit-register">
                  Registrate Gratis para Continuar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex items-center gap-2" data-testid="form-demo-chat">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Pregunta algo a ${ctx.business}...`}
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all duration-300 disabled:opacity-50 placeholder:text-white/20 focus:shadow-[0_0_16px_rgba(16,185,129,0.06)]"
                  data-testid="input-demo-message"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 rounded-xl h-11 w-11 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: ctx.color }}
                  data-testid="button-send-demo"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] text-white/20">
                  {remaining} de {MAX_DEMO_MESSAGES} mensajes restantes
                </span>
                <a href="/register" className="text-[11px] text-primary hover:text-primary/80 transition-colors">
                  Registrate gratis para mensajes ilimitados
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
