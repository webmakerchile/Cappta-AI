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
} from "lucide-react";
import { SiGoogle, SiApple, SiAmazonwebservices, SiMeta, SiOpenai, SiStripe, SiSlack, SiSalesforce, SiHubspot, SiTwilio, SiNotion, SiGithub, SiZoom, SiWhatsapp, SiTelegram } from "react-icons/si";
import { NexiaLogo, NexiaIcon } from "@/components/NexiaLogo";
import caseAngelGlow from "@assets/image_1772551984490.png";
import caseManaChile from "@assets/image_1772552079372.png";
import caseCjmDigitales from "@assets/image_1772552113098.png";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const features = [
  {
    icon: Brain,
    title: "IA Conversaciónal Avanzada",
    description: "Respuestas inteligentes potenciadas por GPT que entienden contexto, historial y la personalidad de tu marca.",
    iconColor: "#7669E9",
    glow: "rgba(118, 105, 233, 0.15)",
  },
  {
    icon: Globe,
    title: "Configuración Automática",
    description: "Pega la URL de tu sitio web y Nexia AI extrae productos, servicios, contacto y horarios automáticamente. Cero configuración manual.",
    iconColor: "#9678E6",
    glow: "rgba(150, 120, 230, 0.15)",
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
    description: "Instala Nexia AI en tu celular o PC como una app nativa. Funciona offline, recibe notificaciones y responde desde donde estés.",
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
    name: "Starter",
    price: "$79.990",
    period: " CLP/mes",
    description: "Para negocios que están comenzando con IA",
    highlights: [
      { text: "150 conversaciones / mes", bold: true },
      { text: "1 ejecutivo incluido", bold: true },
      { text: "Soporte por email", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Configuración asistida por nuestro equipo",
      "Base de conocimiento y catálogo",
    ],
    supportLine: "Nuestro equipo te ayuda a instalarlo",
    cta: "Agendar Demo",
    highlighted: false,
    tier: "starter" as const,
    borderGradient: "linear-gradient(135deg, hsl(250, 65%, 55%) 0%, hsl(280, 55%, 50%) 50%, hsl(250, 65%, 55%) 100%)",
    bgTint: "rgba(118, 105, 233, 0.03)",
    accentColor: "#7669E9",
    checkBg: "bg-violet-500/10",
    checkColor: "text-violet-400",
  },
  {
    name: "Pro",
    price: "$149.990",
    period: " CLP/mes",
    description: "Para negocios que necesitan escalar",
    highlights: [
      { text: "1.000 conversaciones / mes", bold: true },
      { text: "Hasta 3 ejecutivos con roles", bold: true },
      { text: "Soporte prioritario", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Analíticas avanzadas",
      "WhatsApp disponible (+$14.990/mes)",
    ],
    supportLine: "Un ejecutivo dedicado te acompaña en todo",
    cta: "Agendar Demo",
    highlighted: true,
    tier: "pro" as const,
    borderGradient: "linear-gradient(135deg, hsl(250, 65%, 55%) 0%, hsl(280, 55%, 50%) 25%, hsl(220, 70%, 55%) 50%, hsl(250, 65%, 55%) 75%, hsl(280, 55%, 50%) 100%)",
    bgTint: "rgba(118, 105, 233, 0.04)",
    accentColor: "#9678E6",
    checkBg: "bg-primary/10",
    checkColor: "text-primary",
  },
  {
    name: "Enterprise",
    price: "$349.990",
    period: " CLP/mes",
    description: "Para empresas con alto volumen de atención",
    highlights: [
      { text: "Conversaciones ilimitadas", bold: true },
      { text: "Hasta 10 ejecutivos con roles", bold: true },
      { text: "Soporte prioritario 24/7", bold: true },
    ],
    extras: [
      "Todas las funcionalidades incluidas",
      "Analíticas avanzadas y calificaciones",
      "Onboarding personalizado 1 a 1",
      "Ejecutivo dedicado que te acompaña siempre",
      "WhatsApp integrado incluido",
    ],
    supportLine: "Tu ejecutivo dedicado se encarga de todo",
    cta: "Agendar Demo",
    highlighted: false,
    tier: "enterprise" as const,
    borderGradient: "linear-gradient(135deg, hsl(250, 65%, 60%) 0%, hsl(220, 70%, 55%) 25%, hsl(280, 55%, 55%) 50%, hsl(250, 65%, 60%) 75%, hsl(220, 70%, 55%) 100%)",
    bgTint: "rgba(118, 105, 233, 0.03)",
    accentColor: "#9678E6",
    checkBg: "bg-violet-500/10",
    checkColor: "text-violet-400",
  },
];

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
          <span className="text-[9px] text-white/15">Potenciado por Nexia AI</span>
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

function PreviewTabs() {
  const [activeTab, setActiveTab] = useState<"form" | "widget" | "executive" | "dashboard">("form");
  const [userInteracted, setUserInteracted] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = [
    { id: "form" as const, label: "Formulario Pre-Chat", icon: FileText, desc: "El cliente completa sus datos antes de iniciar el chat" },
    { id: "widget" as const, label: "Chat Widget", icon: MessageSquare, desc: "Widget embebido en tu sitio web — Totalmente personalizable" },
    { id: "executive" as const, label: "Vista Ejecutivo", icon: Bell, desc: "El ejecutivo ve la solicitud, el formulario pre-chat y el historial completo" },
    { id: "dashboard" as const, label: "Panel Completo", icon: Headphones, desc: "Panel de administración donde los ejecutivos gestionan chats en tiempo real" },
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
        <p className="text-sm text-white/35 max-w-lg mx-auto">Explora cada pantalla del sistema: desde el formulario inicial hasta el panel de ejecutivos.</p>
      </div>

      <div className="hidden sm:flex items-center justify-center gap-1.5 sm:gap-2 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[12px] sm:text-sm font-semibold transition-all duration-300 ${activeTab === tab.id ? "bg-[#6200EA]/20 text-[#a78bfa] border border-[#6200EA]/30 shadow-lg shadow-[#6200EA]/10" : "glass-card text-white/40"}`}
            data-testid={`tab-${tab.id}-preview`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sm:hidden flex flex-col items-center mb-6">
        <p className="text-xs font-semibold text-[#a78bfa] mb-3">{tabs[currentIndex].label}</p>
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
        <div className={`transition-all duration-500 ${activeTab === "executive" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <ExecutiveRequestPreview />
        </div>
        <div className={`transition-all duration-500 ${activeTab === "dashboard" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
          <DashboardPreview />
        </div>
      </div>
      <p className="text-center text-[11px] text-white/20 mt-4">{tabs[currentIndex].desc}</p>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl" data-testid="nav-bar">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
        <a href="/" className="flex items-center gap-2.5 group flex-shrink-0" data-testid="link-home">
          <NexiaIcon size={60} className="transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-gradient-brand">Nexia</span> <span className="text-white/50">AI</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-1.5">
          <a href="#features"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-features">Funciones</Button></a>
          <a href="#pricing"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-pricing">Precios</Button></a>
          <a href="#demo"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-demo-schedule-nav">Demo</Button></a>
          <a href="/guias"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="link-guides-nav">Guías</Button></a>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <a href="/login"><Button variant="ghost" size="sm" data-testid="link-login">Iniciar Sesión</Button></a>
          <a href="#demo"><Button size="sm" className="rounded-xl px-4" data-testid="link-register">Agendar Demo <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></a>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/60 hover:text-white transition-colors" data-testid="button-mobile-menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1 animate-dash-fade-up">
          <a href="#features" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Funciones</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Precios</a>
          <a href="#demo" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Agendar Demo</a>
          <a href="/guias" className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors">Guías</a>
          <div className="h-px bg-white/[0.06] my-2" />
          <a href="/login" className="block">
            <Button variant="outline" size="sm" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10" data-testid="link-login-mobile">Iniciar Sesión</Button>
          </a>
          <a href="#demo" className="block mt-2">
            <Button size="sm" className="w-full rounded-xl">Agendar Demo <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
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
              <NexiaIcon size={36} className="rounded-full" />
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


function DemoScheduleForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", howHeard: "", company: "", website: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {}
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto glass-card rounded-3xl p-8 text-center" data-testid="demo-form-success">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">¡Demo agendada!</h3>
        <p className="text-white/50 text-sm">Te contactaremos pronto para confirmar tu demo personalizada.</p>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-violet-500/40 transition-colors";

  return (
    <div className="w-full max-w-md mx-auto" data-testid="demo-schedule-form">
      <div className="glass-card rounded-3xl p-8 border border-violet-500/10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Agenda tu Demo</h3>
          <p className="text-white/40 text-sm">Descubre cómo Nexia AI puede transformar tu negocio</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === 1 ? "bg-primary text-white" : "bg-violet-500/20 text-violet-400"}`}>1</div>
            <div className="w-12 h-px bg-white/10" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === 2 ? "bg-primary text-white" : "bg-violet-500/20 text-violet-400"}`}>2</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4" data-testid="demo-form-step-1">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Nombre completo</label>
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="Tu nombre" className={inputCls} data-testid="input-demo-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Email corporativo</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="tu@empresa.com" className={inputCls} data-testid="input-demo-email" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">¿Cómo nos encontraste?</label>
                <select name="howHeard" value={formData.howHeard} onChange={handleChange} className={`${inputCls} appearance-none`} data-testid="select-demo-howheard">
                  <option value="" className="bg-[#1a1a1a]">Selecciona...</option>
                  <option value="google" className="bg-[#1a1a1a]">Google</option>
                  <option value="social" className="bg-[#1a1a1a]">Redes sociales</option>
                  <option value="referral" className="bg-[#1a1a1a]">Referido</option>
                  <option value="other" className="bg-[#1a1a1a]">Otro</option>
                </select>
              </div>
              <Button type="button" onClick={() => setStep(2)} className="w-full py-5 rounded-2xl text-sm font-bold mt-2" disabled={!formData.name || !formData.email} data-testid="button-demo-next">
                Siguiente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4" data-testid="demo-form-step-2">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Empresa</label>
                <input name="company" value={formData.company} onChange={handleChange} required placeholder="Nombre de tu empresa" className={inputCls} data-testid="input-demo-company" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Sitio web</label>
                <input name="website" value={formData.website} onChange={handleChange} placeholder="https://tu-empresa.com" className={inputCls} data-testid="input-demo-website" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">¿Cómo podemos ayudarte?</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={3} placeholder="Cuéntanos sobre tu negocio..." className={`${inputCls} resize-none`} data-testid="input-demo-message" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-5 rounded-2xl text-sm font-bold border-violet-500/30" data-testid="button-demo-back">Atrás</Button>
                <Button type="submit" disabled={sending || !formData.company} className="flex-1 py-5 rounded-2xl text-sm font-bold shadow-xl shadow-primary/15" data-testid="button-demo-submit">
                  {sending ? "Enviando..." : "Agendar Demo"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function Landing() {
  const statsSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const handoffSection = useInView(0.15);
  const stepsSection = useInView(0.1);
  const pricingSection = useInView(0.1);
  const casesSection = useInView(0.1);

  useEffect(() => {
    if (document.getElementById("nexia-widget")) return;
    const iframe = document.createElement("iframe");
    iframe.id = "nexia-widget";
    iframe.src = "https://www.foxbot.cl/widget?tenantId=6";
    iframe.allow = "microphone";
    let pos = "right";
    function setPos(p: string, state: string, w?: number, h?: number) {
      const s = p === "left" ? "left" : "right";
      const o = p === "left" ? "right" : "left";
      const mobile = window.innerWidth <= 480;
      if (state === "open") {
        iframe.style.cssText = mobile
          ? "position:fixed;bottom:0;left:0;width:100%;height:100%;border:none;z-index:9999;"
          : `position:fixed;bottom:16px;${s}:16px;${o}:auto;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);`;
      } else {
        const cw = (w || 70) + "px";
        const ch = (h || 70) + "px";
        iframe.style.cssText = `position:fixed;bottom:12px;${s}:12px;${o}:auto;width:${cw};height:${ch};border:none;z-index:9999;`;
      }
    }
    setPos(pos, "closed");
    document.body.appendChild(iframe);
    const handler = (e: MessageEvent) => {
      if (!e.data || !e.data.type) return;
      if (e.data.position) pos = e.data.position;
      if (e.data.type === "nexia_position") { pos = e.data.position; setPos(pos, "closed"); }
      if (e.data.type === "open_chat") setPos(pos, "open");
      if (e.data.type === "close_chat") setPos(pos, "closed", e.data.width, e.data.height);
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
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.08) 0%, transparent 60%)" }} />
          <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(220, 70%, 52%, 0.06) 0%, transparent 60%)", animationDelay: "-10s" }} />
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

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] mb-5 sm:mb-7" data-testid="text-hero-title">
              El chatbot que
              <br />
              <span className="text-gradient-brand">vende por ti</span>
              <br />
              <span className="text-white/60">las 24 horas</span>
            </h1>

            <p className="text-base sm:text-lg text-white/50 max-w-lg mb-8 sm:mb-10 leading-relaxed" data-testid="text-hero-description">
              <span className="text-white/80 font-medium">Nexia AI</span> es un agente inteligente que vende y atiende por ti, a escala.
              Y cuando el cliente necesita atención humana, <span className="text-white/80 font-medium">un ejecutivo toma el control</span> sin interrupciones.
              Se adapta a <span className="text-white/80 font-medium">cualquier plataforma</span>: WordPress, Shopify, WooCommerce, Wix y más.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-10">
              <a href="#demo">
                <Button size="lg" className="text-base px-8 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-hero-register">
                  Agendar Demo
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
                { icon: Check, text: "Demo personalizada" },
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

          <div className="flex justify-center lg:block" id="demo">
            <DemoScheduleForm />
          </div>
        </div>
      </section>

      <section className="relative py-16 px-6 overflow-hidden" data-testid="section-platforms">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-xs font-semibold text-white/30 tracking-[0.2em] uppercase px-4">Ecosistema</p>
              <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white/80 text-center">Trabajando con los líderes de la industria</h3>
            <p className="text-sm text-white/25 text-center max-w-md">Integrado con las plataformas que impulsan tu negocio</p>
          </div>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]" data-testid="platform-logos">
            <div className="flex gap-10 animate-marquee">
              {[
                { Icon: SiGoogle, name: "Google" },
                { Icon: SiApple, name: "Apple" },
                { Icon: SiAmazonwebservices, name: "AWS" },
                { Icon: SiMeta, name: "Meta" },
                { Icon: SiOpenai, name: "OpenAI" },
                { Icon: SiStripe, name: "Stripe" },
                { Icon: SiSlack, name: "Slack" },
                { Icon: SiSalesforce, name: "Salesforce" },
                { Icon: SiHubspot, name: "HubSpot" },
                { Icon: SiTwilio, name: "Twilio" },
                { Icon: SiNotion, name: "Notion" },
                { Icon: SiGithub, name: "GitHub" },
                { Icon: SiZoom, name: "Zoom" },
                { Icon: SiWhatsapp, name: "WhatsApp" },
                { Icon: SiTelegram, name: "Telegram" },
                { Icon: SiGoogle, name: "Google" },
                { Icon: SiApple, name: "Apple" },
                { Icon: SiAmazonwebservices, name: "AWS" },
                { Icon: SiMeta, name: "Meta" },
                { Icon: SiOpenai, name: "OpenAI" },
                { Icon: SiStripe, name: "Stripe" },
                { Icon: SiSlack, name: "Slack" },
                { Icon: SiSalesforce, name: "Salesforce" },
                { Icon: SiHubspot, name: "HubSpot" },
                { Icon: SiTwilio, name: "Twilio" },
                { Icon: SiNotion, name: "Notion" },
                { Icon: SiGithub, name: "GitHub" },
                { Icon: SiZoom, name: "Zoom" },
                { Icon: SiWhatsapp, name: "WhatsApp" },
                { Icon: SiTelegram, name: "Telegram" },
              ].map(({ Icon, name }, index) => (
                <div key={`${name}-${index}`} className="flex flex-col items-center gap-2.5 group cursor-default flex-shrink-0">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl glass-card glass-card-hover transition-all duration-500">
                    <Icon className="w-7 h-7 text-white/30 group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <span className="text-[11px] text-white/25 font-medium group-hover:text-white/50 transition-colors duration-500">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section className="py-24 px-6 relative overflow-hidden" ref={statsSection.ref as any} data-testid="section-stats">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: "24/7", label: "Disponibilidad", icon: Clock, desc: "Tu bot nunca descansa", color: "#7669E9" },
              { value: "<2s", label: "Respuesta", icon: Zap, desc: "Velocidad de IA", color: "#a78bfa" },
              { value: "5min", label: "Configuración", icon: TrendingUp, desc: "Sin conocimiento técnico", color: "#3b82f6" },
              { value: "+90%", label: "Consultas resueltas", icon: Users, desc: "Sin intervención humana", color: "#a855f7" },
            ].map(({ value, label, icon: Icon, desc, color }, i) => (
              <div key={label} className="group" data-testid={`stat-${label}`}>
                <div className="rounded-2xl glass-card glass-card-hover p-6 text-center transition-all duration-500 h-full" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mx-auto mb-4" style={{ backgroundColor: hexToRgba(color, 0.08) }}>
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
          <div className="absolute top-0 right-[-200px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.05) 0%, transparent 60%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-0 left-[-200px] w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(220, 70%, 52%, 0.04) 0%, transparent 60%)", animationDelay: "-15s" }} />
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
              <span className="text-gradient-brand">automatizar tus ventas</span>
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
              <span className="text-gradient-brand">cierra la venta</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              Nexia AI resuelve el 90% de las consultas automáticamente. Pero cuando tu cliente necesita atención humana,
              un ejecutivo toma el control del chat <span className="text-white/60 font-medium">en tiempo real</span>, sin que el cliente se de cuenta del cambio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: "1",
                title: "El bot atiende",
                desc: "Nexia AI responde al instante con IA: resuelve dudas, muestra productos y guia al cliente las 24 horas.",
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
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: hexToRgba(item.color, 0.08) }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ color: item.color, backgroundColor: hexToRgba(item.color, 0.06), border: `1px solid ${hexToRgba(item.color, 0.15)}` }}>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <MousePointerClick className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">LISTO EN MINUTOS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-how-title">
              <span className="text-gradient-brand">3 pasos</span> y listo
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
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
                  desc: "Agrega una línea de código a tu sitio web y Nexia AI atiende clientes al instante.",
                  icon: Code,
                  color: "#a855f7",
                },
              ].map((item, index) => (
                <div key={item.step} className={`group ${stepsSection.isVisible ? "animate-count-fade" : "opacity-0"}`} style={{ animationDelay: `${index * 150}ms` }} data-testid={`step-${index}`}>
                  <div className="rounded-2xl glass-card glass-card-hover p-8 h-full text-center transition-all duration-500">
                    <div className="relative mx-auto mb-6">
                      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110" style={{ backgroundColor: hexToRgba(item.color, 0.06), boxShadow: `0 0 40px ${hexToRgba(item.color, 0.03)}` }}>
                        <item.icon className="w-9 h-9" style={{ color: item.color }} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-background flex items-center justify-center text-xs font-black" style={{ color: item.color, border: `1px solid ${hexToRgba(item.color, 0.19)}` }}>
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

      <section id="casos" className="py-28 px-6 relative overflow-hidden" ref={casesSection.ref as any} data-testid="section-cases">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.15) 50%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.1) 50%, transparent 100%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Trophy className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span className="text-xs font-semibold text-[#a78bfa] tracking-wide">CASOS DE ÉXITO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-cases-title">
              Empresas que <span className="text-gradient-brand">ya confían en Nexia AI</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              Negocios reales que automatizaron su atención y ganaron más tiempo para lo que importa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Angel Glow",
                url: "angelglow.cl",
                href: "https://www.angelglow.cl/",
                image: caseAngelGlow,
                description: "Tienda de cosméticos que aumentó sus ventas atendiendo consultas de productos y precios 24/7 con IA.",
                color: "#f97316",
                industry: "E-commerce / Belleza",
              },
              {
                name: "Iglesia Mana Chile",
                url: "manachile.cl",
                href: "https://manachile.cl/inicio",
                image: caseManaChile,
                description: "Comunidad que ganó productividad al automatizar la atención de sus miembros, liberando tiempo para lo esencial.",
                color: "#dc2626",
                industry: "Comunidad / Servicios",
              },
              {
                name: "CJM Digitales",
                url: "cjmdigitales.cl",
                href: "https://cjmdigitales.cl/",
                image: caseCjmDigitales,
                description: "Empresa tech que redujo tiempos de soporte con IA y transferencia a agentes humanos cuando es necesario.",
                color: "#8b5cf6",
                industry: "Tecnología / Soporte",
              },
            ].map((caseItem, index) => (
              <a
                key={caseItem.name}
                href={caseItem.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block ${casesSection.isVisible ? "animate-count-fade" : "opacity-0"}`}
                style={{ animationDelay: `${index * 150}ms` }}
                data-testid={`case-${index}`}
              >
                <div className="rounded-2xl glass-card glass-card-hover overflow-hidden h-full transition-all duration-500 hover:scale-[1.02]">
                  <div className="relative overflow-hidden" style={{ height: "340px" }}>
                    <img
                      src={caseItem.image}
                      alt={`${caseItem.name} - Nexia AI en acción`}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide text-white/90" style={{ backgroundColor: hexToRgba(caseItem.color, 0.85), backdropFilter: "blur(8px)" }}>
                        {caseItem.industry}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 -mt-8 relative z-10">
                    <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{caseItem.name}</h3>
                    <p className="text-xs font-medium mb-3" style={{ color: caseItem.color }}>{caseItem.url}</p>
                    <p className="text-white/40 text-sm leading-relaxed">{caseItem.description}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Visitar sitio</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-28 px-6 relative overflow-hidden" ref={pricingSection.ref as any} data-testid="section-pricing">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.05) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide">PRECIOS TRANSPARENTES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-pricing-title">
              Un plan para <span className="text-gradient-brand">cada negocio</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed" data-testid="text-pricing-description">
              Planes flexibles que se adaptan a tu negocio. Sin contratos de permanencia.
            </p>
          </div>

          <div className={`mb-14 transition-all duration-700 ${pricingSection.isVisible ? "animate-count-fade" : "opacity-0"}`} data-testid="shared-features-block">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute -inset-[1px] rounded-2xl" style={{ background: "linear-gradient(135deg, hsl(250, 65%, 40%, 0.2) 0%, hsl(160, 60%, 35%, 0.1) 50%, hsl(250, 65%, 40%, 0.2) 100%)" }} />
              <div className="relative glass-card rounded-2xl p-6 sm:p-8" style={{ border: "none" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
                    <CircleCheck className="w-4.5 h-4.5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/90">Todos los planes incluyen</h3>
                    <p className="text-xs text-white/35">Sin importar el plan que elijas, tienes acceso a todo</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {sharedFeatures.map((feat) => (
                    <div key={feat.text} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <feat.icon className="w-4 h-4 text-violet-400/70 shrink-0" />
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
                  {plan.tier === "starter" && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(250, 65%, 32%) 0%, hsl(280, 55%, 28%) 100%)", color: "white" }}>
                        <Zap className="w-3 h-3" />
                        STARTER
                      </div>
                    </div>
                  )}

                  {plan.highlighted && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(250, 65%, 32%) 0%, hsl(280, 55%, 28%) 100%)", color: "white" }}>
                        <Star className="w-3 h-3" />
                        MÁS POPULAR
                      </div>
                    </div>
                  )}

                  {plan.tier === "enterprise" && (
                    <div className="flex justify-center pt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, hsl(250, 65%, 42%) 0%, hsl(280, 55%, 45%) 100%)", color: "white" }}>
                        <Crown className="w-3 h-3" />
                        ENTERPRISE
                      </div>
                    </div>
                  )}

                  <div className="text-center px-7 pt-7 pb-2">
                    <h3 className="text-xl font-bold mb-1" data-testid={`text-plan-name-${index}`}>
                      {plan.tier === "starter" && <span className="text-gradient-brand">Starter</span>}
                      {plan.tier === "pro" && <><span className="text-gradient-brand">Pro</span></>}
                      {plan.tier === "enterprise" && <span style={{ background: "linear-gradient(135deg, #a78bfa, #7669E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Enterprise</span>}
                    </h3>
                    <p className="text-sm text-white/35 mb-6">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-5xl font-black" style={{ color: plan.accentColor }} data-testid={`text-plan-price-${index}`}>{plan.price}</span>
                      <span className="text-white/35 text-sm">{plan.period}</span>
                    </div>
                    <div className="mb-4 inline-flex flex-col items-center px-3 py-1.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-3 h-3" />
                        Agenda tu demo
                      </div>
                    </div>
                  </div>

                  <div className="px-7 pb-4 flex-1">
                    <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, transparent, ${hexToRgba(plan.accentColor, 0.2)}, transparent)` }} />

                    <div className="space-y-3 mb-5">
                      {plan.highlights.map((h) => (
                        <div key={h.text} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-lg" style={{ backgroundColor: hexToRgba(plan.accentColor, 0.1) }}>
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

                    <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, transparent, ${hexToRgba(plan.accentColor, 0.08)}, transparent)` }} />

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

                    <div className="mt-5 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed" style={{ borderColor: hexToRgba(plan.accentColor, 0.15), backgroundColor: hexToRgba(plan.accentColor, 0.025) }}>
                      <Handshake className="w-4 h-4 shrink-0" style={{ color: plan.accentColor }} />
                      <span className="text-xs font-medium" style={{ color: hexToRgba(plan.accentColor, 0.8) }}>{plan.supportLine}</span>
                    </div>
                  </div>

                  <div className="px-7 pb-7 pt-4">
                    <a href="#demo" className="block">
                      {plan.tier === "starter" && (
                        <Button
                          className="w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50"
                          variant="outline"
                          data-testid={`button-plan-cta-${index}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-1.5" />
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
                          className="w-full py-5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-violet-500/15 border-0 text-white"
                          style={{ background: "linear-gradient(135deg, hsl(250, 65%, 42%) 0%, hsl(280, 55%, 40%) 100%)" }}
                          data-testid={`button-plan-cta-${index}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      )}
                      <p className="text-[9px] text-white/25 text-center mt-2">No se admiten reembolsos. <a href="/terminos" className="underline hover:text-white/40">Ver términos</a></p>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-white/25 mt-12">
            Todas las funcionalidades incluidas en cada plan. Solo cambia la escala. Sin contratos de permanencia.
          </p>
        </div>
      </section>


      <section className="py-28 px-6 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(118,105,233,0.2) 50%, transparent 100%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(250, 65%, 40%, 0.06) 0%, transparent 50%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-10">
            <div className="w-28 h-28 rounded-3xl glass-card flex items-center justify-center mx-auto animate-float" style={{ boxShadow: "0 0 60px rgba(118, 105, 233, 0.1)" }}>
              <NexiaIcon size={80} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(250, 65%, 32%) 0%, hsl(280, 55%, 28%) 100%)" }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight" data-testid="text-cta-title">
            Dale a tu negocio el
            <br />
            <span className="text-gradient-brand">soporte que merece</span>
          </h2>
          <p className="text-white/40 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Negocios de todos los tamaños ya usan Nexia AI para vender más y atender mejor.
            Agenda tu demo hoy.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#demo">
              <Button size="lg" className="text-base px-10 py-6 rounded-2xl font-bold shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" data-testid="button-cta-register">
                Agendar Demo
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
            Agenda una demo personalizada y descubre cómo Nexia AI puede transformar tu negocio.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-16 px-6 relative" data-testid="footer">
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <NexiaIcon size={40} />
                <span className="text-xl font-extrabold">
                  <span className="text-gradient-brand">Nexia</span> <span className="text-white/50">AI</span>
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
                <li><a href="/guias" className="hover:text-primary transition-colors" data-testid="link-footer-woo">WooCommerce</a></li>
                <li><a href="/guias" className="hover:text-primary transition-colors" data-testid="link-footer-shopify">Shopify</a></li>
                <li><a href="/guias" className="hover:text-primary transition-colors" data-testid="link-footer-wordpress">WordPress</a></li>
                <li><a href="/guias" className="hover:text-primary transition-colors" data-testid="link-footer-api">API Custom</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-white/60 tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><a href="/privacidad" className="hover:text-primary transition-colors" data-testid="link-footer-privacy">Privacidad</a></li>
                <li><a href="/terminos" className="hover:text-primary transition-colors" data-testid="link-footer-terms">Términos de Uso</a></li>
                <li><a href="mailto:webmakerchile@gmail.com" className="hover:text-primary transition-colors" data-testid="link-footer-contact">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] mt-12 pt-8 text-center text-sm text-white/20" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} Nexia AI by Web Maker Chile. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
