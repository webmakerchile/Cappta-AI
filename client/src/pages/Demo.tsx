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
  Headphones,
  X,
  ImagePlus,
  FileText,
  Download,
  UserRound,
  Tag,
  CircleDot,
  Bell,
  ShoppingBag,
  Star,
  ChevronDown,
  Mail,
  Shield,
  Eye,
  LogOut,
} from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
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

const EXEC_PROFILES = [
  { name: "Carolina M.", color: "#10b981" },
  { name: "Diego R.", color: "#3b82f6" },
  { name: "Valentina S.", color: "#f59e0b" },
  { name: "Andrés P.", color: "#ef4444" },
  { name: "Camila L.", color: "#8b5cf6" },
];

function getExecProfile(ctxId: string) {
  let hash = 0;
  for (let i = 0; i < ctxId.length; i++) hash = ((hash << 5) - hash) + ctxId.charCodeAt(i);
  return EXEC_PROFILES[Math.abs(hash) % EXEC_PROFILES.length];
}

interface DemoProduct {
  id: number;
  name: string;
  price: string;
  badge?: string;
}

interface DemoFile {
  name: string;
  size: string;
  type: string;
}

interface DemoSessionMsg {
  sender: "user" | "bot" | "executive" | "system";
  content: string;
  file?: DemoFile;
  quickReplies?: string[];
}

interface DemoSession {
  id: string;
  userName: string;
  userEmail: string;
  initial: string;
  color: string;
  status: "active" | "closed";
  contactRequested: boolean;
  unread: number;
  tags: string[];
  problemType: string;
  productName?: string;
  messages: DemoSessionMsg[];
}

const DEMO_PRODUCTS: Record<string, DemoProduct[]> = {
  tech: [{ id: 1, name: "iPhone 15 Pro 256GB", price: "$1.099.990", badge: "Nuevo" }, { id: 2, name: "MacBook Air M2", price: "$899.990", badge: "Popular" }, { id: 3, name: "AirPods Pro 2", price: "$249.990" }],
  restaurant: [{ id: 1, name: "Empanadas de Pino (6 un)", price: "$8.990" }, { id: 2, name: "Pastel de Choclo Familiar", price: "$12.990", badge: "Popular" }, { id: 3, name: "Cazuela de Ave", price: "$8.490" }],
  clothing: [{ id: 1, name: "Zapatillas Nike Air Max", price: "$69.990", badge: "Nuevo" }, { id: 2, name: "Jeans Slim Fit Premium", price: "$24.990" }, { id: 3, name: "Polera Oversize Urban", price: "$12.990" }],
  health: [{ id: 1, name: "Blanqueamiento Dental LED", price: "$89.990", badge: "Popular" }, { id: 2, name: "Limpieza Profesional", price: "$35.000" }, { id: 3, name: "Ortodoncia Invisible", price: "$450.000" }],
  realestate: [{ id: 1, name: "Depto 2D+2B Providencia", price: "4.200 UF", badge: "Nuevo" }, { id: 2, name: "Casa 4D La Florida", price: "5.800 UF" }, { id: 3, name: "Arriendo Depto Ñuñoa", price: "$650.000/mes" }],
  education: [{ id: 1, name: "Preparacion PAES Completa", price: "$159.990/sem" }, { id: 2, name: "Ingles Intensivo B2", price: "$89.990/mes", badge: "Popular" }, { id: 3, name: "Taller Matematicas", price: "$49.990/mes" }],
  automotive: [{ id: 1, name: "Toyota RAV4 2024", price: "$18.990.000", badge: "Nuevo" }, { id: 2, name: "Hyundai Tucson 2023", price: "$15.490.000" }, { id: 3, name: "Kia Sportage Semi-Nuevo", price: "$12.990.000" }],
  gym: [{ id: 1, name: "Plan Premium + Clases", price: "$39.990/mes", badge: "Popular" }, { id: 2, name: "Plan Básico", price: "$24.990/mes" }, { id: 3, name: "Plan VIP + Nutricionista", price: "$59.990/mes" }],
  veterinary: [{ id: 1, name: "Consulta General", price: "$18.000" }, { id: 2, name: "Vacunacion Completa", price: "$25.000" }, { id: 3, name: "Esterilizacion", price: "$89.990", badge: "Popular" }],
  travel: [{ id: 1, name: "Cancun All Inclusive 7 días", price: "$899.990", badge: "Oferta" }, { id: 2, name: "Patagonia 5 días", price: "$649.990" }, { id: 3, name: "Europa 15 días", price: "$2.490.000" }],
  mechanic: [{ id: 1, name: "Cambio de Aceite Sintetico", price: "$45.000" }, { id: 2, name: "Alineacion + Balanceo", price: "$18.000" }, { id: 3, name: "Scanner Automotriz", price: "$15.000", badge: "Popular" }],
  legal: [{ id: 1, name: "Consulta Legal Inicial", price: "$30.000" }, { id: 2, name: "Redacción de Contrato", price: "$120.000" }, { id: 3, name: "Defensa Laboral", price: "Desde $350.000" }],
  photography: [{ id: 1, name: "Sesión Individual", price: "$89.990" }, { id: 2, name: "Cobertura Matrimonio", price: "$490.000", badge: "Premium" }, { id: 3, name: "Book Profesional", price: "$149.990" }],
  florist: [{ id: 1, name: "Ramo Rosas Premium", price: "$39.990", badge: "Popular" }, { id: 2, name: "Arreglo Cumpleaños", price: "$25.990" }, { id: 3, name: "Centro de Mesa Evento", price: "$89.990" }],
  music: [{ id: 1, name: "Clases de Guitarra (4/mes)", price: "$35.990" }, { id: 2, name: "Clases de Piano (4/mes)", price: "$39.990", badge: "Popular" }, { id: 3, name: "Clases de Canto (4/mes)", price: "$45.000" }],
  barbershop: [{ id: 1, name: "Corte Fade/Degradado", price: "$10.990", badge: "Popular" }, { id: 2, name: "Combo Corte + Barba", price: "$14.990" }, { id: 3, name: "Tratamiento Capilar", price: "$19.990" }],
  bookstore: [{ id: 1, name: "Bestseller del Mes", price: "$14.990" }, { id: 2, name: "Box Set Harry Potter", price: "$49.990", badge: "Popular" }, { id: 3, name: "Manga One Piece Vol 1-5", price: "$34.990" }],
  daycare: [{ id: 1, name: "Sala Cuna (mensual)", price: "$189.990" }, { id: 2, name: "Medio Menor (mensual)", price: "$219.990" }, { id: 3, name: "Pre-Kinder (mensual)", price: "$289.990", badge: "Popular" }],
  construction: [{ id: 1, name: "Remodelacion Baño Completa", price: "$1.200.000" }, { id: 2, name: "Remodelacion Cocina", price: "$2.500.000", badge: "Popular" }, { id: 3, name: "Ampliacion 20m²", price: "$4.500.000" }],
  coworking: [{ id: 1, name: "Hot Desk Mensual", price: "$89.990" }, { id: 2, name: "Escritorio Fijo", price: "$149.990", badge: "Popular" }, { id: 3, name: "Oficina Privada (4 personas)", price: "$399.990" }],
  pizza: [{ id: 1, name: "Pizza Pepperoni Grande", price: "$8.490" }, { id: 2, name: "Pizza Especial de la Casa", price: "$10.990", badge: "Popular" }, { id: 3, name: "Combo Familiar (2 pizzas + bebida)", price: "$18.990" }],
  winery: [{ id: 1, name: "Carmenere Gran Reserva", price: "$12.990", badge: "Popular" }, { id: 2, name: "Cabernet Premium", price: "$24.990" }, { id: 3, name: "Degustacion 5 Vinos", price: "$15.000" }],
  supermarket: [{ id: 1, name: "Canasta Frutas Organicas", price: "$8.990" }, { id: 2, name: "Pack Asado Completo", price: "$24.990", badge: "Popular" }, { id: 3, name: "Caja Verduras Semanal", price: "$12.990" }],
  jewelry: [{ id: 1, name: "Anillo Compromiso Oro 18k", price: "$199.990", badge: "Premium" }, { id: 2, name: "Cadena Plata 925", price: "$49.990" }, { id: 3, name: "Reloj Clasico Hombre", price: "$89.990" }],
  gaming: [{ id: 1, name: "PS5 Slim Digital", price: "$449.990", badge: "Nuevo" }, { id: 2, name: "Teclado Mecanico RGB", price: "$39.990" }, { id: 3, name: "Mouse Gaming Pro", price: "$24.990" }],
  bikeshop: [{ id: 1, name: "Bicicleta MTB 29er", price: "$349.990", badge: "Popular" }, { id: 2, name: "Bicicleta Urbana", price: "$179.990" }, { id: 3, name: "Mantencion Completa", price: "$35.000" }],
  art: [{ id: 1, name: "Cuadro Oleo Original 60x80", price: "$189.990" }, { id: 2, name: "Taller Pintura (mensual)", price: "$49.990", badge: "Popular" }, { id: 3, name: "Enmarcado Profesional", price: "$25.000" }],
};

const DEMO_FILES: Record<string, DemoFile> = {
  tech: { name: "Ficha_Tecnica_iPhone15Pro.pdf", size: "2.4 MB", type: "PDF" },
  restaurant: { name: "Menu_Completo_2024.pdf", size: "1.8 MB", type: "PDF" },
  clothing: { name: "Guia_Tallas_ModaUrbana.pdf", size: "980 KB", type: "PDF" },
  health: { name: "Plan_Tratamiento_Dental.pdf", size: "1.2 MB", type: "PDF" },
  realestate: { name: "Ficha_Propiedad_Providencia.pdf", size: "3.1 MB", type: "PDF" },
  education: { name: "Programa_Academico_2024.pdf", size: "1.5 MB", type: "PDF" },
  automotive: { name: "Especificaciones_RAV4_2024.pdf", size: "4.2 MB", type: "PDF" },
  gym: { name: "Plan_Entrenamiento_Personalizado.pdf", size: "890 KB", type: "PDF" },
  veterinary: { name: "Cartilla_Vacunacion_Mascota.pdf", size: "650 KB", type: "PDF" },
  travel: { name: "Itinerario_Cancun_7días.pdf", size: "2.8 MB", type: "PDF" },
  mechanic: { name: "Diagnostico_Vehiculo.pdf", size: "1.1 MB", type: "PDF" },
  legal: { name: "Modelo_Contrato_Tipo.pdf", size: "750 KB", type: "PDF" },
  photography: { name: "Portfolio_Sesiones_2024.pdf", size: "5.2 MB", type: "PDF" },
  florist: { name: "Catalogo_Arreglos_Florales.pdf", size: "3.4 MB", type: "PDF" },
  music: { name: "Programa_Clases_Guitarra.pdf", size: "420 KB", type: "PDF" },
  barbershop: { name: "Catalogo_Estilos_2024.pdf", size: "2.1 MB", type: "PDF" },
  bookstore: { name: "Catalogo_Novedades_Enero.pdf", size: "1.7 MB", type: "PDF" },
  daycare: { name: "Proyecto_Educativo_2024.pdf", size: "1.3 MB", type: "PDF" },
  construction: { name: "Presupuesto_Remodelacion.pdf", size: "980 KB", type: "PDF" },
  coworking: { name: "Planos_Oficinas_Disponibles.pdf", size: "2.6 MB", type: "PDF" },
  pizza: { name: "Menu_PizzaMaster_2024.pdf", size: "1.4 MB", type: "PDF" },
  winery: { name: "Ficha_Tecnica_Carmenere.pdf", size: "890 KB", type: "PDF" },
  supermarket: { name: "Ofertas_Semana.pdf", size: "1.1 MB", type: "PDF" },
  jewelry: { name: "Certificado_Autenticidad_Oro18k.pdf", size: "340 KB", type: "PDF" },
  gaming: { name: "Specs_PS5_Slim.pdf", size: "1.8 MB", type: "PDF" },
  bikeshop: { name: "Guia_Mantencion_Bicicleta.pdf", size: "1.2 MB", type: "PDF" },
  art: { name: "Catalogo_Exposicion_Actual.pdf", size: "4.5 MB", type: "PDF" },
};

function generateDemoSessions(ctx: DemoContext): DemoSession[] {
  const products = DEMO_PRODUCTS[ctx.id] || [];
  const file = DEMO_FILES[ctx.id];
  const p0 = products[0];
  const p1 = products[1];

  return [
    {
      id: "demo-s1",
      userName: "Maria Lopez",
      userEmail: "maria.lopez@gmail.com",
      initial: "M",
      color: "#8b5cf6",
      status: "active",
      contactRequested: false,
      unread: 1,
      tags: ["Consulta"],
      problemType: "Consulta de producto",
      productName: p0?.name,
      messages: [
        { sender: "user", content: `Hola! Me interesa saber sobre ${p0?.name || "sus productos"}` },
        { sender: "bot", content: `Hola Maria! 👋 ${p0?.name} tiene un precio de ${p0?.price}. Es una excelente opción! Te interesa?`, quickReplies: ["Ver detalles", "Ver más opciones", "Contactar ejecutivo"] },
        { sender: "user", content: "¿Tienen stock disponible?" },
        { sender: "bot", content: `¡Sí! Tenemos stock disponible de ${p0?.name} 📦 Envío gratis en compras sobre $50.000. ¿Quieres que te ayude con la compra?`, quickReplies: ["¡Sí, quiero comprarlo", "Ver otros productos"] },
      ],
    },
    {
      id: "demo-s2",
      userName: "Carlos Martinez",
      userEmail: "carlos@empresa.cl",
      initial: "C",
      color: "#f59e0b",
      status: "active",
      contactRequested: true,
      unread: 2,
      tags: ["Venta", "Urgente"],
      problemType: "Quiero comprar un producto",
      productName: p1?.name,
      messages: [
        { sender: "user", content: `Quiero comprar ${p1?.name || "un producto"}` },
        { sender: "bot", content: `¡Excelente elección! 🔥 ${p1?.name} está disponible a ${p1?.price}. ¿Te gustaría proceder con la compra?`, quickReplies: ["¡Sí, comprar ahora", "Más información", "Hablar con ejecutivo"] },
        { sender: "user", content: "Quiero hablar con un ejecutivo por favor" },
        { sender: "system", content: "Cliente solicita ejecutivo" },
        { sender: "system", content: `${getExecProfile(ctx.id).name} ha entrado al chat — El bot IA está pausado` },
        { sender: "executive", content: `¡Hola Carlos! Soy ${getExecProfile(ctx.id).name} de ${ctx.business}. Vi que te interesa ${p1?.name}. Te envío la información completa 📋` },
        { sender: "executive", content: "Aquí tienes toda la información detallada:", file },
      ],
    },
    {
      id: "demo-s3",
      userName: "Ana Perez",
      userEmail: "ana.perez@mail.com",
      initial: "A",
      color: "#10b981",
      status: "closed",
      contactRequested: false,
      unread: 0,
      tags: ["Resuelto"],
      problemType: "Consulta general",
      messages: [
        { sender: "user", content: "Hola, consulta rápida sobre precios" },
        { sender: "bot", content: `¡Con gusto! 😊 Nuestros productos parten desde ${products[2]?.price || "$9.990"}. ¿Qué estás buscando específicamente?` },
        { sender: "user", content: "Perfecto, muchas gracias por la info!" },
        { sender: "bot", content: "De nada! 🙌 Si necesitas algo más, aquí estamos. ¡Que tengas un excelente día!" },
      ],
    },
  ];
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
    suggestions: ["¿Qué smartphones tienen?", "¿Tienen el iPhone 15 Pro?", "Busco un notebook gamer", "Precios de audífonos"],
  },
  {
    id: "restaurant",
    name: "Restaurante",
    business: "Sabor Criollo",
    description: "Comida chilena, menú del día, delivery y reservas",
    icon: UtensilsCrossed,
    color: "#ef4444",
    colorAccent: "#f87171",
    category: "Gastronomia",
    suggestions: ["Cuál es el menú del día?", "¿Tienen delivery?", "Quiero pedir empanadas", "¿Hacen reservas para grupos?"],
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
    suggestions: ["¿Qué zapatillas tienen?", "Busco jeans talla 32", "¿Tienen descuentos?", "Política de cambios?"],
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
    suggestions: ["¿Cuánto cuesta un blanqueamiento?", "Quiero agendar una hora", "¿Tienen ortodoncia invisible?", "¿La primera consulta es gratis?"],
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
    suggestions: ["Busco depto en Providencia", "¿Tienen casas en arriendo?", "¿Rango de precios en Las Condes?", "¿Puedo agendar una visita?"],
  },
  {
    id: "education",
    name: "Centro de Estudios",
    business: "AcademiaTop",
    description: "Cursos, talleres, preparación PSU y clases particulares",
    icon: GraduationCap,
    color: "#8b5cf6",
    colorAccent: "#a78bfa",
    category: "Educacion",
    suggestions: ["¿Qué cursos tienen?", "¿Cuánto cuesta la preparación PSU?", "¿Tienen clases de inglés?", "¿Horarios disponibles?"],
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
    suggestions: ["¿Qué autos tienen?", "Busco un SUV familiar", "¿Ofrecen financiamiento?", "¿Puedo agendar una prueba de manejo?"],
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
    suggestions: ["¿Cuáles son los planes?", "¿Tienen clases de crossfit?", "¿Horarios de apertura?", "¿Ofrecen nutricionista?"],
  },
  {
    id: "veterinary",
    name: "Veterinaria",
    business: "PetCare",
    description: "Consultas, vacunas, cirugia y peluquería canina",
    icon: PawPrint,
    color: "#84cc16",
    colorAccent: "#a3e635",
    category: "Mascotas",
    suggestions: ["¿Cuánto cuesta una consulta?", "Necesito vacunar a mi perro", "¿Tienen peluquería canina?", "¿Atienden emergencias?"],
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
    suggestions: ["¿Paquetes a Cancún?", "Busco vuelos baratos a Europa", "¿Tienen tours en Patagonia?", "All inclusive en Caribe?"],
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
    suggestions: ["¿Cuánto cuesta un cambio de aceite?", "Necesito alineación y balanceo", "¿Hacen scanner automotriz?", "¿Tienen servicio de grúa?"],
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
    suggestions: ["Necesito un abogado laboral", "¿Cuánto cobra la consulta?", "¿Ayudan con divorcios?", "¿Pueden revisar un contrato?"],
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
    suggestions: ["¿Cuánto cuesta una sesión?", "¿Cubren matrimonios?", "¿Hacen fotos para CV?", "¿Tienen estudio propio?"],
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
    suggestions: ["¿Ramos para cumpleaños?", "¿Hacen arreglos para eventos?", "¿Tienen delivery hoy?", "¿Flores para funeral?"],
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
    suggestions: ["¿Cuánto cuestan las clases de guitarra?", "¿Tienen clases para niños?", "¿Ofrecen clases de canto?", "¿Horarios disponibles?"],
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
    suggestions: ["¿Cuánto cuesta un corte?", "¿Hacen tratamientos de barba?", "¿Puedo agendar hora?", "¿Trabajan los domingos?"],
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
    suggestions: ["Busco libros de fantasía", "¿Tienen el último de Colleen Hoover?", "¿Hacen envíos a regiones?", "Libros para niños de 8 años?"],
  },
  {
    id: "daycare",
    name: "Jardin Infantil",
    business: "PequeExplora",
    description: "Cuidado infantil, estimulación temprana y talleres",
    icon: Baby,
    color: "#ec4899",
    colorAccent: "#f472b6",
    category: "Educacion",
    suggestions: ["¿Desde qué edad reciben niños?", "¿Cuál es la mensualidad?", "¿Tienen estimulación temprana?", "¿Horario de funcionamiento?"],
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
    suggestions: ["¿Cuánto cuesta remodelar un baño?", "¿Hacen ampliaciones?", "¿Trabajan con permisos municipales?", "¿Tienen portfolio?"],
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
    suggestions: ["¿Cuánto cuesta un escritorio?", "¿Tienen salas de reunión?", "¿Planes mensuales?", "¿Hay wifi incluido?"],
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
    suggestions: ["¿Cuál es la pizza más vendida?", "¿Tienen delivery?", "¿Hacen pizzas sin gluten?", "¿Combo familiar?"],
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
    suggestions: ["¿Qué vinos recomiendan?", "¿Hacen degustaciones?", "¿Tienen Carménère reserva?", "¿Envían a domicilio?"],
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
    suggestions: ["¿Hacen delivery?", "¿Tienen ofertas hoy?", "¿Venden frutas orgánicas?", "¿Hasta qué hora están abiertos?"],
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
    suggestions: ["Busco un anillo de compromiso", "¿Hacen grabados personalizados?", "¿Tienen relojes?", "¿Precios de cadenas de oro?"],
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
    suggestions: ["¿Tienen PS5 en stock?", "Busco un teclado mecánico", "¿Juegos de Nintendo Switch?", "¿Arman PCs a medida?"],
  },
  {
    id: "bikeshop",
    name: "Tienda de Bicicletas",
    business: "PedalChile",
    description: "Bicicletas, repuestos, servicio técnico y arriendo",
    icon: Bike,
    color: "#059669",
    colorAccent: "#10b981",
    category: "Deporte",
    suggestions: ["¿Tienen bicicletas de ruta?", "¿Cuánto cuesta una mantención?", "¿Arriendan bicicletas?", "¿Repuestos Shimano?"],
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
    suggestions: ["¿Qué exposiciones tienen?", "¿Venden cuadros originales?", "¿Ofrecen talleres de pintura?", "¿Hacen enmarcado?"],
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
              FoxBot se adapta a cualquier negocio. Prueba el modo <strong className="text-white/60">Cliente</strong> y el modo <strong className="text-white/60">Ejecutivo</strong>.
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 animate-dash-fade-up dash-stagger-3">
              <span className="flex items-center gap-1.5 text-xs text-white/35"><MessageSquare className="w-3.5 h-3.5 text-accent" /> Chat en vivo con IA</span>
              <span className="flex items-center gap-1.5 text-xs text-white/35"><Headphones className="w-3.5 h-3.5 text-accent" /> Panel de ejecutivos</span>
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
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors" data-testid="button-clear-search">
                  <span className="text-xs">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-dash-fade-up dash-stagger-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${!activeCategory ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]" : "bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"}`}
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${activeCategory === cat ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]" : "bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"}`}
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
                  className="rounded-2xl glass-card glass-card-hover p-5 cursor-pointer group transition-all duration-300 animate-dash-fade-up relative overflow-hidden"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                  onClick={() => onSelect(ctx)}
                  data-testid={`card-context-${ctx.id}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${hexToRgba(ctx.color, 0.375)}, transparent)` }} />
                  <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" style={{ background: `radial-gradient(circle, ${hexToRgba(ctx.color, 0.03)}, transparent 60%)` }} />
                  <div className="flex items-start gap-3 relative">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${hexToRgba(ctx.color, 0.08)}` }}>
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
                    <span className="text-[10px] text-white/15">{(DEMO_PRODUCTS[ctx.id] || []).length} productos</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-white/20 mt-10 animate-dash-fade-in max-w-lg mx-auto">
            Esto es solo una muestra. Con FoxBot puedes crear el chatbot perfecto para tu negocio, con tu propia base de conocimiento y catálogo real.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileCard({ file, color }: { file: DemoFile; color: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] mt-1.5 cursor-default group/file" data-testid="card-demo-file">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${hexToRgba(color, 0.08)}` }}>
        <FileText className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-white/80 truncate">{file.name}</p>
        <p className="text-[9px] text-white/30">{file.type} · {file.size}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-white/20 group-hover/file:text-white/50 transition-colors" />
    </div>
  );
}

function DemoProductBrowser({ products, color, onSelect, onClose }: { products: DemoProduct[]; color: string; onSelect: (p: DemoProduct) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-dash-fade-up" data-testid="demo-product-browser">
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: "rgba(15,15,15,0.98)", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <span className="text-[11px] font-bold text-white/60 flex items-center gap-1.5"><ShoppingBag className="w-3 h-3" style={{ color }} /> Catálogo</span>
          <button onClick={onClose} className="text-white/30 hover:text-white/60" data-testid="button-close-product-browser"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-white/15 text-white placeholder:text-white/20"
              autoFocus
              data-testid="input-product-search"
            />
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-0.5">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                data-testid={`button-product-${p.id}`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${hexToRgba(color, 0.07)}` }}>
                  <ShoppingBag className="w-3 h-3" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-white/80 block truncate">{p.name}</span>
                  <span className="text-[10px] text-white/35">{p.price}</span>
                </div>
                {p.badge && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0" style={{ backgroundColor: `${hexToRgba(color, 0.08)}`, color }}>{p.badge}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-[10px] text-white/25 text-center py-3">No se encontraron productos</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDemoCountKey(ctxId: string) {
  return `foxbot_demo_count_${ctxId}`;
}

function getStoredDemoCount(ctxId: string): number {
  try {
    const val = sessionStorage.getItem(getDemoCountKey(ctxId));
    return val ? parseInt(val, 10) || 0 : 0;
  } catch { return 0; }
}

function setStoredDemoCount(ctxId: string, count: number) {
  try { sessionStorage.setItem(getDemoCountKey(ctxId), String(count)); } catch {}
}

function DemoChat({ ctx, onBack }: { ctx: DemoContext; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(() => getStoredDemoCount(ctx.id));
  const [showProducts, setShowProducts] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const products = DEMO_PRODUCTS[ctx.id] || [];
  const demoFile = DEMO_FILES[ctx.id];
  const remaining = MAX_DEMO_MESSAGES - messageCount;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;
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
    setShowProducts(false);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: ctx.id }),
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
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      setStoredDemoCount(ctx.id, newCount);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleProductSelect(p: DemoProduct) {
    setShowProducts(false);
    sendMessage(`Me interesa ${p.name} (${p.price})`);
  }

  const [execConnected, setExecConnected] = useState(false);
  const [execTyping, setExecTyping] = useState(false);

  function handleContactExecutive() {
    if (contactRequested) return;
    setContactRequested(true);
    setMessages(prev => [
      ...prev,
      { role: "user", content: "Quiero hablar con un ejecutivo" },
      { role: "assistant", content: `🔔 Tu solicitud fue enviada. Un ejecutivo de ${ctx.business} se conectará en breve para ayudarte personalmente.` },
    ]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: `⚡ Un ejecutivo se ha conectado al chat. A partir de ahora te atenderá directamente.` }]);
      setExecConnected(true);
    }, 2500);
    setTimeout(() => {
      setExecTyping(true);
    }, 4000);
    setTimeout(() => {
      setExecTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: `👋 ¡Hola! Soy ejecutivo de ${ctx.business}. Vi tu consulta y estoy aquí para ayudarte. ¿En qué te puedo asistir?` }]);
    }, 6000);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes (JPG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no puede superar los 10 MB");
      return;
    }
    if (messageCount >= MAX_DEMO_MESSAGES) {
      setError("Has usado tus 30 mensajes de prueba. Registrate gratis para seguir usando FoxBot sin limites.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    const imgMsg: Message = { role: "user", content: `📷 ${file.name}`, imageUrl: blobUrl };
    setMessages(prev => [...prev, imgMsg]);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    setStoredDemoCount(ctx.id, newCount);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetChat() {
    messages.forEach(m => { if (m.imageUrl) { try { URL.revokeObjectURL(m.imageUrl); } catch {} } });
    setMessages([]);
    setInput("");
    setError(null);
    setMessageCount(0);
    setStoredDemoCount(ctx.id, 0);
    setContactRequested(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-full" data-testid="demo-client-chat">
      <div className="shrink-0 px-3.5 py-3 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${ctx.color} 0%, ${ctx.colorAccent} 100%)` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <ctx.icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white leading-tight" data-testid="text-chat-brand">{ctx.business}</div>
            <div className="flex items-center gap-1 mt-0.5">
              {execConnected ? (
                <>
                  <Headphones className="w-2.5 h-2.5 text-amber-300" />
                  <span className="text-[10px] text-amber-300 font-medium">Ejecutivo atendiendo</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-[10px] text-white/70">{contactRequested ? "Conectando ejecutivo..." : "En línea"}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" onClick={() => setShowProducts(!showProducts)} data-testid="button-chat-search-products">
            <Search className="w-3 h-3 text-white" />
          </button>
          <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" onClick={onBack} data-testid="button-chat-close">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 chat-scrollbar" style={{ background: "linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(15,15,15,1) 100%)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[45vh] text-center px-2">
            <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center animate-float" style={{ backgroundColor: `${hexToRgba(ctx.color, 0.07)}` }}>
              <ctx.icon className="w-7 h-7" style={{ color: ctx.color }} />
            </div>
            <h3 className="text-base font-bold mb-1.5 text-white/80" data-testid="text-demo-greeting">Bienvenido a {ctx.business}!</h3>
            <p className="text-[11px] text-white/30 mb-4 max-w-xs">¿En qué podemos ayudarte hoy?</p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
              {ctx.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-[11px] px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                  data-testid={`button-suggestion-${i}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.role}-${i}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white/[0.05] border border-white/[0.06] rounded-bl-sm"
              }`}
              style={msg.role === "user" ? { backgroundColor: ctx.color } : undefined}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="w-3 h-3" style={{ color: ctx.color }} />
                  <span className="text-[10px] font-semibold" style={{ color: ctx.color }}>{ctx.business}</span>
                </div>
              )}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Imagen enviada"
                  className="rounded-lg max-w-full max-h-[200px] object-cover mb-1.5 cursor-pointer"
                  onClick={() => window.open(msg.imageUrl, "_blank")}
                  data-testid={`img-demo-${i}`}
                />
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.05] border border-white/[0.06] px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ctx.color }} />
                <span className="text-[11px] text-white/40">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}

        {execTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm border" style={{ backgroundColor: `${hexToRgba(ctx.color, 0.03)}`, borderColor: `${hexToRgba(ctx.color, 0.125)}` }}>
              <div className="flex items-center gap-2">
                <Headphones className="w-3 h-3" style={{ color: ctx.color }} />
                <span className="text-[11px] font-medium" style={{ color: ctx.color }}>Ejecutivo escribiendo</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: ctx.color, animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: ctx.color, animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: ctx.color, animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-destructive/10 text-destructive text-[11px] px-3 py-1.5 rounded-xl" data-testid="text-demo-error">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!contactRequested && messages.length >= 2 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-white/[0.04]" style={{ background: "rgba(10,10,10,0.95)" }}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleContactExecutive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border"
              style={{ borderColor: `${hexToRgba(ctx.color, 0.19)}`, color: ctx.color, backgroundColor: `${hexToRgba(ctx.color, 0.03)}` }}
              data-testid="button-contact-executive"
            >
              <Headphones className="w-3 h-3" />
              Contactar Ejecutivo
            </button>
            <button
              onClick={() => {
                const rating = "Gracias por la atención, excelente servicio!";
                setMessages(prev => [...prev, { role: "user", content: rating }]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-white/[0.08] text-white/40 hover:text-white/60 transition-all"
              data-testid="button-rate-chat"
            >
              <Star className="w-3 h-3" />
              Calificar
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-white/[0.06]" style={{ background: "rgba(10,10,10,0.98)" }}>
        <div className="px-3 py-2.5 relative">
          {showProducts && (
            <DemoProductBrowser
              products={products}
              color={ctx.color}
              onSelect={handleProductSelect}
              onClose={() => setShowProducts(false)}
            />
          )}
          {remaining <= 0 ? (
            <div className="text-center py-2">
              <p className="text-[11px] text-white/35 mb-2">Has usado tus {MAX_DEMO_MESSAGES} mensajes de prueba</p>
              <a href="/register">
                <Button size="sm" className="rounded-xl font-bold" data-testid="button-limit-register">
                  Registrate Gratis <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </a>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                data-testid="input-demo-file"
              />
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5" data-testid="form-demo-chat">
                <button
                  type="button"
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-white/50 transition-colors"
                  data-testid="button-demo-attach"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setShowProducts(!showProducts)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-white/50 transition-colors" data-testid="button-demo-catalog">
                  <ShoppingBag className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-white/15 transition-all disabled:opacity-50 placeholder:text-white/20 text-white"
                  data-testid="input-demo-message"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all"
                  style={{ backgroundColor: ctx.color }}
                  data-testid="button-send-demo"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[9px] text-white/15">{remaining}/{MAX_DEMO_MESSAGES} restantes</span>
                <span className="text-[9px] text-white/10">Potenciado por FoxBot</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoExecutivePanel({ ctx, onBack }: { ctx: DemoContext; onBack: () => void }) {
  const sessions = useMemo(() => generateDemoSessions(ctx), [ctx]);
  const [selectedSession, setSelectedSession] = useState<string>(sessions[1]?.id || sessions[0]?.id);
  const [claimed, setClaimed] = useState(false);
  const activeSession = sessions.find(s => s.id === selectedSession) || sessions[0];
  const file = DEMO_FILES[ctx.id];
  const [execInput, setExecInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<DemoSessionMsg[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userTyping, setUserTyping] = useState(false);
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, "active" | "closed">>({});
  const [sessionClaimed, setSessionClaimed] = useState<Record<string, boolean>>({});
  const [liveUnread, setLiveUnread] = useState<Record<string, number>>({});
  const exec = useMemo(() => getExecProfile(ctx.id), [ctx.id]);
  const [incomingNotif, setIncomingNotif] = useState<string | null>(null);
  const execInputRef = useRef<HTMLInputElement>(null);
  const [elapsedTimes] = useState<Record<string, string>>(() => {
    const times: Record<string, string> = {};
    sessions.forEach((s, i) => {
      times[s.id] = i === 0 ? "hace 2 min" : i === 1 ? "hace 45 seg" : "hace 12 min";
    });
    return times;
  });

  const getStatus = (sId: string, original: "active" | "closed") => sessionStatuses[sId] ?? original;
  const isClaimed = (sId: string) => sessionClaimed[sId] ?? false;
  const getUnread = (sId: string, original: number) => liveUnread[sId] ?? original;

  useEffect(() => {
    setLocalMsgs([]);
    setExecInput("");
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMsgs, selectedSession, userTyping]);

  const claimedOnceRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!claimed || claimedOnceRef.current[selectedSession]) return;
    claimedOnceRef.current[selectedSession] = true;
  }, [claimed, selectedSession]);

  useEffect(() => {
    const incomingTimer = setTimeout(() => {
      const unclaimed = sessions.find(s => !isClaimed(s.id) && s.id !== selectedSession && getStatus(s.id, s.status) === "active");
      if (unclaimed) {
        setLiveUnread(prev => ({ ...prev, [unclaimed.id]: (prev[unclaimed.id] ?? unclaimed.unread) + 1 }));
        setIncomingNotif(`💬 Nuevo mensaje de ${unclaimed.userName}`);
        setTimeout(() => setIncomingNotif(null), 3000);
      }
    }, 8000);
    return () => clearTimeout(incomingTimer);
  }, [selectedSession]);

  const allMessages = [...(activeSession?.messages || []), ...localMsgs];

  function handleClaim() {
    setClaimed(true);
    setSessionClaimed(prev => ({ ...prev, [selectedSession]: true }));
    setLiveUnread(prev => ({ ...prev, [selectedSession]: 0 }));
    setLocalMsgs(prev => [...prev, { sender: "system", content: `${exec.name} ha entrado al chat — El bot IA está pausado` }]);
  }

  function handleUnclaim() {
    setClaimed(false);
    setSessionClaimed(prev => ({ ...prev, [selectedSession]: false }));
    setLocalMsgs(prev => [...prev, { sender: "system", content: `${exec.name} ha salido del chat — El bot IA retoma la conversación` }]);
  }

  function handleCloseSession() {
    setSessionStatuses(prev => ({ ...prev, [selectedSession]: "closed" }));
    setClaimed(false);
    setSessionClaimed(prev => ({ ...prev, [selectedSession]: false }));
    setLocalMsgs(prev => [...prev, { sender: "system", content: "Sesión cerrada" }]);
  }

  function handleSendExecMsg() {
    if (!execInput.trim() || !claimed) return;
    setLocalMsgs(prev => [...prev, { sender: "executive", content: execInput.trim() }]);
    setExecInput("");
    execInputRef.current?.focus();
  }

  function handleSendFile() {
    if (!claimed || !file) return;
    setLocalMsgs(prev => [...prev, { sender: "executive", content: "Te envío la información detallada:", file }]);
  }

  const TAG_COLORS: Record<string, string> = {
    Consulta: "#8b5cf6",
    Venta: "#10b981",
    Urgente: "#ef4444",
    Resuelto: "#22c55e",
    VIP: "#f59e0b",
  };

  const totalPending = sessions.filter(s => s.contactRequested && !isClaimed(s.id)).length;

  return (
    <div className="flex flex-col h-full" data-testid="demo-executive-panel">
      {incomingNotif && (
        <div className="absolute top-14 right-4 z-50 animate-dash-fade-up">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg" style={{ backgroundColor: "rgba(15,15,15,0.98)", borderColor: `${hexToRgba(ctx.color, 0.19)}`, boxShadow: `0 4px 20px ${hexToRgba(ctx.color, 0.08)}` }}>
            <Bell className="w-3.5 h-3.5 animate-bounce" style={{ color: ctx.color }} />
            <span className="text-[11px] font-medium text-white/80">{incomingNotif}</span>
          </div>
        </div>
      )}

      <div className="shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-2 flex-wrap" style={{ background: `linear-gradient(135deg, ${ctx.color} 0%, ${ctx.colorAccent} 100%)` }}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Shield className="w-4 h-4 text-white shrink-0" />
          <span className="text-[11px] sm:text-[13px] font-bold text-white truncate" data-testid="text-exec-panel-title">Panel de Ejecutivos — {ctx.business}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {totalPending > 0 && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 animate-pulse">
              <Bell className="w-2.5 h-2.5 text-amber-300" />
              <span className="text-[9px] sm:text-[10px] text-amber-200 font-bold">{totalPending}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/15 border border-white/20">
            <Eye className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] sm:text-[10px] text-white font-bold">{sessions.filter(s => getStatus(s.id, s.status) === "active").length}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: exec.color }} />
            <span className="text-[9px] sm:text-[10px] text-white font-medium truncate max-w-[60px] sm:max-w-none">{exec.name}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[140px] sm:w-[220px] shrink-0 border-r border-white/[0.06] overflow-y-auto" style={{ background: "rgba(8,8,8,0.98)" }}>
          <div className="p-2 border-b border-white/[0.04]">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Chats ({sessions.length})</span>
          </div>
          {sessions.map((s) => {
            const status = getStatus(s.id, s.status);
            const sClaimed = isClaimed(s.id);
            const unread = getUnread(s.id, s.unread);
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedSession(s.id); setClaimed(sClaimed); setLiveUnread(prev => ({ ...prev, [s.id]: 0 })); }}
                className={`w-full text-left p-2 transition-all duration-200 border-b border-white/[0.03] ${
                  selectedSession === s.id
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.03]"
                } ${s.contactRequested && !sClaimed ? "bg-amber-500/[0.04]" : ""}`}
                data-testid={`button-exec-session-${s.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${hexToRgba(s.color, 0.15)}` }}>
                      <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.initial}</span>
                    </div>
                    {status === "active" && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080808] ${
                        sClaimed ? "" : s.contactRequested ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                      }`} style={sClaimed ? { backgroundColor: exec.color } : undefined} />
                    )}
                    {status === "closed" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080808] bg-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-white/80 truncate">{s.userName}</span>
                      {unread > 0 && (
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-[7px] text-white font-bold flex items-center justify-center shrink-0 animate-bounce">{unread}</span>
                      )}
                    </div>
                    {sClaimed ? (
                      <p className="text-[8px] font-bold mt-0.5 flex items-center gap-0.5" style={{ color: exec.color }}><UserRound className="w-2 h-2" /> {exec.name}</p>
                    ) : s.contactRequested && status === "active" ? (
                      <p className="text-[8px] text-amber-400 font-bold mt-0.5 flex items-center gap-0.5"><CircleDot className="w-2 h-2" /> Solicita Ejecutivo</p>
                    ) : status === "closed" ? (
                      <p className="text-[8px] text-white/20 mt-0.5">Cerrado</p>
                    ) : (
                      <p className="text-[8px] text-white/25 mt-0.5">Bot atendiendo</p>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {s.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ backgroundColor: `${hexToRgba(TAG_COLORS[tag] || "#6b7280", 0.08)}`, color: TAG_COLORS[tag] || "#6b7280" }}>{tag}</span>
                        ))}
                      </div>
                      <span className="text-[7px] text-white/15 shrink-0">{elapsedTimes[s.id]}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col min-w-0" style={{ background: "rgba(12,12,12,0.98)" }}>
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 border-b border-white/[0.06]">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${hexToRgba(activeSession.color, 0.125)}` }}>
              <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: activeSession.color }}>{activeSession.initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-white/80 truncate">{activeSession.userName}</span>
                {getStatus(selectedSession, activeSession.status) === "active" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-[8px] sm:text-[9px] text-white/25 truncate">{activeSession.userEmail}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {getStatus(selectedSession, activeSession.status) === "active" && !claimed && (
                <button
                  onClick={handleClaim}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ backgroundColor: `${hexToRgba(ctx.color, 0.08)}`, border: `1px solid ${hexToRgba(ctx.color, 0.19)}` }}
                  data-testid="button-exec-claim"
                >
                  <UserRound className="w-3 h-3" style={{ color: ctx.color }} />
                  <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: ctx.color }}><span className="hidden sm:inline">Entrar al </span>Chat</span>
                </button>
              )}
              {claimed && (
                <>
                  <button
                    onClick={handleUnclaim}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ backgroundColor: `${hexToRgba(exec.color, 0.08)}`, border: `1px solid ${hexToRgba(exec.color, 0.19)}` }}
                    data-testid="button-exec-leave"
                  >
                    <LogOut className="w-3 h-3" style={{ color: exec.color }} />
                    <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: exec.color }}><span className="hidden sm:inline">Salir del </span>Chat</span>
                  </button>
                  <button
                    onClick={handleCloseSession}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    data-testid="button-exec-close-session"
                  >
                    <X className="w-2.5 h-2.5 text-red-400" />
                    <span className="text-[10px] font-medium text-red-400">Cerrar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {claimed && (
            <div className="shrink-0 px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: `${hexToRgba(exec.color, 0.03)}`, borderBottom: `1px solid ${hexToRgba(exec.color, 0.08)}` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: exec.color }} />
              <span className="text-[10px] font-medium" style={{ color: exec.color }}>Chat asignado a {exec.name} — El bot está pausado</span>
              <span className="text-[8px] text-white/20 ml-auto">Tus respuestas llegan directamente al usuario</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 chat-scrollbar">
            {activeSession.problemType && (
              <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: `${hexToRgba(ctx.color, 0.024)}`, border: `1px solid ${hexToRgba(ctx.color, 0.07)}` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3 h-3" style={{ color: ctx.color }} />
                  <span className="text-[10px] font-bold" style={{ color: ctx.color }}>Formulario pre-chat</span>
                  <span className="text-[8px] text-white/20 ml-auto">{elapsedTimes[selectedSession]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] text-white/25 uppercase tracking-wider block">Nombre</span>
                    <span className="text-[11px] text-white/70 font-medium">{activeSession.userName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/25 uppercase tracking-wider block">Email</span>
                    <span className="text-[11px] font-medium" style={{ color: ctx.color }}>{activeSession.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/25 uppercase tracking-wider block">Consulta</span>
                    <span className="text-[11px] text-orange-300 font-medium">{activeSession.problemType}</span>
                  </div>
                  {activeSession.productName && (
                    <div>
                      <span className="text-[8px] text-white/25 uppercase tracking-wider block">Producto</span>
                      <span className="text-[11px] text-white/70 font-medium">{activeSession.productName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {allMessages.map((msg, i) => {
              if (msg.sender === "system") {
                return (
                  <div key={i} className="flex items-center gap-2 py-1.5" data-testid={`msg-exec-system-${i}`}>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[8px] text-white/30 font-medium px-2 py-0.5 rounded-full bg-white/[0.03] flex items-center gap-1">
                      <Bell className="w-2 h-2" />{msg.content}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                );
              }

              const isUser = msg.sender === "user";
              const isExec = msg.sender === "executive";

              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`} data-testid={`msg-exec-${msg.sender}-${i}`}>
                  <div className={`max-w-[75%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
                    isUser
                      ? "rounded-br-sm text-white"
                      : isExec
                        ? "rounded-bl-sm border"
                        : "bg-white/[0.05] border border-white/[0.06] rounded-bl-sm"
                  }`}
                  style={
                    isUser
                      ? { backgroundColor: "#6b7280" }
                      : isExec
                        ? { backgroundColor: `${hexToRgba(exec.color, 0.03)}`, borderColor: `${hexToRgba(exec.color, 0.08)}` }
                        : undefined
                  }>
                    {isExec && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <UserRound className="w-2.5 h-2.5" style={{ color: exec.color }} />
                        <span className="text-[9px] font-semibold" style={{ color: exec.color }}>{exec.name} (Ejecutivo)</span>
                      </div>
                    )}
                    {!isUser && !isExec && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <Bot className="w-2.5 h-2.5 text-[#8b5cf6]" />
                        <span className="text-[9px] font-semibold text-[#a78bfa]">Bot IA</span>
                      </div>
                    )}
                    {msg.content && <p className="text-white/70 whitespace-pre-wrap">{msg.content}</p>}
                    {msg.file && <FileCard file={msg.file} color={ctx.color} />}
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {msg.quickReplies.map((qr, qi) => (
                          <span key={qi} className="text-[9px] px-2 py-0.5 rounded-lg border border-white/[0.08] text-white/40">{qr}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {userTyping && (
              <div className="flex justify-end">
                <div className="px-2.5 py-1.5 rounded-xl rounded-br-sm bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30">Escribiendo</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-white/[0.06] px-3 py-2" style={{ background: "rgba(8,8,8,0.98)" }}>
            {!claimed ? (
              <div className="flex items-center gap-2 justify-center py-1">
                <UserRound className="w-3 h-3 text-white/20" />
                <span className="text-[10px] text-white/25">
                  {getStatus(selectedSession, activeSession.status) === "closed"
                    ? "Esta sesión está cerrada"
                    : 'Haz clic en "Entrar al Chat" para responder como ejecutivo'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSendFile}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/25 hover:text-white/50 transition-colors"
                  title="Enviar archivo"
                  data-testid="button-exec-send-file"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={execInputRef}
                  type="text"
                  value={execInput}
                  onChange={(e) => setExecInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendExecMsg(); }}}
                  placeholder="Responde como ejecutivo..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] focus:outline-none transition-all text-white placeholder:text-white/20"
                  style={{ borderColor: execInput.trim() ? `${hexToRgba(exec.color, 0.19)}` : undefined }}
                  data-testid="input-exec-message"
                />
                <button
                  onClick={handleSendExecMsg}
                  disabled={!execInput.trim()}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all hover:scale-110"
                  style={{ backgroundColor: exec.color }}
                  data-testid="button-exec-send"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [selectedContext, setSelectedContext] = useState<DemoContext | null>(null);
  const [mode, setMode] = useState<"client" | "executive">("client");

  useEffect(() => {
    document.title = "Demo - FoxBot by Web Maker Chile";
  }, []);

  if (!selectedContext) {
    return <ContextSelector onSelect={(ctx) => { setSelectedContext(ctx); setMode("client"); }} />;
  }

  const ctx = selectedContext;

  function changeContext() {
    setSelectedContext(null);
    setMode("client");
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col" data-testid="demo-page">
      <div className="absolute top-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full animate-orb-drift pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(ctx.color, 0.024)}, transparent 60%)` }} />
      <div className="absolute bottom-[-150px] left-[-100px] w-[350px] h-[350px] rounded-full animate-orb-drift pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(ctx.color, 0.016)}, transparent 60%)`, animationDelay: "-10s" }} />

      <nav className="shrink-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl" data-testid="demo-nav">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <button onClick={changeContext} className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors" data-testid="button-change-context">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: `${hexToRgba(ctx.color, 0.08)}` }}>
              <ctx.icon className="w-3.5 h-3.5" style={{ color: ctx.color }} />
            </div>
            <span className="text-sm font-bold hidden sm:inline" style={{ color: ctx.color }}>{ctx.business}</span>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setMode("client")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
                mode === "client"
                  ? "text-white shadow-sm"
                  : "text-white/35 hover:text-white/55"
              }`}
              style={mode === "client" ? { backgroundColor: ctx.color } : undefined}
              data-testid="button-mode-client"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Modo</span> Cliente
            </button>
            <button
              onClick={() => setMode("executive")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
                mode === "executive"
                  ? "text-white shadow-sm"
                  : "text-white/35 hover:text-white/55"
              }`}
              style={mode === "executive" ? { backgroundColor: ctx.color } : undefined}
              data-testid="button-mode-executive"
            >
              <Headphones className="w-3 h-3" />
              <span className="hidden sm:inline">Modo</span> Ejecutivo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a href="/register" className="hidden sm:block">
              <Button size="sm" className="rounded-xl font-bold text-[11px] h-8" data-testid="button-demo-register">
                Registrarse <ArrowRight className="w-3 h-3 ml-0.5" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
        {mode === "client" ? (
          <div className="w-full max-w-[400px] h-full max-h-[700px] rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col" style={{ background: "rgba(10,10,10,0.98)", boxShadow: `0 0 60px ${hexToRgba(ctx.color, 0.03)}, 0 20px 40px rgba(0,0,0,0.4)` }}>
            <DemoChat ctx={ctx} onBack={changeContext} />
          </div>
        ) : (
          <div className="w-full max-w-5xl h-full max-h-[700px] rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col" style={{ background: "rgba(10,10,10,0.98)", boxShadow: `0 0 60px ${hexToRgba(ctx.color, 0.03)}, 0 20px 40px rgba(0,0,0,0.4)` }}>
            <DemoExecutivePanel ctx={ctx} onBack={changeContext} />
          </div>
        )}
      </div>

      <div className="shrink-0 text-center py-2 border-t border-white/[0.04]">
        <p className="text-[10px] text-white/15">Demo interactiva de FoxBot — <a href="/register" className="text-primary/50 hover:text-primary/70">Registrate gratis</a> para crear tu propio chatbot</p>
      </div>
    </div>
  );
}
