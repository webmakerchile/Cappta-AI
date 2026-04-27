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
  ArrowUpRight,
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
  CircleCheck,
  Gift,
  Settings,
  LayoutDashboard,
  Wrench,
  Cpu,
  MessageCircle,
  Megaphone,
  Link,
  Phone,
  TrendingDown,
  Workflow,
  Calendar,
} from "lucide-react";
import { SiGoogle, SiApple, SiAmazonwebservices, SiMeta, SiOpenai, SiStripe, SiSlack, SiSalesforce, SiHubspot, SiTwilio, SiNotion, SiGithub, SiZoom, SiWhatsapp, SiTelegram, SiWordpress, SiShopify, SiWoo, SiMagento, SiSquarespace, SiWebflow } from "react-icons/si";
import { CapptaLogo, CapptaIcon, CapptaStackedLogo } from "@/components/CapptaLogo";
import heroBg from "@assets/hero_bg_v3.png";
import caseCjmDigitales from "@assets/image_1772552113098.png";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const capabilities = [
  {
    icon: Brain,
    title: "IA Conversacional Avanzada",
    summary: "Respuestas inteligentes que entienden tu marca, productos y clientes.",
    details: [
      "Motor GPT que comprende contexto, historial y personalidad de marca",
      "Pega la URL de tu sitio y Cappta AI extrae productos, servicios, contacto y horarios automáticamente",
      "Sube PDFs, manuales o catálogos — la IA los usa como contexto para respuestas precisas",
    ],
    iconColor: "#7669E9",
    glow: "rgba(118, 105, 233, 0.15)",
  },
  {
    icon: ShoppingCart,
    title: "Ventas Automatizadas",
    summary: "Catálogo en el chat, carrito y checkout sin salir de la conversación.",
    details: [
      "Tus clientes exploran productos, ven precios y disponibilidad sin salir del chat",
      "Compatible con WooCommerce, Shopify, WordPress, Wix y cualquier plataforma",
      "Recomendaciones inteligentes basadas en el contexto de la conversación",
    ],
    iconColor: "#9678E6",
    glow: "rgba(150, 120, 230, 0.15)",
  },
  {
    icon: Headphones,
    title: "IA + Ejecutivos Humanos",
    summary: "La IA resuelve el 90%. Cuando el cliente necesita más, un humano toma el control.",
    details: [
      "Transición invisible: el cliente nunca nota el cambio entre IA y ejecutivo",
      "Equipo multi-agente con roles (propietario, admin, ejecutivo) y colores únicos",
      "Notificaciones push instantáneas cuando un cliente solicita atención humana",
    ],
    iconColor: "#6366f1",
    glow: "rgba(99, 102, 241, 0.15)",
  },
  {
    icon: BarChart3,
    title: "Dashboard y Analíticas",
    summary: "Métricas en tiempo real de sesiones, satisfacción y rendimiento del bot.",
    details: [
      "Panel completo con métricas de sesiones, calificaciones y consumo mensual",
      "Calificaciones con estrellas directas de tus clientes",
      "Reportes de rendimiento del bot vs. ejecutivos humanos",
    ],
    iconColor: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.15)",
  },
  {
    icon: Smartphone,
    title: "Plataforma Multi-Dispositivo",
    summary: "App descargable, notificaciones push y acceso desde cualquier dispositivo.",
    details: [
      "Instala Cappta AI como app nativa en celular o PC (PWA)",
      "Notificaciones push para no perder ninguna venta",
      "Widget personalizable para tu sitio web con colores de tu marca",
    ],
    iconColor: "#14b8a6",
    glow: "rgba(20, 184, 166, 0.15)",
  },
];


interface NewPricingPlan {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  audience: string;
  conversations: string;
  channels: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
  accentColor: string;
  borderGradient: string;
}

const pricingPlans: NewPricingPlan[] = [
  {
    slug: "free",
    name: "Starter",
    tagline: "Para validar tu chatbot gratis",
    price: "$0",
    priceSuffix: "/mes",
    audience: "Microemprendedor que quiere probar",
    conversations: "50 sesiones / mes",
    channels: "Web widget",
    features: [
      "Widget personalizable",
      "IA con GPT-4o Mini",
      "Base de conocimiento básica",
      "1 usuario",
    ],
    cta: "Empezar gratis",
    ctaHref: "/register",
    accentColor: "#7669E9",
    borderGradient: "linear-gradient(135deg, hsl(220, 30%, 35%) 0%, hsl(250, 30%, 40%) 100%)",
  },
  {
    slug: "solo",
    name: "Solo",
    tagline: "Para profesionales y emprendedores",
    price: "$7.990",
    priceSuffix: "/mes",
    audience: "Microemprendedor con ventas",
    conversations: "200 sesiones / mes",
    channels: "Web + Email",
    features: [
      "Todo lo de Starter",
      "KB ilimitada con análisis de URL",
      "App PWA con push",
      "Plantillas verticales",
      "Soporte por email",
    ],
    cta: "Suscribirme",
    ctaHref: "/register?plan=solo",
    accentColor: "#7669E9",
    borderGradient: "linear-gradient(135deg, hsl(250, 50%, 50%) 0%, hsl(260, 45%, 45%) 100%)",
  },
  {
    slug: "basic",
    name: "Pro",
    tagline: "Para PyMEs que automatizan ventas",
    price: "$19.990",
    priceSuffix: "/mes",
    audience: "Pequeña / mediana empresa",
    conversations: "500 sesiones / mes",
    channels: "Web + WhatsApp + Email",
    features: [
      "Todo lo de Solo",
      "WhatsApp Business",
      "3 usuarios / agentes",
      "Catálogo de productos",
      "Calificaciones",
      "Soporte prioritario",
    ],
    cta: "Suscribirme",
    ctaHref: "/register?plan=basic",
    highlighted: true,
    badge: "Más elegido",
    accentColor: "#9678E6",
    borderGradient: "linear-gradient(135deg, hsl(250, 65%, 55%) 0%, hsl(280, 55%, 50%) 25%, hsl(220, 70%, 55%) 50%, hsl(250, 65%, 55%) 75%, hsl(280, 55%, 50%) 100%)",
  },
  {
    slug: "scale",
    name: "Scale",
    tagline: "Para empresas medianas multi-canal",
    price: "$49.990",
    priceSuffix: "/mes",
    audience: "Mediana empresa",
    conversations: "5.000 sesiones / mes",
    channels: "Multi-canal completo",
    features: [
      "Todo lo de Pro",
      "Instagram + Messenger + Telegram",
      "10 usuarios con roles",
      "Flow builder visual",
      "Lead scoring + secuencias",
      "Reportes avanzados",
    ],
    cta: "Suscribirme",
    ctaHref: "/register?plan=scale",
    accentColor: "#9678E6",
    borderGradient: "linear-gradient(135deg, hsl(280, 55%, 50%) 0%, hsl(220, 70%, 55%) 100%)",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    tagline: "Para grandes empresas con SLA",
    price: "Custom",
    priceSuffix: "",
    audience: "Empresa grande / regulada",
    conversations: "Ilimitadas",
    channels: "Todos + API privada",
    features: [
      "Todo lo de Scale",
      "Usuarios ilimitados",
      "SLA 99.95% + soporte 24/7",
      "SSO + auditoría",
      "Integraciones a medida",
      "On-premise opcional",
    ],
    cta: "Hablar con ventas",
    ctaHref: "/enterprise",
    accentColor: "#9678E6",
    borderGradient: "linear-gradient(135deg, hsl(250, 65%, 60%) 0%, hsl(220, 70%, 55%) 25%, hsl(280, 55%, 55%) 50%, hsl(250, 65%, 60%) 75%, hsl(220, 70%, 55%) 100%)",
  },
];

const verticalsList = [
  { slug: "ecommerce", name: "E-commerce", emoji: "🛒", desc: "Catálogo en chat + recuperación de carritos" },
  { slug: "restaurantes", name: "Restaurantes", emoji: "🍽️", desc: "Pedidos por WhatsApp 24/7" },
  { slug: "salones", name: "Salones y Spa", emoji: "💇", desc: "Agenda de horas con recordatorios" },
  { slug: "clinicas", name: "Clínicas", emoji: "🩺", desc: "Triaje y agenda médica" },
  { slug: "inmobiliarias", name: "Inmobiliarias", emoji: "🏠", desc: "Leads calificados a tus corredores" },
  { slug: "gimnasios", name: "Gimnasios", emoji: "💪", desc: "Inscripciones y reactivación" },
  { slug: "servicios", name: "Servicios pro", emoji: "💼", desc: "Asesorías y reuniones agendadas" },
  { slug: "educacion", name: "Educación", emoji: "🎓", desc: "Matrículas y soporte académico" },
  { slug: "automotriz", name: "Automotriz", emoji: "🚗", desc: "Cotizaciones y agenda de servicios" },
  { slug: "turismo", name: "Turismo", emoji: "✈️", desc: "Reservas multi-idioma" },
  { slug: "veterinarias", name: "Veterinarias", emoji: "🐾", desc: "Agenda y recordatorios de vacunas" },
  { slug: "construccion", name: "Construcción", emoji: "🔧", desc: "Cotización de materiales y B2B" },
  { slug: "abogados", name: "Abogados", emoji: "⚖️", desc: "Triage legal y consultas pagadas" },
  { slug: "agencias", name: "Agencias", emoji: "📣", desc: "Cualificación BANT + diagnósticos" },
  { slug: "fintech", name: "Fintech", emoji: "💳", desc: "Onboarding KYC y soporte 24/7" },
  { slug: "hoteles", name: "Hoteles", emoji: "🏨", desc: "Reservas directas + conserjería" },
];

import type { LucideIcon } from "lucide-react";

const addonIconMap: Record<string, LucideIcon> = {
  Megaphone, Link, Phone, FileText, TrendingDown, BarChart3, Workflow, Calendar, Package, MessageCircle,
};

interface AddonCatalogItem {
  slug: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
  popular?: boolean;
}

const addonCatalog: AddonCatalogItem[] = [
  { slug: "cappta-ads", name: "Cappta Ads", description: "Campañas inteligentes impulsadas por IA con segmentación avanzada y reportes en tiempo real.", price: 95000, icon: "Megaphone", category: "marketing" },
  { slug: "cappta-connect", name: "Cappta Connect", description: "Integración nativa con WhatsApp Business API. Gestiona todo desde un solo panel.", price: 63000, icon: "Link", category: "comunicacion" },
  { slug: "cappta-llamadas", name: "Cappta Llamadas", description: "500 minutos VoIP con grabación, transcripción automática y analíticas.", price: 50000, icon: "Phone", category: "comunicacion", popular: true },
  { slug: "ig-comentarios", name: "IG Comentarios IA", description: "Respuestas inteligentes automáticas en Instagram. Aumenta engagement.", price: 50000, icon: "MessageCircle", category: "marketing" },
  { slug: "pdf-ia", name: "PDF IA", description: "Genera cotizaciones, reportes y fichas técnicas al instante con IA.", price: 50000, icon: "FileText", category: "productividad" },
  { slug: "razones-perdida", name: "Razones de Pérdida", description: "Analiza por qué se pierden conversaciones con métricas de abandono.", price: 27000, icon: "TrendingDown", category: "analytics" },
  { slug: "nps-ia", name: "NPS IA", description: "Encuestas NPS automatizadas con análisis de sentimiento por IA.", price: 27000, icon: "BarChart3", category: "analytics" },
  { slug: "formulas", name: "Fórmulas", description: "Flujos de automatización con lógica condicional para respuestas y asignaciones.", price: 27000, icon: "Workflow", category: "productividad" },
  { slug: "meetings-bots", name: "Meetings Bots", description: "Bots que agendan reuniones automáticamente con Google Calendar y Zoom.", price: 19000, icon: "Calendar", category: "productividad" },
];

const addonCategoryLabels: Record<string, string> = {
  marketing: "Marketing",
  comunicacion: "Comunicación",
  analytics: "Analytics",
  productividad: "Productividad",
};

const addonCategoryColors: Record<string, string> = {
  marketing: "#f59e0b",
  comunicacion: "#06b6d4",
  analytics: "#8b5cf6",
  productividad: "#10b981",
};

function formatCLP(value: number): string {
  return "$" + value.toLocaleString("es-CL");
}

interface HeroMessage {
  sender: "user" | "bot";
  text: string;
  product?: { name: string; price: string; tag?: string };
  quickReplies?: string[];
}

const brandThemes: {
  name: string;
  headerBg: string;
  userBubble: string;
  accent: string;
  accentGlow: string;
  statusColor: string;
  statusBorder: string;
  subtitleColor: string;
  sendBg: string;
  sendIcon: string;
  label: string;
  messages: HeroMessage[];
}[] = [
  {
    name: "TechStore",
    headerBg: "linear-gradient(135deg, hsl(250, 65%, 38%) 0%, hsl(280, 55%, 30%) 100%)",
    userBubble: "linear-gradient(135deg, hsl(250, 65%, 42%) 0%, hsl(250, 65%, 34%) 100%)",
    accent: "#7669E9",
    accentGlow: "rgba(118, 105, 233, 0.08)",
    statusColor: "#a78bfa",
    statusBorder: "#4c1d95",
    subtitleColor: "rgba(196, 181, 253, 0.8)",
    sendBg: "rgba(118, 105, 233, 0.2)",
    sendIcon: "#7669E9",
    label: "Violeta",
    messages: [
      { sender: "user", text: "Hola, tienen el iPhone 15 Pro disponible?" },
      { sender: "bot", text: "¡Hola! Si, tenemos el iPhone 15 Pro en stock. Disponible en Titanio Natural, Azul y Negro.", product: { name: "iPhone 15 Pro", price: "$999.990", tag: "En stock" }, quickReplies: ["Ver colores", "Envío gratis?", "Comparar modelos"] },
      { sender: "user", text: "¡Sí, el Titanio Azul por favor" },
      { sender: "bot", text: "Envío gratis en compras sobre $500.000. Te envío el link de pago?", quickReplies: ["¡Sí, enviar link", "Agregar funda"] },
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
      { sender: "user", text: "¡Hola! Tienen delivery disponible?" },
      { sender: "bot", text: "¡Sí! Hacemos delivery de Lunes a Sábado de 12:00 a 22:00. Envío gratis sobre $15.000.", quickReplies: ["Ver menú", "Hacer pedido", "Horarios"] },
      { sender: "user", text: "¡Sí, quiero empanadas y cazuela" },
      { sender: "bot", text: "Excelente eleccion!", product: { name: "Combo Criollo", price: "$14.990", tag: "Delivery gratis" }, quickReplies: ["Confirmar pedido", "Agregar postre"] },
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
      { sender: "bot", text: "Con gusto! Nuestro blanqueamiento tiene un valor de $89.990.", product: { name: "Blanqueamiento LED", price: "$89.990", tag: "Horas disponibles" }, quickReplies: ["Agendar hora", "Ver otros tratamientos"] },
      { sender: "user", text: "El viernes en la tarde" },
      { sender: "bot", text: "Perfecto! Te agendo para el Viernes a las 16:00. La primera evaluacion es gratuita.", quickReplies: ["Confirmar", "Cambiar hora", "Hablar con recepcion"] },
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
      { sender: "user", text: "¡Hola! Busco zapatillas talla 42" },
      { sender: "bot", text: "Tenemos varias opciones en talla 42!", product: { name: "Nike Air Force 1", price: "$59.990", tag: "Más vendido" }, quickReplies: ["Ver más modelos", "Solo urbanas", "Ofertas"] },
      { sender: "user", text: "¡Sí, las urbanas por favor" },
      { sender: "bot", text: "Envío gratis sobre $40.000. Quieres agregar algo al carrito?", quickReplies: ["Agregar al carrito", "Seguir viendo", "Hablar con vendedor"] },
    ],
  },
];

function ChatbotPreview() {
  return (
    <div className="w-full max-w-[360px] mx-auto" data-testid="chatbot-preview">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(160deg, rgba(20,20,20,0.97) 0%, rgba(8,8,8,0.99) 100%)", boxShadow: "0 0 60px rgba(98,0,234,0.06), 0 20px 40px rgba(0,0,0,0.4)" }}>
        <div className="px-3.5 py-3 flex items-center gap-2.5" style={{ background: "linear-gradient(135deg, #6200EA 0%, #4a00b0 100%)" }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 border-2 border-[#4a00b0]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white" data-testid="text-preview-brand">Equipo de Soporte</p>
            <div className="flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5 text-violet-300" />
              <span className="text-[10px] text-violet-200/80" data-testid="status-preview-online">En línea</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Search className="w-3 h-3 text-white/70" /></div>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><X className="w-3 h-3 text-white/70" /></div>
          </div>
        </div>

        <div className="p-3 space-y-2.5 min-h-[200px]">
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white/[0.06] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <Headphones className="w-2.5 h-2.5 text-[#6200EA]" />
                <span className="text-[9px] font-semibold text-[#6200EA]">Soporte IA</span>
              </div>
              <p className="text-[12px] text-white/80 leading-relaxed">¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte hoy?</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-[#6200EA] rounded-2xl rounded-br-sm px-3 py-2">
              <p className="text-[12px] text-white leading-relaxed">Busco una PS5 con 2 controles</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white/[0.06] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <Headphones className="w-2.5 h-2.5 text-[#6200EA]" />
                <span className="text-[9px] font-semibold text-[#6200EA]">Soporte IA</span>
              </div>
              <p className="text-[12px] text-white/80 leading-relaxed">Tenemos la PS5 Slim + 2 DualSense a $459.990. Envío gratis! Te interesa?</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] px-2 py-1 rounded-lg bg-[#6200EA]/20 text-[#a78bfa] border border-[#6200EA]/20 cursor-default">Ver detalles</span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-[#6200EA]/20 text-[#a78bfa] border border-[#6200EA]/20 cursor-default">Agregar al carrito</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-[#6200EA] rounded-2xl rounded-br-sm px-3 py-2">
              <p className="text-[12px] text-white leading-relaxed">Quiero hablar con un ejecutivo</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white/[0.06] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3 py-2 border-l-2 border-l-violet-500">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-violet-500/30 flex items-center justify-center"><UserRound className="w-2 h-2 text-violet-400" /></div>
                <span className="text-[9px] font-semibold text-violet-400">Carlos M. — Ejecutivo</span>
              </div>
              <p className="text-[12px] text-white/80 leading-relaxed">¡Hola! Soy Carlos, vi que te interesa la PS5 Slim. Te puedo ofrecer un descuento especial hoy!</p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 mb-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#6200EA]/15 border border-[#6200EA]/20 cursor-default" data-testid="button-preview-contact">
              <UserRound className="w-3 h-3 text-[#6200EA]" />
              <span className="text-[10px] font-semibold text-[#a78bfa]">Contactar Ejecutivo</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 cursor-default" data-testid="button-preview-rate">
              <Star className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] font-semibold text-violet-300/80">Calificar</span>
            </button>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            <ImagePlus className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <ShoppingBag className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <span className="flex-1 text-[11px] text-white/20 ml-1">Escribe un mensaje...</span>
            <div className="w-7 h-7 rounded-lg bg-[#6200EA]/25 flex items-center justify-center shrink-0">
              <Send className="w-3 h-3 text-[#6200EA]" />
            </div>
          </div>
        </div>

        <div className="px-3 pb-2 text-center">
          <span className="text-[9px] text-white/15">Potenciado por Cappta AI</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full max-w-4xl mx-auto" data-testid="dashboard-preview">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.98) 0%, rgba(8,8,8,0.99) 100%)", boxShadow: "0 0 60px rgba(98,0,234,0.04), 0 20px 40px rgba(0,0,0,0.4)" }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #6200EA 0%, #4a00b0 100%)" }}>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white" data-testid="text-dashboard-title">Panel de Ejecutivos</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10">
              <Star className="w-3 h-3 text-violet-300" />
              <span className="text-xs text-white/80 font-medium">4.8</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10">
              <MessageSquare className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/80 font-medium">12 activas</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          {["Chats", "Atajos", "Etiquetas", "Productos", "Conocimiento", "Ajustes"].map((tab, i) => (
            <span key={tab} className={`text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${i === 0 ? "bg-[#6200EA]/20 text-[#a78bfa]" : "text-white/30"}`} data-testid={`tab-preview-${tab.toLowerCase()}`}>{tab}</span>
          ))}
        </div>

        <div className="flex min-h-[380px]">
          <div className="w-[220px] shrink-0 border-r border-white/[0.06] hidden sm:block">
            <div className="p-3">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 mb-3">
                <Search className="w-3.5 h-3.5 text-white/25" />
                <span className="text-xs text-white/20">Buscar chats...</span>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] px-2 py-1 rounded-lg bg-[#6200EA]/20 text-[#a78bfa] font-semibold">Activos</span>
                <span className="text-[10px] px-2 py-1 rounded-lg text-white/25">Cerrados</span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/15 text-violet-300 font-semibold flex items-center gap-1">
                  <CircleDot className="w-2.5 h-2.5" />2
                </span>
              </div>
            </div>

            <div className="space-y-1 px-2">
              {[
                { name: "Maria Lopez", msg: "Quiero hablar con alguien", status: "request", unread: 3 },
                { name: "Juan Perez", msg: "Gracias por la info!", status: "agent", unread: 0 },
                { name: "Ana Torres", msg: "Tienen envío a regiones?", status: "bot", unread: 1 },
                { name: "Pedro Soto", msg: "Me llego danado el producto", status: "request", unread: 5 },
              ].map((chat, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-2 rounded-xl cursor-default transition-colors ${i === 0 ? "bg-white/[0.06] border border-white/[0.06]" : "hover:bg-white/[0.03]"}`} data-testid={`card-preview-chat-${i}`}>
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white/50">{chat.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white/70 truncate">{chat.name}</span>
                      {chat.unread > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center shrink-0">{chat.unread}</span>}
                    </div>
                    <p className="text-[10px] text-white/30 truncate mt-0.5">{chat.msg}</p>
                  </div>
                  <div className="shrink-0">
                    {chat.status === "request" && <span className="w-2.5 h-2.5 rounded-full bg-violet-400 block animate-pulse" />}
                    {chat.status === "agent" && <span className="w-2.5 h-2.5 rounded-full bg-violet-400 block" />}
                    {chat.status === "bot" && <span className="w-2.5 h-2.5 rounded-full bg-[#6200EA] block" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white/50">M</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white/80">Maria Lopez</span>
                  <span className="text-[10px] text-white/25 hidden sm:inline">maria@email.com</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 cursor-default" data-testid="button-preview-enter">
                  <UserRound className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">Entrar</span>
                </button>
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 cursor-default" data-testid="button-preview-transfer">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">Transferir</span>
                </button>
              </div>
            </div>

            <div className="px-4 py-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/15">
                <Eye className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-violet-300/80" data-testid="status-preview-intervention">Chat asignado a ti — El bot está pausado</span>
              </div>
            </div>

            <div className="flex-1 px-4 py-2 space-y-3 overflow-hidden">
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3 h-3 text-[#6200EA]" />
                    <span className="text-[10px] font-semibold text-[#a78bfa]">Bot IA</span>
                  </div>
                  <p className="text-[13px] text-white/70 leading-relaxed">Hola Maria! ¿En qué puedo ayudarte?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#6200EA] rounded-2xl rounded-br-sm px-3.5 py-2.5">
                  <p className="text-[13px] text-white leading-relaxed">Quiero hablar con un ejecutivo por favor</p>
                </div>
              </div>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-violet-500/20" />
                <span className="text-[10px] text-violet-400/60 font-medium px-2 flex items-center gap-1"><Bell className="w-2.5 h-2.5" />Solicitud de ejecutivo</span>
                <div className="flex-1 h-px bg-violet-500/20" />
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5 border-l-2 border-l-violet-500">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-violet-500/40 flex items-center justify-center"><UserRound className="w-2 h-2 text-violet-300" /></div>
                    <span className="text-[10px] font-semibold text-violet-400">Carlos M.</span>
                  </div>
                  <p className="text-[13px] text-white/70 leading-relaxed">Hola Maria! Soy Carlos, como te puedo ayudar?</p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                <ImagePlus className="w-4 h-4 text-white/20" />
                <span className="flex-1 text-[13px] text-white/20">Responder como Carlos M...</span>
                <div className="w-8 h-8 rounded-lg bg-[#6200EA]/20 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-[#6200EA]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeFormPreview() {
  return (
    <div className="w-full max-w-[360px] mx-auto" data-testid="welcome-form-preview">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(160deg, rgba(20,20,20,0.97) 0%, rgba(8,8,8,0.99) 100%)", boxShadow: "0 0 60px rgba(98,0,234,0.06), 0 20px 40px rgba(0,0,0,0.4)" }}>
        <div className="px-3.5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #6200EA 0%, #4a00b0 100%)" }}>
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-white" />
            <span className="text-[13px] font-bold text-white" data-testid="text-form-brand">Chat de Soporte</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><X className="w-3 h-3 text-white/70" /></div>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(98,0,234,0.15)" }}>
              <Headphones className="w-7 h-7 text-[#6200EA]" />
            </div>
            <h3 className="text-base font-bold text-white/90" data-testid="text-form-title">Bienvenido!</h3>
            <p className="text-[11px] text-white/35 mt-1">Completa tus datos para iniciar la conversación</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Correo electrónico</label>
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5">
              <Mail className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[12px] text-white/70">carlos@empresa.cl</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Tipo de consulta</label>
            <div className="flex items-center justify-between bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5">
              <span className="text-[12px] text-white/70">Quiero comprar un producto</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/25" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Seleccionar producto</label>
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5">
              <Gamepad2 className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[12px] text-white/70">PS5 Slim Digital</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#6200EA]/20 text-[#a78bfa]">PS5</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Tu nombre</label>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5">
              <span className="text-[12px] text-white/70">Carlos Martinez</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white cursor-default" style={{ backgroundColor: "#6200EA" }} data-testid="button-preview-start-chat">
            Iniciar Chat
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExecutiveRequestPreview() {
  return (
    <div className="w-full max-w-4xl mx-auto" data-testid="executive-request-preview">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.98) 0%, rgba(8,8,8,0.99) 100%)", boxShadow: "0 0 60px rgba(118,105,233,0.04), 0 20px 40px rgba(0,0,0,0.4)" }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #6200EA 0%, #4a00b0 100%)" }}>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white" data-testid="text-exec-panel-title">Panel de Ejecutivos</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 animate-pulse">
              <Bell className="w-3 h-3 text-violet-300" />
              <span className="text-xs text-violet-200 font-bold">2 solicitudes</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-[380px]">
          <div className="w-[220px] shrink-0 border-r border-white/[0.06] hidden sm:block">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] px-2 py-1 rounded-lg text-white/25">Todos</span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/15 text-violet-300 font-bold flex items-center gap-1 animate-pulse">
                  <CircleDot className="w-2.5 h-2.5" />Solicita Ejecutivo
                </span>
              </div>
            </div>

            <div className="space-y-1 px-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-violet-500/[0.06] border border-violet-500/15" data-testid="card-exec-session-0">
                <div className="relative w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-violet-300">C</span>
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-violet-400 border-2 border-[#121212] animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white/80 truncate">Carlos M.</span>
                    <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center shrink-0 animate-bounce">1</span>
                  </div>
                  <p className="text-[10px] text-violet-400/60 truncate font-medium mt-0.5">Solicita ejecutivo</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300">Compra</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#6200EA]/15 text-[#a78bfa] flex items-center gap-0.5"><Gamepad2 className="w-2.5 h-2.5" />PS5</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03]" data-testid="card-exec-session-1">
                <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white/50">L</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white/60 truncate block">Laura P.</span>
                  <p className="text-[10px] text-white/25 truncate mt-0.5">Bot: Le envío las opciones...</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#6200EA] block shrink-0" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06] bg-violet-500/[0.02]">
              <div className="relative w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-violet-300">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white/80">Carlos Martinez</span>
                  <span className="text-[10px] text-white/25 hidden sm:inline">carlos@empresa.cl</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 cursor-default animate-pulse" data-testid="button-preview-claim">
                  <UserRound className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-bold text-violet-300">Entrar al Chat</span>
                </button>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="rounded-xl bg-violet-500/[0.06] border border-violet-500/15 p-4" data-testid="card-exec-prechat">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-violet-300">Formulario pre-chat</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider block mb-0.5">Nombre</span>
                    <span className="text-[13px] text-white/70 font-medium">Carlos Martinez</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider block mb-0.5">Email</span>
                    <span className="text-[13px] text-[#a78bfa] font-medium">carlos@empresa.cl</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider block mb-0.5">Consulta</span>
                    <span className="text-[13px] text-orange-300 font-medium">Comprar producto</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider block mb-0.5">Producto</span>
                    <span className="text-[13px] text-white/70 font-medium flex items-center gap-1"><Gamepad2 className="w-3 h-3 text-[#a78bfa]" />PS5 Slim</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 space-y-3 overflow-hidden">
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3 h-3 text-[#6200EA]" />
                    <span className="text-[10px] font-semibold text-[#a78bfa]">Bot IA</span>
                  </div>
                  <p className="text-[13px] text-white/70 leading-relaxed">Hola Carlos! La PS5 Slim Digital está disponible a $459.990.</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#6200EA] rounded-2xl rounded-br-sm px-3.5 py-2.5">
                  <p className="text-[13px] text-white leading-relaxed">Tienen descuento? Quiero hablar con alguien</p>
                </div>
              </div>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-violet-500/20" />
                <span className="text-[10px] text-violet-400/60 font-medium px-2 flex items-center gap-1"><Bell className="w-2.5 h-2.5" />Cliente solicita ejecutivo</span>
                <div className="flex-1 h-px bg-violet-500/20" />
              </div>
            </div>

            <div className="px-4 pb-3 pt-2">
              <div className="flex items-center gap-2 bg-violet-500/[0.04] border border-violet-500/10 rounded-xl px-4 py-3 text-center justify-center">
                <UserRound className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-violet-300/70 font-medium">Haz clic en "Entrar al Chat" para responder como ejecutivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppPreview() {
  const msgs = [
    { from: "user", text: "Hola, vi que tienen el Serum Facial disponible. ¿Cuánto cuesta?" },
    { from: "bot", text: "¡Hola! 👋 El Serum Facial Vitamina C tiene un precio de $24.990. ¿Te gustaría que te envíe el link de compra directa?" },
    { from: "user", text: "Sí porfa, y ¿hacen envíos a regiones?" },
    { from: "bot", text: "¡Claro! Enviamos a todo Chile 🇨🇱 con despacho en 24-48hrs. Aquí tienes el link: cappta.ai/shop/serum-vc ✅" },
  ];
  return (
    <div className="max-w-sm mx-auto" data-testid="preview-whatsapp">
      <div className="rounded-3xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.98) 100%)" }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #075e54 0%, #128c7e 100%)" }}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <SiWhatsapp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Cappta AI</p>
            <p className="text-[10px] text-white/70">en línea</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Phone className="w-4 h-4 text-white/70" />
          </div>
        </div>
        <div className="p-4 space-y-3 h-[280px] overflow-y-auto" style={{ background: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect width=%2260%22 height=%2260%22 fill=%22%23080808%22/%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22 fill=%22%23ffffff08%22/%3E%3C/svg%3E')" }}>
          {msgs.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`} style={{ animation: `count-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.3}s both` }}>
              <div className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.from === "user" ? "rounded-2xl rounded-br-sm bg-[#005c4b] text-white" : "rounded-2xl rounded-bl-sm bg-white/[0.08] text-white/90"}`}>
                {msg.from === "bot" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Bot className="w-3 h-3 text-[#25d366]" />
                    <span className="text-[10px] font-semibold text-[#25d366]">IA</span>
                  </div>
                )}
                {msg.text}
                <span className="text-[9px] text-white/30 ml-2">
                  {msg.from === "user" ? "14:3" + i : "14:3" + i} ✓✓
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 flex items-center gap-2 border-t border-white/[0.06]">
          <div className="flex-1 rounded-full bg-white/[0.06] px-4 py-2 text-[13px] text-white/30">Escribe un mensaje...</div>
          <div className="w-9 h-9 rounded-full bg-[#075e54] flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewTabs() {
  const [activeTab, setActiveTab] = useState<"form" | "widget" | "whatsapp" | "executive" | "dashboard">("form");
  const [userInteracted, setUserInteracted] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = [
    { id: "form" as const, label: "Formulario Pre-Chat", icon: FileText, desc: "El cliente completa sus datos antes de iniciar el chat" },
    { id: "widget" as const, label: "Chat Web", icon: MessageSquare, desc: "Widget embebido en tu sitio web — Totalmente personalizable" },
    { id: "whatsapp" as const, label: "WhatsApp", icon: SiWhatsapp, desc: "La misma IA responde en WhatsApp — tus clientes chatean desde donde prefieran" },
    { id: "executive" as const, label: "Vista Ejecutivo", icon: Bell, desc: "El ejecutivo ve la solicitud, el formulario pre-chat y el historial completo" },
    { id: "dashboard" as const, label: "Panel Completo", icon: Headphones, desc: "Panel donde gestionas chats web y WhatsApp — interviene cuando la IA lo necesite" },
  ];

  const currentIndex = tabs.findIndex((t) => t.id === activeTab);

  useEffect(() => {
    if (userInteracted) {
      const resetTimer = setTimeout(() => setUserInteracted(false), 15000);
      return () => clearTimeout(resetTimer);
    }
    autoAdvanceRef.current = setTimeout(() => {
      setActiveTab((prev) => {
        const idx = tabs.findIndex((t) => t.id === prev);
        return tabs[(idx + 1) % tabs.length].id;
      });
    }, 5000);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [activeTab, userInteracted]);

  const handleTabClick = (id: typeof activeTab) => {
    setUserInteracted(true);
    setActiveTab(id);
  };

  return (
    <div data-testid="preview-tabs">
      <div className="text-center mb-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white/90" data-testid="text-preview-heading">Así se ve en la práctica</h3>
        <p className="text-sm text-white/70 max-w-lg mx-auto">Tu IA responde en la web y en WhatsApp. Tú gestionas todo desde un solo panel.</p>
      </div>

      <div className="hidden sm:flex items-center justify-center gap-1.5 sm:gap-2 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[12px] sm:text-sm font-semibold transition-all duration-300 ${activeTab === tab.id ? "bg-[#6200EA]/20 text-white border border-[#6200EA]/30 shadow-lg shadow-[#6200EA]/10" : "glass-card text-white/60"}`}
            data-testid={`tab-${tab.id}-preview`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sm:hidden flex flex-col items-center mb-6">
        <p className="text-xs font-semibold text-white/80 mb-3">{tabs[currentIndex].label}</p>
        <div className="flex items-center gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              data-testid={`dot-${tab.id}-preview`}
              className="relative"
            >
              <div
                className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentIndex ? "#a78bfa" : "rgba(255,255,255,0.15)",
                  transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
                  boxShadow: i === currentIndex ? "0 0 8px rgba(167,139,250,0.4)" : "none",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className={`transition-all duration-500 ${activeTab === "form" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <WelcomeFormPreview />
        </div>
        <div className={`transition-all duration-500 ${activeTab === "widget" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <ChatbotPreview />
        </div>
        <div className={`transition-all duration-500 ${activeTab === "whatsapp" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <WhatsAppPreview />
        </div>
        <div className={`transition-all duration-500 ${activeTab === "executive" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <ExecutiveRequestPreview />
        </div>
        <div className={`transition-all duration-500 ${activeTab === "dashboard" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <DashboardPreview />
        </div>
      </div>
      <p className="text-center text-[11px] text-white/50 mt-4">{tabs[currentIndex].desc}</p>
    </div>
  );
}

const COUNTRIES = [
  { code: "CL", name: "Chile", lang: "ESPAÑOL", flagUrl: "https://flagcdn.com/w40/cl.png" },
  { code: "MX", name: "México", lang: "ESPAÑOL", flagUrl: "https://flagcdn.com/w40/mx.png" },
  { code: "CO", name: "Colombia", lang: "ESPAÑOL", flagUrl: "https://flagcdn.com/w40/co.png" },
  { code: "AR", name: "Argentina", lang: "ESPAÑOL", flagUrl: "https://flagcdn.com/w40/ar.png" },
];

function CountrySelector() {
  const [selected, setSelected] = useState(COUNTRIES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" data-testid="country-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] transition-colors overflow-hidden"
        data-testid="button-country-toggle"
      >
        <img src={selected.flagUrl} alt={selected.name} className="w-6 h-6 rounded-full object-cover" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-white/[0.1] bg-[#0e0e14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-dash-fade-up z-50 py-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setSelected(c); setIsOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.06] transition-colors ${selected.code === c.code ? "bg-white/[0.04]" : ""}`}
              data-testid={`country-option-${c.code}`}
            >
              <img src={c.flagUrl} alt={c.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
              <span className="text-white/90 font-medium text-sm flex-1 text-left">{c.name}</span>
              {selected.code === c.code && <Check className="w-4 h-4 text-primary" />}
              <span className="text-white/30 text-xs font-semibold tracking-wider">{c.lang}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4" data-testid="nav-bar">
      <div className={`max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3 rounded-2xl transition-all duration-500 backdrop-blur-2xl border shadow-2xl shadow-black/30 ${scrolled ? "bg-[#0a0a0a]/60 border-white/[0.04]" : "bg-[#0a0a0a]/80 border-white/[0.06]"}`}>
        <a href="/" className="flex items-center gap-2.5 group flex-shrink-0" data-testid="link-home">
          <CapptaIcon size={34} />
          <span className="text-lg font-heading font-semibold tracking-[-0.02em]">
            <span className="text-white/90">Cappta</span>
            <span className="text-white font-light ml-1">AI</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-1">
          <a href="#features" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors" data-testid="link-features">Plataforma</a>
          <a href="#casos" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors" data-testid="link-cases-nav">Clientes</a>
          <a href="#pricing" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors" data-testid="link-pricing">Precios</a>
          <a href="#extensiones" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors" data-testid="link-addons-nav">Extensiones</a>
          <a href="/guias" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors" data-testid="link-guides-nav">Recursos</a>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <CountrySelector />
          <a href="/login" className="text-sm text-white/80 hover:text-white transition-colors" data-testid="link-login">Iniciar Sesión</a>
          <a href="/demo">
            <Button size="sm" className="rounded-xl px-5 py-2 text-sm font-semibold" data-testid="link-register">
              Agenda Reunión
            </Button>
          </a>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <CountrySelector />
          <button onClick={() => setOpen(!open)} className="p-2 text-white/60 hover:text-white transition-colors" data-testid="button-mobile-menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden mt-2 mx-auto max-w-6xl rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-2xl px-6 py-5 space-y-1 animate-dash-fade-up">
          <a href="#features" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Plataforma</a>
          <a href="#casos" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Clientes</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Precios</a>
          <a href="#extensiones" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Extensiones</a>
          <a href="/guias" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Recursos</a>
          <div className="h-px bg-white/[0.06] my-3" />
          <a href="/login" className="block">
            <Button variant="outline" size="sm" className="w-full rounded-xl border-white/10 text-white/70 hover:bg-white/5" data-testid="link-login-mobile">Iniciar Sesión</Button>
          </a>
          <a href="/demo" onClick={() => setOpen(false)} className="block mt-2">
            <Button size="sm" className="w-full rounded-xl font-semibold">Agenda Reunión</Button>
          </a>
        </div>
      )}
    </nav>
  );
}

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

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visibleMessages, themeIndex]);

  return (
    <div className="w-full max-w-[340px] sm:max-w-sm mx-auto" data-testid="chat-demo">
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
              <CapptaIcon size={36} className="rounded-full" />
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
          <div ref={chatScrollRef} className="relative p-4 space-y-3 h-[280px] overflow-y-auto chat-scrollbar">
            {theme.messages.slice(0, visibleMessages).map((msg, i) => (
              <div key={`${themeIndex}-${i}`} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`} style={{ animation: "count-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                <div className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.sender === "user" ? "rounded-2xl rounded-br-sm text-white" : "rounded-2xl rounded-bl-sm text-white/90"}`} style={{ background: msg.sender === "user" ? theme.userBubble : "rgba(255,255,255,0.07)" }}>
                  {msg.sender === "bot" && (
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3" style={{ color: theme.accent }} />
                      <span className="text-[10px] font-semibold" style={{ color: theme.accent }}>IA</span>
                    </div>
                  )}
                  {msg.text}
                  {msg.product && (
                    <div className="mt-2 rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="w-3 h-3 flex-shrink-0" style={{ color: theme.accent }} />
                            <span className="text-[11px] font-semibold text-white/90 truncate">{msg.product.name}</span>
                          </div>
                          <span className="text-[12px] font-bold mt-0.5 block" style={{ color: theme.accent }}>{msg.product.price}</span>
                        </div>
                        {msg.product.tag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-2 whitespace-nowrap" style={{ background: `${theme.accent}20`, color: theme.accent }}>{msg.product.tag}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {msg.quickReplies && i === visibleMessages - 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[90%]" style={{ animation: "count-fade 0.3s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards", opacity: 0 }}>
                    {msg.quickReplies.map((qr) => (
                      <span key={qr} className="text-[10px] px-2.5 py-1 rounded-full border cursor-default" style={{ borderColor: `${theme.accent}40`, color: theme.accent, background: `${theme.accent}0a` }}>{qr}</span>
                    ))}
                  </div>
                )}
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
          <div className="relative px-4 pb-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center" style={{ transition: "all 0.6s" }}>
                <ImagePlus className="w-3.5 h-3.5 text-white/25" />
              </div>
              <div className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center" style={{ transition: "all 0.6s" }}>
                <ShoppingBag className="w-3.5 h-3.5" style={{ color: `${theme.accent}60`, transition: "color 0.6s" }} />
              </div>
              <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-2">
                <span className="text-white/25 text-[12px] flex-1">Escribe un mensaje...</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.sendBg, transition: "background-color 0.6s" }}>
                  <Send className="w-3.5 h-3.5" style={{ color: theme.sendIcon, transition: "color 0.6s" }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/[0.06] text-white/20 flex items-center gap-1">
                <UserRound className="w-2.5 h-2.5" />
                Contactar ejecutivo
              </span>
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


function CapabilitiesAccordion({ isVisible }: { isVisible: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {capabilities.map((cap, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={cap.title}
            className={`rounded-2xl glass-card transition-all duration-500 overflow-hidden ${isVisible ? "animate-count-fade" : "opacity-0"}`}
            style={{ animationDelay: `${index * 100}ms` }}
            data-testid={`accordion-feature-${index}`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center gap-4 p-6 text-left transition-colors hover:bg-white/[0.02]"
              data-testid={`button-feature-toggle-${index}`}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-300"
                style={{ backgroundColor: `${cap.iconColor}12` }}
              >
                <cap.icon className="w-6 h-6" style={{ color: cap.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white/90">{cap.title}</h3>
                <p className="text-sm text-white/60 mt-0.5">{cap.summary}</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/30 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? "300px" : "0", opacity: isOpen ? 1 : 0 }}
            >
              <div className="px-6 pb-6 pt-0 pl-[88px]">
                <ul className="space-y-2.5">
                  {cap.details.map((detail, di) => (
                    <li key={di} className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cap.iconColor }} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const faqItems = [
  {
    q: "¿Qué es Cappta AI y cómo funciona?",
    a: "Cappta AI es un agente de inteligencia artificial que atiende y vende por ti las 24 horas. Se integra en tu sitio web como un widget de chat, responde preguntas de tus clientes usando IA avanzada, y cuando el cliente necesita atención humana, un ejecutivo toma el control sin interrupciones.",
  },
  {
    q: "¿Necesito conocimientos técnicos para instalar Cappta AI?",
    a: "No. Nuestro equipo te ayuda con la instalación completa. Solo necesitas pegar un código en tu sitio web (WordPress, Shopify, WooCommerce, Wix, etc.) y listo. También ofrecemos onboarding personalizado en los planes Pro y Enterprise.",
  },
  {
    q: "¿Puedo probar Cappta AI antes de comprar?",
    a: "Sí. Puedes agendar una reunión personalizada donde te mostramos cómo funciona Cappta AI con tu negocio específico. Nuestro equipo te guía paso a paso.",
  },
  {
    q: "¿Qué plataformas soporta Cappta AI?",
    a: "Cappta AI es compatible con WordPress, WooCommerce, Shopify, Wix, y cualquier sitio web que permita insertar código HTML. También ofrecemos integración vía API para plataformas personalizadas.",
  },
  {
    q: "¿Puedo cancelar mi suscripción en cualquier momento?",
    a: "Sí. No hay contratos de permanencia. Puedes cancelar tu plan en cualquier momento desde tu dashboard. Ten en cuenta que no se admiten reembolsos según nuestros términos de servicio.",
  },
];

function FAQSection({ isVisible }: { isVisible: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`rounded-2xl glass-card transition-all duration-500 overflow-hidden ${isVisible ? "animate-count-fade" : "opacity-0"}`}
            style={{ animationDelay: `${index * 80}ms` }}
            data-testid={`accordion-faq-${index}`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
              data-testid={`button-faq-toggle-${index}`}
            >
              <span className="flex-1 text-sm font-semibold text-white/80">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-white/30 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? "300px" : "0", opacity: isOpen ? 1 : 0 }}
            >
              <div className="px-5 pb-5 pt-0">
                <p className="text-sm text-white/70 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ROICalculator() {
  const [conversations, setConversations] = useState(500);
  const [conversionRate, setConversionRate] = useState(15);
  const [avgTicket, setAvgTicket] = useState(35000);
  const [staffHours, setStaffHours] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(4500);

  const monthlyRevenue = Math.round(conversations * (conversionRate / 100) * avgTicket);
  const staffSavings = Math.round(staffHours * 4 * hourlyRate);
  const capptaCost = 19990;
  const total = monthlyRevenue + staffSavings - capptaCost;
  const roiMultiplier = (total / capptaCost).toFixed(1);

  const fmt = (n: number) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-10" data-testid="roi-calculator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">TUS NÚMEROS</p>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/80">Conversaciones / mes</label>
              <span className="text-sm font-bold text-violet-300">{conversations}</span>
            </div>
            <input type="range" min={50} max={5000} step={50} value={conversations} onChange={(e) => setConversations(Number(e.target.value))} className="w-full accent-violet-500" data-testid="slider-conversations" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/80">% que termina comprando</label>
              <span className="text-sm font-bold text-violet-300">{conversionRate}%</span>
            </div>
            <input type="range" min={1} max={50} step={1} value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="w-full accent-violet-500" data-testid="slider-conversion" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/80">Ticket promedio (CLP)</label>
              <span className="text-sm font-bold text-violet-300">{fmt(avgTicket)}</span>
            </div>
            <input type="range" min={5000} max={500000} step={5000} value={avgTicket} onChange={(e) => setAvgTicket(Number(e.target.value))} className="w-full accent-violet-500" data-testid="slider-ticket" />
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/80">Horas/semana atendiendo chats</label>
                <span className="text-sm font-bold text-violet-300">{staffHours}h</span>
              </div>
              <input type="range" min={0} max={60} step={1} value={staffHours} onChange={(e) => setStaffHours(Number(e.target.value))} className="w-full accent-violet-500" data-testid="slider-hours" />
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/80">Costo / hora del staff (CLP)</label>
                <span className="text-sm font-bold text-violet-300">{fmt(hourlyRate)}</span>
              </div>
              <input type="range" min={2000} max={20000} step={500} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full accent-violet-500" data-testid="slider-hourly" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-900/5 border border-violet-500/30 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">ESTIMACIÓN MENSUAL</p>

            <div className="flex justify-between items-baseline pb-3 border-b border-white/10">
              <span className="text-white/70 text-sm">Ventas adicionales</span>
              <span className="text-2xl font-black text-white" data-testid="text-revenue">+{fmt(monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between items-baseline pb-3 border-b border-white/10">
              <span className="text-white/70 text-sm">Ahorro en staff</span>
              <span className="text-2xl font-black text-white" data-testid="text-savings">+{fmt(staffSavings)}</span>
            </div>
            <div className="flex justify-between items-baseline pb-3 border-b border-white/10">
              <span className="text-white/70 text-sm">Costo Cappta Pro</span>
              <span className="text-xl font-bold text-white/60">−{fmt(capptaCost)}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-white/50 mb-1">Beneficio neto / mes</p>
              <p className="text-5xl font-black text-violet-300" data-testid="text-roi-total">{fmt(total)}</p>
              <p className="text-xs text-white/50 mt-2">Eso es <span className="font-bold text-violet-300">{roiMultiplier}x</span> el costo de Cappta</p>
            </div>
          </div>

          <a href="/register" className="block mt-6">
            <Button className="w-full py-6 rounded-xl text-base font-bold text-white" style={{ background: "linear-gradient(135deg, #7669E9 0%, #5b4dd6 100%)" }} data-testid="button-roi-cta">
              Capturar este beneficio <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>

      <p className="text-xs text-white/40 text-center mt-6">
        Estimación basada en datos promedio. Resultados varían según industria, oferta y operación.
      </p>
    </div>
  );
}

export default function Landing() {
  const statsSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const handoffSection = useInView(0.15);
  const stepsSection = useInView(0.1);
  const pricingSection = useInView(0.1);
  const addonsSection = useInView(0.1);
  const faqSection = useInView(0.1);
  const casesSection = useInView(0.1);


  return (
    <div className="min-h-screen bg-[#030308] text-foreground overflow-y-auto" data-testid="landing-page">
      <MobileNav />

      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 pointer-events-none">
          <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(3,3,8,0.6) 0%, rgba(3,3,8,0.3) 30%, rgba(3,3,8,0.25) 50%, rgba(3,3,8,0.5) 75%, rgba(3,3,8,0.85) 100%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center px-6 pt-32 pb-12 flex-1 flex flex-col justify-center">
          <h1 className="font-heading text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-[-0.03em] leading-[1.05] mb-6 sm:mb-8" data-testid="text-hero-title">
            <span className="block text-white">TU EQUIPO</span>
            <span className="block text-white">COMERCIAL</span>
            <span className="block text-white">CON IA</span>
          </h1>

          <p className="text-sm sm:text-base uppercase tracking-[0.25em] text-white/60 font-medium mb-6 font-heading">
            Una extensión de tu equipo que impulsa tu negocio
          </p>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="text-hero-description">
            Automatiza y deja que la IA responda, califique y haga seguimiento.
            <span className="text-white font-bold"> Más leads, más conversión</span>, y lo mejor, sin aumentar tus costos.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            <a href="/demo">
              <Button size="lg" className="text-base px-8 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300" data-testid="button-hero-register">
                <SiWhatsapp className="w-5 h-5 mr-2" />
                Comenzar ahora
              </Button>
            </a>
            <a href="/demo">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-hero-demo">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Agenda una demo
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {[
              { text: "+1,500 Clientes en Latinoamérica", color: "#10b981" },
              { text: "Garantía total de 60 días", color: "#10b981" },
              { text: "Implementación personalizada", color: "#10b981" },
            ].map(({ text, color }) => (
              <span key={text} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {text}
              </span>
            ))}
          </div>
        </div>

        <div className="relative pb-12 overflow-hidden" data-testid="logos-trusted-by">
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10" style={{ background: "linear-gradient(90deg, #030308 0%, transparent 100%)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10" style={{ background: "linear-gradient(270deg, #030308 0%, transparent 100%)" }} />
          <div className="flex animate-marquee">
            {[0, 1].map((set) => (
              <div key={set} className="flex shrink-0 items-center gap-10 sm:gap-16 px-5 sm:px-8">
                {[
                  { Icon: SiWordpress, name: "WordPress", size: "w-5 h-5" },
                  { Icon: SiShopify, name: "Shopify", size: "w-5 h-5" },
                  { Icon: SiWoo, name: "WooCommerce", size: "w-6 h-6" },
                  { Icon: SiSquarespace, name: "Squarespace", size: "w-5 h-5" },
                  { Icon: SiMeta, name: "Meta", size: "w-5 h-5" },
                  { Icon: SiWhatsapp, name: "WhatsApp", size: "w-5 h-5" },
                ].map(({ Icon, name, size }) => (
                  <div key={name} className="flex items-center gap-2.5 opacity-40" data-testid={`logo-partner-${name.toLowerCase()}`}>
                    <Icon className={`${size} text-white`} />
                    <span className="text-sm sm:text-base text-white font-semibold tracking-wide whitespace-nowrap">{name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="py-28 px-6 relative overflow-hidden" ref={statsSection.ref as any} data-testid="section-stats">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">RESULTADOS COMPROBADOS</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-4 text-white">
              Los números hablan por sí mismos
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">Ve el impacto en métricas reales.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { value: "3x", label: "Más conversiones automáticas", icon: TrendingUp, desc: "Sin aumentar personal comercial ni gestiones manuales" },
              { value: "+90%", label: "Consultas resueltas por IA", icon: Users, desc: "Reducción en tareas manuales con flujos automatizados" },
              { value: "+50", label: "Empresas confían en nosotros", icon: Shield, desc: "Desde startups hasta empresas consolidadas en Chile" },
              { value: "99.9%", label: "Uptime garantizado", icon: Clock, desc: "Confiabilidad empresarial con automatización que nunca para" },
              { value: "<2s", label: "Tiempo de respuesta", icon: Zap, desc: "Velocidad de IA para no perder ningún lead" },
              { value: "5+", label: "Canales impulsados por IA", icon: MessageSquare, desc: "WhatsApp, Web, WordPress, Shopify y más" },
            ].map(({ value, label, icon: Icon, desc }, i) => (
              <div key={label} className={`group ${statsSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: `${i * 80}ms` }} data-testid={`stat-${label}`}>
                <div className="rounded-2xl glass-card p-6 h-full transition-all duration-300 hover:border-white/[0.12]">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-5 bg-violet-500/[0.08]">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-black mb-2 text-white">
                    <CountUp target={value} />
                  </p>
                  <p className="text-sm font-semibold text-white/80 mb-1">{label}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-28 px-6 relative overflow-hidden" ref={featuresSection.ref as any} data-testid="section-features">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[-200px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.05) 0%, transparent 60%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-0 left-[-200px] w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(220, 70%, 52%, 0.04) 0%, transparent 60%)", animationDelay: "-15s" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">PLATAFORMA DE IA COMERCIAL</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-features-title">
              Todo lo que necesitas para
              <br />
              hacer crecer tu negocio
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-features-description">
              Un producto y sus extensiones trabajando en conjunto para automatizar
              toda tu operación de ventas, atención y marketing.
            </p>
          </div>

          <CapabilitiesAccordion isVisible={featuresSection.isVisible} />
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden" ref={handoffSection.ref as any} data-testid="section-handoff">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">IA + EJECUTIVOS HUMANOS</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-handoff-title">
              La IA vende, y cuando necesitas,
              <br />
              tu ejecutivo cierra
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Cappta AI no solo atiende — <span className="text-white font-semibold">vende por ti</span>. Responde, califica leads y cierra ventas de forma autónoma. Y cuando el cliente necesita atención humana,
              un ejecutivo toma el control del chat <span className="text-white font-semibold">en tiempo real</span>, sin que el cliente note el cambio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: "1",
                title: "La IA atiende y vende",
                desc: "Cappta AI responde al instante, resuelve dudas, muestra productos, califica leads y cierra ventas las 24 horas.",
                icon: Bot,
                color: "#7669E9",
                gradient: "linear-gradient(135deg, rgba(118,105,233,0.08) 0%, rgba(118,105,233,0.02) 100%)",
              },
              {
                step: "2",
                title: "El cliente pide ayuda",
                desc: "Si necesita algo más complejo, el cliente solicita hablar con un ejecutivo con un solo clic.",
                icon: MessageSquare,
                color: "#a78bfa",
                gradient: "linear-gradient(135deg, rgba(118,105,233,0.08) 0%, rgba(118,105,233,0.02) 100%)",
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
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(item.color, 0.08) }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <span className="text-xs font-bold text-white/30">{item.step}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2.5 text-white">{item.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
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
                { value: "90%", label: "Consultas resueltas por IA", desc: "Sin intervención humana", color: "#7669E9" },
                { value: "0s", label: "Tiempo de traspaso", desc: "El ejecutivo entra al instante", color: "#6366f1" },
                { value: "100%", label: "Historial visible", desc: "El agente ve toda la conversación", color: "#a78bfa" },
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
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.1) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">LISTO EN MINUTOS</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-how-title">
              3 pasos y listo
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
              No necesitas ser técnico. De cero al chat en vivo en minutos.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(118,105,233,0.12) 20%, rgba(118,105,233,0.12) 80%, transparent 95%)" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: "01",
                  title: "Crea tu cuenta",
                  desc: "Crea tu cuenta, configura el nombre de tu empresa, colores y mensaje de bienvenida.",
                  icon: Headphones,
                  color: "#7669E9",
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
                  desc: "Agrega una línea de código a tu sitio web y Cappta AI atiende clientes al instante.",
                  icon: Code,
                  color: "#a855f7",
                },
              ].map((item, index) => (
                <div key={item.step} className={`group ${stepsSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: `${index * 150}ms` }} data-testid={`step-${index}`}>
                  <div className="rounded-2xl glass-card glass-card-hover p-8 h-full text-center transition-all duration-500">
                    <p className="text-xs font-bold text-white/25 tracking-widest mb-4">{item.step}</p>
                    <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ backgroundColor: hexToRgba(item.color, 0.06) }}>
                      <item.icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="/demo">
              <Button variant="outline" size="lg" className="rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-steps-demo">
                <ArrowRight className="w-4 h-4 mr-2 text-primary" />
                Agenda una reunión
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="casos" className="py-28 px-6 relative overflow-hidden" ref={casesSection.ref as any} data-testid="section-cases">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.1) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ background: "linear-gradient(135deg, rgba(118,105,233,0.18), rgba(150,120,230,0.12))", border: "1px solid rgba(118,105,233,0.35)" }} data-testid="badge-flagship-case">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">Caso emblemático · 2026</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-cases-title">
              CJM Digitales: <span style={{ background: "linear-gradient(135deg, #7669E9 0%, #9678E6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>+$14,3 millones</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>en ventas extra en 74 días
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-cases-description">
              Comparación año contra año del mismo período (11 feb – 25 abr) eliminando estacionalidad. Resultados reales de la tienda chilena de juegos digitales más popular tras implementar Cappta AI.
            </p>
          </div>

          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 ${casesSection.isVisible ? "animate-count-fade" : "opacity-0"}`} data-testid="grid-cjm-headline-metrics">
            {[
              { label: "Ventas netas", value: "+15,5%", sub: "+$14,3M en 74 días", color: "#10b981", icon: TrendingUp, testId: "metric-sales" },
              { label: "Ticket promedio", value: "+13,5%", sub: "$17.512 → $19.880", color: "#7669E9", icon: TrendingUp, testId: "metric-ticket" },
              { label: "Productos vendidos", value: "+12,1%", sub: "+720 unidades", color: "#9678E6", icon: TrendingUp, testId: "metric-products" },
              { label: "Reembolsos", value: "−83,5%", sub: "$1,6M → $270K", color: "#f97316", icon: TrendingDown, testId: "metric-refunds", star: true },
            ].map((m, i) => (
              <div
                key={m.label}
                className="relative rounded-2xl glass-card p-4 sm:p-5 overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
                data-testid={`card-${m.testId}`}
              >
                {m.star && (
                  <div className="absolute top-2.5 right-2.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" data-testid="icon-star-refunds" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: hexToRgba(m.color, 0.12) }}>
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <p className="text-xs text-white/50 mb-1.5">{m.label}</p>
                <p className="font-heading text-2xl sm:text-3xl font-black mb-1" style={{ color: m.color }} data-testid={`text-${m.testId}-value`}>{m.value}</p>
                <p className="text-[11px] text-white/45">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-3xl glass-card overflow-hidden ${casesSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: "320ms" }} data-testid="card-cjm-showcase">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              <div className="lg:col-span-2 relative overflow-hidden min-h-[280px] lg:min-h-[520px]">
                <img
                  src={caseCjmDigitales}
                  alt="CJM Digitales · Asistente IA de Soporte 24/7 con Cappta AI"
                  className="w-full h-full object-cover object-top"
                  data-testid="img-cjm-screenshot"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111111] via-transparent to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide text-white" style={{ backgroundColor: hexToRgba("#7669E9", 0.9), backdropFilter: "blur(8px)" }} data-testid="badge-cjm-industry">
                    Gaming Digital
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide text-white/95" style={{ backgroundColor: "rgba(16,185,129,0.85)", backdropFilter: "blur(8px)" }} data-testid="badge-cjm-status">
                    En producción
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white mb-1" data-testid="text-cjm-name">CJM Digitales</h3>
                  <a href="https://cjmdigitales.cl/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid="link-cjm-site">
                    cjmdigitales.cl <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-3 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-primary tracking-[0.18em] uppercase">Comparación año contra año · mismo período</p>
                </div>

                <div className="overflow-x-auto -mx-2 mb-6">
                  <table className="w-full text-sm" data-testid="table-cjm-yoy">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-white/40 border-b border-white/[0.08]">
                        <th className="text-left font-semibold py-2 px-2">Métrica</th>
                        <th className="text-right font-semibold py-2 px-2">2025 sin chatbot</th>
                        <th className="text-right font-semibold py-2 px-2">2026 con Cappta AI</th>
                        <th className="text-right font-semibold py-2 px-2">Cambio</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {[
                        { k: "Ventas netas", a: "$92.290.453", b: "$106.636.781", delta: "+15,5%", positive: true },
                        { k: "Pedidos", a: "5.270", b: "5.364", delta: "+1,8%", positive: true },
                        { k: "Productos vendidos", a: "5.964", b: "6.684", delta: "+12,1%", positive: true },
                        { k: "Ticket promedio", a: "$17.512", b: "$19.880", delta: "+13,5%", positive: true },
                        { k: "Promedio por día", a: "$1.247.168", b: "$1.441.038", delta: "+15,5%", positive: true },
                        { k: "Reembolsos", a: "$1.639.665", b: "$270.585", delta: "−83,5%", positive: true, refund: true },
                      ].map((row) => (
                        <tr key={row.k} className="border-b border-white/[0.04] last:border-0" data-testid={`row-yoy-${row.k.toLowerCase().replace(/\s+/g, "-")}`}>
                          <td className="py-2.5 px-2 text-white/85 font-medium">{row.k}</td>
                          <td className="py-2.5 px-2 text-right text-white/55 tabular-nums">{row.a}</td>
                          <td className="py-2.5 px-2 text-right text-white tabular-nums font-semibold">{row.b}</td>
                          <td className={`py-2.5 px-2 text-right font-bold tabular-nums ${row.refund ? "text-amber-400" : "text-emerald-400"}`}>
                            {row.delta}{row.refund ? " ⭐" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {[
                    { v: "6.000+", l: "Chats atendidos", testId: "stat-chats" },
                    { v: "+90%", l: "Calificaciones 5★", testId: "stat-stars" },
                    { v: "64%", l: "Resuelto por IA", testId: "stat-ai" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl px-3 py-3 text-center" style={{ background: "rgba(118,105,233,0.06)", border: "1px solid rgba(118,105,233,0.18)" }} data-testid={`card-${s.testId}`}>
                      <p className="font-heading text-lg sm:text-xl font-black text-white" data-testid={`text-${s.testId}-value`}>{s.v}</p>
                      <p className="text-[10px] sm:text-[11px] text-white/55 mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-4 mb-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(118,105,233,0.06))", border: "1px solid rgba(16,185,129,0.18)" }} data-testid="card-cjm-quote">
                  <p className="text-sm text-white/85 leading-relaxed italic">
                    "Bajamos los reembolsos un 83,5% y aumentamos el ticket promedio 13,5%. El chatbot resuelve los problemas antes de que escalen, sugiere productos y vende mejor — todo sin contratar más personal."
                  </p>
                  <p className="text-xs text-white/50 mt-2 font-medium">— Resumen de impacto · CJM Digitales · Periodo 11 feb – 25 abr 2026</p>
                </div>

                <a
                  href="https://cjmdigitales.cl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #7669E9 0%, #9678E6 100%)", boxShadow: "0 6px 20px rgba(118,105,233,0.35)" }}
                  data-testid="link-cjm-visit"
                >
                  Visitar CJM Digitales
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-28 px-6 relative overflow-hidden" ref={pricingSection.ref as any} data-testid="section-pricing">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.05) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">PRECIOS TRANSPARENTES</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-pricing-title">
              Empieza a crecer, sin aumentar
              <br />
              tu gestión ni tu inversión
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed" data-testid="text-pricing-description">
              Planes transparentes diseñados para escalar contigo. Sin costos ocultos ni sorpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.slug}
                className={`relative rounded-2xl transition-all duration-500 flex ${pricingSection.isVisible ? "animate-count-fade" : "opacity-0"} ${plan.highlighted ? "lg:scale-[1.04] lg:z-10" : ""}`}
                style={{ animationDelay: `${index * 80}ms` }}
                data-testid={`card-pricing-${plan.slug}`}
              >
                <div className="absolute -inset-[1px] rounded-2xl z-0" style={{ background: plan.borderGradient, padding: "1px" }}>
                  <div className="w-full h-full rounded-2xl bg-[#0c0c0f]" />
                </div>

                <div className="relative z-10 rounded-2xl flex flex-col w-full" style={{ background: plan.highlighted ? "rgba(118, 105, 233, 0.06)" : "rgba(255,255,255,0.01)" }}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, #7669E9 0%, #9678E6 100%)" }}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="px-5 pt-6 pb-4">
                    <h3 className="text-xl font-heading font-bold text-white/95 mb-1" data-testid={`text-plan-name-${plan.slug}`}>{plan.name}</h3>
                    <p className="text-xs text-white/50 mb-5 min-h-[32px]">{plan.tagline}</p>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white" data-testid={`text-plan-price-${plan.slug}`}>{plan.price}</span>
                        {plan.priceSuffix && <span className="text-sm text-white/40">{plan.priceSuffix}</span>}
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">{plan.audience}</p>
                    </div>

                    <a href={plan.ctaHref} className="block mb-5">
                      <Button
                        className={`w-full py-5 rounded-xl text-sm font-bold ${
                          plan.highlighted
                            ? "shadow-xl shadow-violet-500/20 text-white"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10"
                        }`}
                        style={plan.highlighted ? { background: "linear-gradient(135deg, #7669E9 0%, #5b4dd6 100%)" } : undefined}
                        data-testid={`button-plan-cta-${plan.slug}`}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  </div>

                  <div className="px-5 pb-6 flex-1 flex flex-col">
                    <div className="h-px mb-4 bg-white/[0.06]" />

                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 mb-4">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">VOLUMEN</p>
                      <p className="text-xs font-semibold text-white/85">{plan.conversations}</p>
                      <p className="text-[10px] text-white/40 mt-1">{plan.channels}</p>
                    </div>

                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mb-3">INCLUYE</p>
                    <div className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-violet-400/80 shrink-0 mt-0.5" />
                          <span className="text-xs text-white/70 leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 space-y-3">
            <p className="text-sm text-white/40">
              Sin permanencia · Cancela cuando quieras · ¿Necesitas más? <a href="/enterprise" className="text-violet-400 hover:underline">Habla con ventas</a>
            </p>
            <p className="text-sm text-white/30">
              ¿Comparas con Vambe? <a href="/comparar" className="text-violet-400 hover:underline" data-testid="link-compare-vambe">Mira la comparativa completa →</a>
            </p>
          </div>
        </div>
      </section>

      <section id="verticales" className="py-28 px-6 relative overflow-hidden" data-testid="section-verticals">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.04) 0%, transparent 60%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">PARA TU INDUSTRIA</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white">
              Plantillas listas para tu negocio
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Cada vertical viene con catálogo, flujos y respuestas ya configuradas. Activas, personalizas y arrancas.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {verticalsList.map((v) => (
              <a
                key={v.slug}
                href={`/para/${v.slug}`}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all"
                data-testid={`card-vertical-${v.slug}`}
              >
                <div className="text-3xl mb-3">{v.emoji}</div>
                <h3 className="font-heading font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{v.name}</h3>
                <p className="text-xs text-white/50 leading-snug">{v.desc}</p>
                <p className="text-xs text-violet-400/80 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver plantilla <ChevronRight className="w-3 h-3" />
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="roi" className="py-28 px-6 relative overflow-hidden" data-testid="section-roi">
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">CALCULADORA DE ROI</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white">
              ¿Cuánto ganas con Cappta?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Calcula cuánto ahorras en personal y cuánto ganas en ventas adicionales.
            </p>
          </div>
          <ROICalculator />
        </div>
      </section>


      <section id="extensiones" className="py-28 px-6 relative overflow-hidden" ref={addonsSection.ref as any} data-testid="section-addons">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, hsl(250, 65%, 35%, 0.04) 0%, transparent 55%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">EXTENSIONES Y ADDONS</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-addons-title">
              Potencia Cappta AI con
              <br />
              extensiones premium
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed" data-testid="text-addons-description">
              Añade superpoderes a tu plataforma. Cada extensión se activa al instante sin configuración técnica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addonCatalog.map((addon, index) => {
              const IconComp = addonIconMap[addon.icon] || Package;
              const catColor = addonCategoryColors[addon.category] || "#8b5cf6";
              return (
                <div
                  key={addon.slug}
                  className={`relative rounded-2xl transition-all duration-500 group ${addonsSection.isVisible ? "animate-count-fade" : "opacity-0"}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                  data-testid={`card-addon-${addon.slug}`}
                >
                  <div className="absolute -inset-[1px] rounded-2xl" style={{ background: `linear-gradient(135deg, ${catColor}33 0%, hsl(250, 65%, 40%, 0.15) 100%)` }}>
                    <div className="w-full h-full rounded-2xl bg-[#0c0c0f]" />
                  </div>
                  <div className="relative z-10 glass-card rounded-2xl p-5 h-full flex flex-col" style={{ border: "none" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                        <IconComp className="w-5 h-5" style={{ color: catColor }} />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border" style={{ color: catColor, borderColor: `${catColor}40`, backgroundColor: `${catColor}08` }}>
                        {addonCategoryLabels[addon.category]}
                      </span>
                    </div>
                    {addon.popular && (
                      <div className="mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30" data-testid="badge-popular-addon">
                          ⭐ Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-white/90 mb-1.5 font-heading">{addon.name}</h3>
                    <p className="text-xs text-white/70 leading-relaxed mb-4 flex-1">{addon.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <div>
                        <span className="text-xl font-black" style={{ color: catColor }}>{formatCLP(addon.price)}</span>
                        <span className="text-[10px] text-white/30 ml-1">/mes</span>
                      </div>
                      <a href="/demo">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-white/10 text-white/60 hover:bg-white/[0.05] hover:border-white/20 rounded-lg"
                          data-testid={`button-addon-${addon.slug}`}
                        >
                          Consultar
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-white/25 mt-12">
            Todas las extensiones se activan al instante. Cancela cuando quieras. Sin permanencia.
          </p>
        </div>
      </section>

      <section id="faq" className="py-28 px-6 relative overflow-hidden" ref={faqSection.ref as any} data-testid="section-faq">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-5">PREGUNTAS FRECUENTES</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-5 text-white" data-testid="text-faq-title">
              ¿Tienes dudas? Te las resolvemos
            </h2>
          </div>

          <FAQSection isVisible={faqSection.isVisible} />
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.2) 50%, transparent 100%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, hsl(250, 65%, 25%, 0.12) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <CapptaStackedLogo height={72} className="opacity-80 mx-auto" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-6 leading-tight text-white" data-testid="text-cta-title">
                Empieza a crecer, sin aumentar tu gestión ni tu inversión
              </h2>
              <p className="text-white/60 text-lg mb-10 leading-relaxed">
                Agenda una reunión con nuestro equipo y descubre cómo Cappta AI puede transformar tu operación comercial.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
                <a href="/demo">
                  <Button size="lg" className="text-base px-10 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15" data-testid="button-cta-demo">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Agenda una Reunión
                  </Button>
                </a>
                <a href="#pricing">
                  <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-cta-pricing">
                    Ver Planes
                  </Button>
                </a>
              </div>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {[
                  "Implementación personalizada incluida",
                  "Sin contratos de permanencia",
                  "Soporte técnico dedicado",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/50">
                    <CircleCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-16 px-6 relative" data-testid="footer">
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-14">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <CapptaIcon size={34} />
                <span className="text-lg font-heading font-semibold tracking-[-0.02em]">
                  <span className="text-white/90">Cappta</span>
                  <span className="text-white font-light ml-1">AI</span>
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-5">
                Automatiza tu operación comercial con inteligencia artificial.
                Más ventas, menos gestión.
              </p>
              <p className="text-xs text-white/15">Un producto de Web Maker Chile</p>
            </div>
            <div className="md:col-span-2 md:col-start-6">
              <h4 className="font-bold mb-4 text-xs text-white/60 tracking-[0.15em] uppercase">Producto</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="#features" className="hover:text-white/70 transition-colors" data-testid="link-footer-features">Características</a></li>
                <li><a href="#pricing" className="hover:text-white/70 transition-colors" data-testid="link-footer-pricing">Precios</a></li>
                <li><a href="#extensiones" className="hover:text-white/70 transition-colors" data-testid="link-footer-addons">Extensiones</a></li>
                <li><a href="/demo" className="hover:text-white/70 transition-colors" data-testid="link-footer-demo">Agendar reunión</a></li>
                <li><a href="/guias" className="hover:text-white/70 transition-colors" data-testid="link-footer-guides">Guías</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-xs text-white/60 tracking-[0.15em] uppercase">Integraciones</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="/guias" className="hover:text-white/70 transition-colors" data-testid="link-footer-woo">WooCommerce</a></li>
                <li><a href="/guias" className="hover:text-white/70 transition-colors" data-testid="link-footer-shopify">Shopify</a></li>
                <li><a href="/guias" className="hover:text-white/70 transition-colors" data-testid="link-footer-wordpress">WordPress</a></li>
                <li><a href="/guias" className="hover:text-white/70 transition-colors" data-testid="link-footer-api">API Custom</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-xs text-white/60 tracking-[0.15em] uppercase">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="/privacidad" className="hover:text-white/70 transition-colors" data-testid="link-footer-privacy">Privacidad</a></li>
                <li><a href="/terminos" className="hover:text-white/70 transition-colors" data-testid="link-footer-terms">Términos</a></li>
                <li><a href="mailto:webmakerchile@gmail.com" className="hover:text-white/70 transition-colors" data-testid="link-footer-contact">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Cappta AI by Web Maker Chile
            </p>
            <p className="text-xs text-white/15">
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
