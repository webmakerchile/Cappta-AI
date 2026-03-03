import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Zap,
  Tag,
  Package,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  Send,
  Plus,
  Trash2,
  X,
  Menu,
  Loader2,
  Clock,
  User,
  Users,
  ShieldCheck,
  ShieldOff,
  XCircle,
  Pencil,
  Check,
  Bot,
  Star,
  Image as ImageIcon,
  Globe,
  FileUp,
  Sparkles,
  Replace,
  PlusCircle,
  ShoppingBag,
  Wand2,
  Crown,
  Shield,
  UserCog,
  Eye,
  EyeOff,
  Copy,
  Download,
} from "lucide-react";
import { GuidesPanel } from "./Guides";
import { io, Socket } from "socket.io-client";
import type { Tenant } from "@shared/schema";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

type TenantProfile = Omit<Tenant, "passwordHash">;

interface AgentProfile {
  id: number;
  tenantId: number;
  email: string;
  displayName: string;
  role: "owner" | "admin" | "ejecutivo";
  color: string;
  active: number;
  companyName: string;
  plan: string;
  isAgent: boolean;
}

function useAuth() {
  const token = localStorage.getItem("tenant_token");

  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery<TenantProfile>({
    queryKey: ["/api/tenants/me"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/tenants/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    },
  });

  const { data: agentProfile, isLoading: agentLoading } = useQuery<AgentProfile>({
    queryKey: ["/api/tenant-panel/agents/me"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/tenant-panel/agents/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  useEffect(() => {
    if (!token || tenantError) {
      window.location.href = "/login";
    }
  }, [token, tenantError]);

  const isLoading = tenantLoading || agentLoading;
  const role = agentProfile?.role || "owner";
  const isAgent = agentProfile?.isAgent || false;

  return { tenant, isLoading, token, agentProfile, role, isAgent };
}

function tenantFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem("tenant_token") || "";
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

function formatDateTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function getAvatarColor(name: string): string {
  const colors = ["#E53935","#D81B60","#8E24AA","#5E35B1","#3949AB","#1E88E5","#039BE5","#00ACC1","#00897B","#43A047","#7CB342","#FB8C00","#F4511E"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}
          style={{ width: size, height: size }}
        />
      ))}
    </span>
  );
}

interface SessionSummary {
  sessionId: string;
  userName: string;
  userEmail: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string | null;
  status: string;
  tags: string[];
  problemType: string | null;
  gameName: string | null;
  lastMessageContent: string | null;
  lastMessageSender: string | null;
  adminActive: boolean;
  assignedToName: string | null;
  assignedToColor: string | null;
  sessionRating: number | null;
  ratingComment: string | null;
}

interface ChatMessage {
  id: number;
  sessionId: string;
  userEmail: string;
  userName: string;
  sender: string;
  content: string;
  imageUrl: string | null;
  adminName: string | null;
  adminColor: string | null;
  timestamp: string;
}

interface CannedResponse {
  id: number;
  shortcut: string;
  content: string;
}

type CustomTag = string;

interface ProductItem {
  id: number;
  name: string;
  price: string | null;
  productUrl: string | null;
  category: string;
  availability: string;
  description: string | null;
  badgeLabel: string | null;
}

interface KnowledgeEntry {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  status: string;
}

interface TenantSettings {
  aiEnabled: number;
  businessHoursConfig: any;
  botContext: string;
}

type TabId = "chats" | "atajos" | "etiquetas" | "productos" | "conocimiento" | "entrenar" | "guías" | "equipo" | "ajustes";

const SIDEBAR_ITEMS: { id: TabId; label: string; icon: any; minRole?: "owner" | "admin" }[] = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "entrenar", label: "Entrenar Bot", icon: Bot, minRole: "admin" },
  { id: "atajos", label: "Atajos", icon: Zap },
  { id: "etiquetas", label: "Etiquetas", icon: Tag },
  { id: "productos", label: "Productos", icon: Package, minRole: "admin" },
  { id: "conocimiento", label: "Conocimiento", icon: BookOpen },
  { id: "equipo", label: "Equipo", icon: Users, minRole: "admin" },
  { id: "guías", label: "Guías", icon: FileText },
  { id: "ajustes", label: "Ajustes", icon: Settings, minRole: "admin" },
];

const notifSound = typeof window !== "undefined" ? new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1mZmB0eHqEgn16gIJ6bmBjaF9pfHmIiIR8fnyAcmFgZmFqfHuJhYF5e3t7cGBeY19tfXyMh4R7ent9c2JeYl5ufnyNh4Z6ent+c2NeYl5ufXuMhYV5ent+c2NeYl5vfnuMhYV5ent+c2NeYl5vfnuMhYV5ent+c2NeYl5vfnuMhYV5ent+c2NeYl5vfnuMhYV5ent+c2NeYl5vfnuLhIV5e3t+c2NeYl5vfnuLhIV5e3t+cmNeYV5vfnuLhIR5e3t/cmNeYV5vfnqLhIR5e3t/cmNeYV5wfnqLhIR5fHt/cmNeYV5wfnqKg4R5fHt/cmNeYV5wfnqKg4R5fHuAcmNeYV5wf3qKg4R5fHuAcmNeYV5wf3qKg4N5fHuAcmNeYF5wf3qKg4N5fHuAcmNeYF5xf3qKg4N5fHuAcmNeYF5xf3qKg4N5fXuAcmNeYF5xf3qKg4N5fXuAcmNeYF5xf3qJg4N5fXuAcmNeYF5xf3qJg4N5fXuAcmNeYF5xf3qJg4N5fXuBcmNeYF5xf3qJg4N5fXuBcmReYF5xf3mJgoN5fXuBcmReYF5xgHmJgoN5fXyBcmReYF5xgHmJgoN5fXyBcmReYF5xgHmJgoN5fXyBcmReX15xgHmJgoN5fnyBcmReX15ygHmJgoJ5fnyBcmReX15ygHmIgoJ5fnyBcmReX15ygHmIgoJ5fnyBcWReX15ygHmIgoJ4fnyBcWReX15ygHiIgoJ4fnyBcWReX15ygHiIgoJ4fn2BcWReX15ygHiIgoJ4fn2BcWReX15ygXiIgoJ4fn2BcWReX15ygXiIgYJ4fn2BcWReX15ygXiIgYJ4fn2CcWReX15ygXiIgYJ4fn2CcWReX15ygXiIgYJ4fn2CcWReX15ygXiHgYJ4fn2CcWReX15ygXiHgYJ4f32CcWReX15ygXiHgYJ4f32CcWReX15ygXiHgYF4f32CcWReX15ygXiHgYF4f32CcWReX15ygXiHgYF4f32CcGReX15ygXiHgYF4f32CcGReX11zgXiHgYF4f32CcGReX11zgXiHgYF4f32CcGReX11zgXiHgYF3f32CcGReX11zgXiHgYF3f32CcGReX11zgXiHgYF3f32CcGReX11zgniHgYF3f32CcGReX11zgniHgIF3f32CcGReX11zgniGgIF3f32CcGReX11zgniGgIF3f36CcGReX11zgniGgIF3f36CcGReX11zgniGgIF3gH6CcGReX11zgniGgIF3gH6CcGReX11zgniGgIF3gH6Cb2RdX11zgniGgIF3gH6Cb2RdX11zgniGgIB3gH6Cb2RdX11z") : null;

type AgentFilter = "all" | "bot" | "ejecutivo";
type AssignFilter = "all" | "pendientes" | "mis";

function ChatsTab({ token, tenant }: { token: string; tenant: TenantProfile }) {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [correctionModal, setCorrectionModal] = useState<{ msgId: number; originalAnswer: string; userQuestion: string } | null>(null);
  const [correctionAnswer, setCorrectionAnswer] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<SessionSummary[]>({
    queryKey: ["/api/tenant-panel/sessions", statusFilter],
    queryFn: async () => {
      const res = await tenantFetch(`/api/tenant-panel/sessions?status=${statusFilter}`);
      if (!res.ok) throw new Error("Error loading sessions");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/tenant-panel/sessions", selectedSession, "messages"],
    queryFn: async () => {
      if (!selectedSession) return [];
      const res = await tenantFetch(`/api/tenant-panel/sessions/${selectedSession}/messages`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!selectedSession,
    refetchInterval: 5000,
  });

  const { data: cannedResponses = [] } = useQuery<CannedResponse[]>({
    queryKey: ["/api/tenant-panel/canned-responses"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/canned-responses");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/tenant-panel/tags"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/tags");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: products = [] } = useQuery<ProductItem[]>({
    queryKey: ["/api/tenant-panel/products"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/products");
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      auth: { role: "tenant" },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_tenant_room", { token });
    });

    socket.on("tenant_new_message", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
      if (data.sessionId === selectedSession) {
        queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions", selectedSession, "messages"] });
      }
      if (data.sessionId !== selectedSession && notifSound) {
        try { notifSound.currentTime = 0; notifSound.play().catch(() => {}); } catch {}
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    if (selectedSession) {
      tenantFetch(`/api/tenant-panel/sessions/${selectedSession}/read`, { method: "POST" }).catch(() => {});
    }
  }, [selectedSession]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    setMobileShowChat(true);
    setShowChatSearch(false);
    setChatSearchQuery("");
  };

  const handleReply = async () => {
    if ((!replyText.trim() && !imagePreview) || !selectedSession || sending) return;
    setSending(true);
    try {
      const body: any = { content: replyText.trim() };
      if (imagePreview) body.imageUrl = imagePreview;
      const res = await tenantFetch(`/api/tenant-panel/sessions/${selectedSession}/reply`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setReplyText("");
        setImagePreview(null);
        queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions", selectedSession, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
    }
    setSending(false);
  };

  const handleClaim = async (sessionId: string) => {
    await tenantFetch(`/api/tenant-panel/sessions/${sessionId}/claim`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
    toast({ title: "Sesión tomada", description: "Ahora controlas esta conversación" });
  };

  const handleUnclaim = async (sessionId: string) => {
    await tenantFetch(`/api/tenant-panel/sessions/${sessionId}/unclaim`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
    toast({ title: "Sesión liberada", description: "El bot retomara la conversación" });
  };

  const handleCloseSession = async (sessionId: string) => {
    await tenantFetch(`/api/tenant-panel/sessions/${sessionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
    toast({ title: "Sesión cerrada" });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
    await tenantFetch(`/api/tenant-panel/sessions/${sessionId}`, { method: "DELETE" });
    if (selectedSession === sessionId) {
      setSelectedSession(null);
      setMobileShowChat(false);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
    toast({ title: "Sesión eliminada" });
  };

  const handleCorrection = async () => {
    if (!correctionModal || !correctionAnswer.trim()) return;
    try {
      const res = await tenantFetch("/api/tenant-panel/knowledge", {
        method: "POST",
        body: JSON.stringify({
          question: correctionModal.userQuestion,
          answer: correctionAnswer.trim(),
          category: "general",
          keywords: [],
          status: "approved",
        }),
      });
      if (res.ok) {
        toast({ title: "Corrección guardada", description: "El bot aprendió de esta corrección" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge"] });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
    setCorrectionModal(null);
    setCorrectionAnswer("");
  };

  const openCorrection = (msg: ChatMessage) => {
    const idx = messages.findIndex((m) => m.id === msg.id);
    let userQuestion = "";
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].sender === "user") {
        userQuestion = messages[i].content.replace(/\{\{.*?\}\}/g, "").trim();
        break;
      }
    }
    const cleanAnswer = msg.content.replace(/\{\{QUICK_REPLIES:.*?\}\}/g, "").replace(/\{\{SHOW_RATING\}\}/g, "").trim();
    setCorrectionModal({ msgId: msg.id, originalAnswer: cleanAnswer, userQuestion });
    setCorrectionAnswer(cleanAnswer);
  };

  const handleSlashSelect = (content: string) => {
    setReplyText(content);
    setShowSlashMenu(false);
  };

  const handleReplyChange = (value: string) => {
    setReplyText(value);
    if (value === "/") {
      setShowSlashMenu(true);
    } else if (!value.startsWith("/")) {
      setShowSlashMenu(false);
    }
  };

  const handleUpdateTags = async (sessionId: string, tags: string[]) => {
    await tenantFetch(`/api/tenant-panel/sessions/${sessionId}/tags`, {
      method: "PATCH",
      body: JSON.stringify({ tags }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] });
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("tenant_token") || "";
      const res = await fetch("/api/uploads/direct", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImagePreview(data.url || data.path);
      } else {
        toast({ title: "Error al subir imagen", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    }
  };

  const handleSendProduct = (product: ProductItem) => {
    const msg = `${product.name}${product.price ? ` - $${product.price}` : ""}${product.productUrl ? `\n${product.productUrl}` : ""}`;
    setReplyText(msg);
    setShowProductSearch(false);
  };

  const filteredSessions = sessions.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.userName.toLowerCase().includes(q) && !s.userEmail.toLowerCase().includes(q)) return false;
    }
    if (agentFilter === "bot" && s.adminActive) return false;
    if (agentFilter === "ejecutivo" && !s.adminActive) return false;
    if (assignFilter === "pendientes" && s.assignedToName) return false;
    if (assignFilter === "mis" && !s.adminActive) return false;
    return true;
  });

  const selectedSessionData = sessions.find((s) => s.sessionId === selectedSession);

  const totalUnread = sessions.reduce((acc, s) => acc + (s.unreadCount || 0), 0);

  const filteredProducts = products.filter((p) => {
    if (!productSearchQuery) return true;
    return p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
  });

  const highlightedMessages = chatSearchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : [];

  const firstPreChatMessage = messages.find((m) => m.sender === "user");

  return (
    <div className="flex h-full">
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/[0.06] flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b border-white/[0.06] space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              data-testid="input-search-sessions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en todos los chats..."
              className="pl-9 bg-white/[0.04] border-white/[0.08]"
            />
          </div>
          <div className="flex items-center gap-1">
            {(["all", "active", "closed"] as const).map((f) => (
              <button
                key={f}
                data-testid={`button-filter-${f}`}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${statusFilter === f ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Activos" : "Cerrados"}
                {f === "all" && totalUnread > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{totalUnread}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {([
              { id: "all" as AgentFilter, label: "Todo" },
              { id: "bot" as AgentFilter, label: "Bot" },
              { id: "ejecutivo" as AgentFilter, label: "Ejecutivo" },
            ]).map((f) => (
              <button
                key={f.id}
                data-testid={`button-agent-filter-${f.id}`}
                onClick={() => setAgentFilter(f.id)}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${agentFilter === f.id
                  ? f.id === "bot" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : f.id === "ejecutivo" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                  : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
            {([
              { id: "all" as AssignFilter, label: "Todo" },
              { id: "pendientes" as AssignFilter, label: "Pendientes" },
              { id: "mis" as AssignFilter, label: "Mis Chats" },
            ]).map((f) => (
              <button
                key={f.id}
                data-testid={`button-assign-filter-${f.id}`}
                onClick={() => setAssignFilter(f.id)}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${assignFilter === f.id
                  ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                  : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm" data-testid="text-no-sessions">No hay sesiones</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.sessionId}
                role="button"
                tabIndex={0}
                data-testid={`session-card-${session.sessionId}`}
                onClick={() => handleSelectSession(session.sessionId)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectSession(session.sessionId); } }}
                className={`w-full text-left p-3 border-l-[3px] border-b border-b-white/[0.04] transition-colors cursor-pointer ${selectedSession === session.sessionId ? "bg-[#10b981]/10 border-l-[#10b981]" : "hover:bg-white/[0.04] border-l-transparent"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: getAvatarColor(session.userName || session.sessionId) }}>
                      {(session.userName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111] ${session.status === "active" ? "bg-emerald-400" : "bg-white/20"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium text-white truncate">{session.userName || "Sin nombre"}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {session.unreadCount > 0 && (
                          <span data-testid={`badge-unread-${session.sessionId}`} className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">{session.unreadCount > 99 ? "99+" : session.unreadCount}</span>
                        )}
                        {session.status === "active" && (
                          <button
                            data-testid={`button-card-close-${session.sessionId}`}
                            onClick={(e) => { e.stopPropagation(); if (window.confirm("¿Cerrar esta sesión?")) handleCloseSession(session.sessionId); }}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-amber-500/20 text-white/20 hover:text-amber-400 transition-colors"
                            title="Cerrar sesión"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          data-testid={`button-card-delete-${session.sessionId}`}
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.sessionId); }}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
                          title="Eliminar sesión"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{session.userEmail}</p>
                    {session.lastMessageContent && (
                      <p className="text-[11px] text-white/30 truncate mt-0.5">
                        {session.lastMessageSender === "admin" ? "Tu: " : session.lastMessageSender === "bot" ? "Bot: " : ""}
                        {session.lastMessageContent.substring(0, 60)}
                      </p>
                    )}
                  </div>
                </div>
                {(session.problemType || session.gameName || (session.tags && session.tags.length > 0)) && (
                  <div className="flex items-center gap-1 mt-1.5 pl-11 flex-wrap">
                    {session.problemType && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">{session.problemType}</span>
                    )}
                    {session.gameName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-0.5">
                        <Package className="w-2 h-2" />
                        {session.gameName}
                      </span>
                    )}
                    {session.tags?.map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 font-medium">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 pl-11 text-[10px] text-white/25 flex-wrap">
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{session.messageCount}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatDateTime(session.lastMessage)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${session.adminActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/15 text-blue-400"}`}>
                    {session.adminActive ? "Ejecutivo" : "Bot"}
                  </span>
                  {session.assignedToName && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
                      style={{
                        backgroundColor: `${session.assignedToColor || "#10b981"}20`,
                        color: session.assignedToColor || "#10b981",
                        borderColor: `${session.assignedToColor || "#10b981"}40`,
                      }}
                      data-testid={`badge-assigned-${session.sessionId}`}
                    >
                      {session.assignedToName}
                    </span>
                  )}
                  {session.status === "closed" && <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-[9px]">Cerrado</span>}
                  {session.sessionRating && (
                    <span className="flex items-center gap-0.5">
                      <StarRating rating={session.sessionRating} size={10} />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {selectedSession && selectedSessionData ? (
          <>
            <div className="flex items-center justify-between gap-2 p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  data-testid="button-back-to-list"
                  onClick={() => { setMobileShowChat(false); }}
                  className="md:hidden w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.04]"
                >
                  <ArrowLeft className="w-4 h-4 text-white/60" />
                </button>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(selectedSessionData.userName) }}>
                  {(selectedSessionData.userName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedSessionData.userName}</p>
                  <p className="text-[11px] text-white/40 truncate">{selectedSessionData.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {selectedSessionData.adminActive ? (
                  <Button data-testid="button-unclaim" size="sm" variant="outline" onClick={() => handleUnclaim(selectedSession)} className="text-xs border-white/[0.08] h-7 px-2">
                    <ShieldOff className="w-3 h-3 mr-1" />Liberar
                  </Button>
                ) : (
                  <Button data-testid="button-claim" size="sm" variant="outline" onClick={() => handleClaim(selectedSession)} className="text-xs border-emerald-500/30 text-emerald-400 h-7 px-2">
                    <ShieldCheck className="w-3 h-3 mr-1" />Entrar
                  </Button>
                )}
                {selectedSessionData.sessionRating && (
                  <div className="flex items-center px-1" data-testid="chat-rating-display">
                    <StarRating rating={selectedSessionData.sessionRating} size={12} />
                  </div>
                )}
                <button
                  data-testid="button-chat-search"
                  onClick={() => { setShowChatSearch(!showChatSearch); setChatSearchQuery(""); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/40"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                {selectedSessionData.status === "active" && (
                  <Button data-testid="button-close-session" size="sm" variant="outline" onClick={() => handleCloseSession(selectedSession)} className="text-xs border-white/[0.08] h-7 px-2">
                    <XCircle className="w-3 h-3 mr-1" />Cerrar
                  </Button>
                )}
                <Button data-testid="button-delete-session" size="sm" variant="outline" onClick={() => handleDeleteSession(selectedSession)} className="text-xs border-red-500/30 text-red-400 h-7 px-2">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {showChatSearch && (
              <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <Input
                    data-testid="input-chat-search"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Buscar en esta conversación..."
                    className="pl-8 h-8 text-xs bg-white/[0.04] border-white/[0.08]"
                    autoFocus
                  />
                  {chatSearchQuery && highlightedMessages.length > 0 && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30">{highlightedMessages.length} resultados</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.01] flex-wrap">
              <Select value={selectedSessionData.status} onValueChange={(val) => {
                tenantFetch(`/api/tenant-panel/sessions/${selectedSession}/status`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: val }),
                }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/sessions"] }));
              }}>
                <SelectTrigger data-testid="select-session-status" className="w-auto h-6 text-[10px] bg-white/[0.04] border-white/[0.06] px-2 gap-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <button
                  data-testid="button-add-tag"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-dashed border-white/[0.12] text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />Etiqueta
                </button>
                {showTagDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-xl z-20 min-w-[160px] max-h-48 overflow-y-auto" data-testid="tag-dropdown">
                    {allTags.length === 0 ? (
                      <p className="text-xs text-white/30 p-3">No hay etiquetas</p>
                    ) : (
                      allTags.map((tag) => {
                        const isActive = selectedSessionData.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            data-testid={`tag-option-${tag}`}
                            onClick={() => {
                              const newTags = isActive
                                ? (selectedSessionData.tags || []).filter((t) => t !== tag)
                                : [...(selectedSessionData.tags || []), tag];
                              handleUpdateTags(selectedSession, newTags);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] flex items-center justify-between"
                          >
                            <span className="text-white/70">{tag}</span>
                            {isActive && <Check className="w-3 h-3 text-[#10b981]" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {selectedSessionData.tags?.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 flex items-center gap-1">
                  {tag}
                  <button onClick={() => handleUpdateTags(selectedSession, (selectedSessionData.tags || []).filter((t) => t !== tag))} className="hover:text-red-400">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>

            {selectedSessionData.sessionRating && (
              <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Calificacion:</span>
                  <StarRating rating={selectedSessionData.sessionRating} size={14} />
                  {selectedSessionData.ratingComment && (
                    <span className="text-[11px] text-white/50 truncate">"{selectedSessionData.ratingComment}"</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : (
                <>
                  {firstPreChatMessage && (selectedSessionData.problemType || selectedSessionData.gameName) && (
                    <div className="flex justify-end mb-4" data-testid="prechat-form-card">
                      <div className="max-w-[80%] rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <p className="text-[11px] font-semibold text-white/50 mb-2 uppercase tracking-wider">Formulario pre-chat</p>
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] text-white/30">Nombre:</span>
                            <p className="text-sm text-white/80 font-medium">{selectedSessionData.userName || "No especificado"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/30">E-mail:</span>
                            <p className="text-sm text-[#10b981] font-medium">{selectedSessionData.userEmail}</p>
                          </div>
                          {selectedSessionData.problemType && (
                            <div>
                              <span className="text-[10px] text-white/30">Tipo de consulta:</span>
                              <p className="text-sm text-white/80">{selectedSessionData.problemType}</p>
                            </div>
                          )}
                          {selectedSessionData.gameName && (
                            <div>
                              <span className="text-[10px] text-white/30">Detalle:</span>
                              <p className="text-sm text-white/80">{selectedSessionData.gameName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    const isBot = msg.sender === "support" && !msg.adminName;
                    const isAdmin = msg.sender === "support" && !!msg.adminName;
                    const isHighlighted = chatSearchQuery && msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
                    const cleanContent = msg.content
                      .replace(/\{\{QUICK_REPLIES:.*?\}\}/g, "")
                      .replace(/\{\{SHOW_RATING\}\}/g, "");

                    if (msg.content.includes("{{SHOW_RATING}}")) {
                      return (
                        <div key={msg.id} className="flex justify-end" data-testid={`message-${msg.id}`}>
                          <div className="max-w-[75%] rounded-xl px-3 py-2 bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] font-semibold text-amber-400 mb-1">Encuesta de satisfacción</p>
                            {selectedSessionData.sessionRating ? (
                              <div className="flex items-center gap-2">
                                <StarRating rating={selectedSessionData.sessionRating} />
                                {selectedSessionData.ratingComment && (
                                  <span className="text-xs text-white/50">"{selectedSessionData.ratingComment}"</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-white/40">Esperando calificación...</p>
                            )}
                            <p className="text-[10px] text-white/25 mt-1">{formatDateTime(msg.timestamp)}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`} data-testid={`message-${msg.id}`}>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 ${isHighlighted ? "ring-2 ring-yellow-400/50" : ""} ${isUser ? "bg-white/[0.06] text-white/90" : isBot ? "bg-blue-500/15 text-blue-200" : "bg-[#10b981]/15 text-emerald-200"}`}>
                          {isAdmin && msg.adminName && (
                            <p className="text-[10px] font-semibold mb-0.5" style={{ color: msg.adminColor || "#10b981" }}>{msg.adminName}</p>
                          )}
                          {isBot && (
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[10px] font-semibold text-blue-400">Bot</p>
                              <button
                                data-testid={`button-correct-${msg.id}`}
                                onClick={() => openCorrection(msg)}
                                className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-0.5"
                                title="Corregir respuesta del bot"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                Corregir
                              </button>
                            </div>
                          )}
                          {cleanContent.trim() && (
                            <p className="text-sm whitespace-pre-wrap break-words">{cleanContent}</p>
                          )}
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt=""
                              className="mt-2 max-w-full rounded-lg max-h-48 object-contain cursor-pointer hover:opacity-80"
                              data-testid={`message-image-${msg.id}`}
                              onClick={() => window.open(msg.imageUrl!, "_blank")}
                            />
                          )}
                          <p className="text-[10px] text-white/25 mt-1">{formatDateTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/[0.06] relative">
              {showSlashMenu && cannedResponses.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-xl max-h-48 overflow-y-auto z-10" data-testid="slash-menu">
                  {cannedResponses.map((cr) => (
                    <button
                      key={cr.id}
                      data-testid={`slash-option-${cr.id}`}
                      onClick={() => handleSlashSelect(cr.content)}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
                    >
                      <span className="text-xs font-mono text-[#10b981]">/{cr.shortcut}</span>
                      <p className="text-xs text-white/50 truncate">{cr.content}</p>
                    </button>
                  ))}
                </div>
              )}

              {showProductSearch && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-xl max-h-64 overflow-hidden z-10 flex flex-col" data-testid="product-search-panel">
                  <div className="p-2 border-b border-white/[0.06]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                      <Input
                        data-testid="input-product-search-chat"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Buscar producto..."
                        className="pl-7 h-7 text-xs bg-white/[0.04] border-white/[0.08]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-white/30 p-3">Sin resultados</p>
                    ) : (
                      filteredProducts.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          data-testid={`product-chat-option-${p.id}`}
                          onClick={() => handleSendProduct(p)}
                          className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
                        >
                          <span className="text-xs text-white/80">{p.name}</span>
                          {p.price && <span className="text-xs text-[#10b981] ml-2">${p.price}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-16 rounded-lg border border-white/[0.1]" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    data-testid="button-remove-image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex items-center gap-0.5 flex-shrink-0 pb-1">
                  <button
                    data-testid="button-slash-menu"
                    onClick={() => { setShowSlashMenu(!showSlashMenu); setShowProductSearch(false); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/50"
                    title="Atajos (/) "
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button
                    data-testid="button-product-search"
                    onClick={() => { setShowProductSearch(!showProductSearch); setShowSlashMenu(false); setProductSearchQuery(""); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/50"
                    title="Buscar producto"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    data-testid="button-upload-image"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/50"
                    title="Subir imagen"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <Textarea
                  data-testid="textarea-reply"
                  value={replyText}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  placeholder='Escribe tu respuesta.. (/ para atajos)'
                  className="resize-none bg-white/[0.04] border-white/[0.08] min-h-[40px] max-h-[120px] text-sm flex-1"
                  rows={1}
                />
                <Button data-testid="button-send-reply" onClick={handleReply} disabled={(!replyText.trim() && !imagePreview) || sending} size="icon" className="bg-[#10b981] border-[#10b981] flex-shrink-0 mb-0.5">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" data-testid="text-no-chat-selected">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
      {correctionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setCorrectionModal(null)} data-testid="correction-modal-overlay">
          <div className="bg-[#1a1a2e] border border-white/[0.1] rounded-xl w-full max-w-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()} data-testid="correction-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                Corregir respuesta del Bot
              </h3>
              <button onClick={() => setCorrectionModal(null)} className="text-white/30 hover:text-white/60" data-testid="button-close-correction">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Pregunta del usuario</label>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
                  <p className="text-sm text-white/70">{correctionModal.userQuestion || "(Sin pregunta identificada)"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Respuesta original del Bot</label>
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                  <p className="text-sm text-red-300/70 line-through">{correctionModal.originalAnswer}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-amber-400/70 mb-1 block font-medium">Respuesta correcta</label>
                <Textarea
                  data-testid="textarea-correction"
                  value={correctionAnswer}
                  onChange={(e) => setCorrectionAnswer(e.target.value)}
                  placeholder="Escribe la respuesta correcta que deberia dar el bot..."
                  className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[80px] text-sm"
                  rows={3}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setCorrectionModal(null)} className="text-white/50" data-testid="button-cancel-correction">
                Cancelar
              </Button>
              <Button
                data-testid="button-save-correction"
                onClick={handleCorrection}
                disabled={!correctionAnswer.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0"
              >
                <Check className="w-4 h-4 mr-1" />
                Guardar correccion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AtajosTab() {
  const { toast } = useToast();
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");

  const { data: responses = [], isLoading } = useQuery<CannedResponse[]>({
    queryKey: ["/api/tenant-panel/canned-responses"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/canned-responses");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/canned-responses", {
        method: "POST",
        body: JSON.stringify({ shortcut: shortcut.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/canned-responses"] });
      setShortcut("");
      setContent("");
      toast({ title: "Atajo creado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await tenantFetch(`/api/tenant-panel/canned-responses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/canned-responses"] });
      toast({ title: "Atajo eliminado" });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold text-white/90 mb-1 flex items-center gap-2" data-testid="text-atajos-title">
          <Zap className="w-5 h-5 text-[#10b981]" />
          Respuestas Rapidas
        </h2>
        <p className="text-sm text-white/40">Crea atajos para responder más rápido en tus conversaciones.</p>
      </div>

      <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-sm text-white/60 space-y-1">
            <p className="text-white/80 font-medium">Cómo funcionan los atajos</p>
            <p>Los atajos te permiten responder al instante con mensajes predefinidos. Cuando estés en una conversación en el tab <strong className="text-white/70">"Chats"</strong>, escribe <span className="font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">/</span> seguido del nombre del atajo para insertar la respuesta automáticamente.</p>
            <p className="text-[#10b981]">Ejemplo: Si creas el atajo "saludo", al escribir /saludo en el chat se insertara el mensaje completo.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            data-testid="input-shortcut"
            value={shortcut}
            onChange={(e) => setShortcut(e.target.value)}
            placeholder="Atajo (ej: saludo)"
            className="bg-white/[0.04] border-white/[0.08]"
          />
          <div className="sm:col-span-2">
            <Input
              data-testid="input-shortcut-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenido del mensaje"
              className="bg-white/[0.04] border-white/[0.08]"
            />
          </div>
        </div>
        <Button
          data-testid="button-add-shortcut"
          onClick={() => addMutation.mutate()}
          disabled={!shortcut.trim() || !content.trim() || addMutation.isPending}
          className="bg-[#10b981] border-[#10b981]"
        >
          <Plus className="w-4 h-4 mr-1" />Agregar Atajo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
      ) : responses.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-8" data-testid="text-no-atajos">No hay atajos creados</p>
      ) : (
        <div className="space-y-2">
          {responses.map((r) => (
            <div key={r.id} data-testid={`atajo-${r.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="text-xs font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded">/{r.shortcut}</span>
              <span className="flex-1 text-sm text-white/70 truncate">{r.content}</span>
              <Button data-testid={`button-delete-atajo-${r.id}`} size="icon" variant="ghost" onClick={() => deleteMutation.mutate(r.id)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EtiquetasTab() {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");

  const { data: tags = [], isLoading } = useQuery<CustomTag[]>({
    queryKey: ["/api/tenant-panel/tags"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/tags");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/tags", {
        method: "POST",
        body: JSON.stringify({ name: newTag.trim() }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/tags"] });
      setNewTag("");
      toast({ title: "Etiqueta creada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      await tenantFetch(`/api/tenant-panel/tags/${encodeURIComponent(name)}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/tags"] });
      toast({ title: "Etiqueta eliminada" });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold text-white/90 mb-1 flex items-center gap-2" data-testid="text-etiquetas-title">
          <Tag className="w-5 h-5 text-[#10b981]" />
          Etiquetas
        </h2>
        <p className="text-sm text-white/40">Organiza tus conversaciones con etiquetas personalizadas.</p>
      </div>

      <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Tag className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-sm text-white/60 space-y-1">
            <p className="text-white/80 font-medium">Cómo funcionan las etiquetas</p>
            <p>Las etiquetas te ayudan a clasificar y filtrar conversaciones. Puedes asignar etiquetas a cada chat desde el tab <strong className="text-white/70">"Chats"</strong> usando el botón <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded text-xs">+ Etiqueta</span> en la barra superior de cada conversación.</p>
            <p className="text-[#10b981]">Tip: Crea etiquetas como "urgente", "venta_cerrada", "seguimiento" para organizar mejor tu atención.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          data-testid="input-new-tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Nombre de la etiqueta"
          className="bg-white/[0.04] border-white/[0.08]"
          onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) addMutation.mutate(); }}
        />
        <Button
          data-testid="button-add-tag"
          onClick={() => addMutation.mutate()}
          disabled={!newTag.trim() || addMutation.isPending}
          className="bg-[#10b981] border-[#10b981] flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />Agregar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
      ) : tags.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-8" data-testid="text-no-tags">No hay etiquetas</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag} data-testid={`tag-${tag}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Tag className="w-3 h-3 text-[#10b981]" />
              <span className="text-sm text-white/70">{tag}</span>
              <button data-testid={`button-delete-tag-${tag}`} onClick={() => deleteMutation.mutate(tag)} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductosTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [category, setCategory] = useState("game");
  const [availability, setAvailability] = useState("available");
  const [description, setDescription] = useState("");

  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ["/api/tenant-panel/products"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/products");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPrice("");
    setProductUrl("");
    setCategory("game");
    setAvailability("available");
    setDescription("");
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name: name.trim(), price: price.trim() || null, productUrl: productUrl.trim() || null, category, availability, description: description.trim() || null };
      if (editId) {
        const res = await tenantFetch(`/api/tenant-panel/products/${editId}`, { method: "PATCH", body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Error");
      } else {
        const res = await tenantFetch("/api/tenant-panel/products", { method: "POST", body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Error");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/products"] });
      resetForm();
      toast({ title: editId ? "Producto actualizado" : "Producto creado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await tenantFetch(`/api/tenant-panel/products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/products"] });
      toast({ title: "Producto eliminado" });
    },
  });

  const startEdit = (p: ProductItem) => {
    setEditId(p.id);
    setName(p.name);
    setPrice(p.price || "");
    setProductUrl(p.productUrl || "");
    setCategory(p.category);
    setAvailability(p.availability);
    setDescription(p.description || "");
    setShowForm(true);
  };

  const categoryLabels: Record<string, string> = { game: "Juego", subscription: "Suscripción", card: "Tarjeta", bundle: "Bundle", console: "Consola", accessory: "Accesorio", other: "Otro" };
  const availLabels: Record<string, string> = { available: "Disponible", out_of_stock: "Sin stock", preorder: "Pre-orden" };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white/90 mb-1" data-testid="text-productos-title">Productos</h2>
          <p className="text-sm text-white/40">Gestiona tu catálogo de productos.</p>
        </div>
        <Button data-testid="button-add-product" onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#10b981] border-[#10b981]">
          <Plus className="w-4 h-4 mr-1" />Nuevo Producto
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4" data-testid="product-form">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">{editId ? "Editar Producto" : "Nuevo Producto"}</h3>
            <button data-testid="button-close-product-form" onClick={resetForm}><X className="w-4 h-4 text-white/40" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input data-testid="input-product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="bg-white/[0.04] border-white/[0.08]" />
            <Input data-testid="input-product-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio (ej: 9990)" className="bg-white/[0.04] border-white/[0.08]" />
            <Input data-testid="input-product-url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="URL del producto" className="bg-white/[0.04] border-white/[0.08]" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-product-category" className="bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="game">Juego</SelectItem>
                <SelectItem value="subscription">Suscripción</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
                <SelectItem value="console">Consola</SelectItem>
                <SelectItem value="accessory">Accesorio</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger data-testid="select-product-availability" className="bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="out_of_stock">Sin stock</SelectItem>
                <SelectItem value="preorder">Pre-orden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea data-testid="textarea-product-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion" className="bg-white/[0.04] border-white/[0.08] resize-none" rows={3} />
          <Button data-testid="button-save-product" onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} className="bg-[#10b981] border-[#10b981]">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            {editId ? "Actualizar" : "Crear"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
      ) : products.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-8" data-testid="text-no-products">No hay productos</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} data-testid={`product-${p.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {p.price && <span className="text-xs text-[#10b981] font-semibold">${p.price}</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">{categoryLabels[p.category] || p.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.availability === "available" ? "bg-emerald-500/15 text-emerald-400" : p.availability === "preorder" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>{availLabels[p.availability] || p.availability}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button data-testid={`button-edit-product-${p.id}`} size="icon" variant="ghost" onClick={() => startEdit(p)}>
                  <Pencil className="w-4 h-4 text-white/40" />
                </Button>
                <Button data-testid={`button-delete-product-${p.id}`} size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConocimientoTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [kbCategory, setKbCategory] = useState("general");
  const [kbStatus, setKbStatus] = useState("pending");

  const { data: entries = [], isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/tenant-panel/knowledge"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/knowledge");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const resetForm = () => {
    setEditId(null);
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setKbCategory("general");
    setKbStatus("pending");
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        category: kbCategory,
        status: kbStatus,
      };
      if (editId) {
        const res = await tenantFetch(`/api/tenant-panel/knowledge/${editId}`, { method: "PATCH", body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Error");
      } else {
        const res = await tenantFetch("/api/tenant-panel/knowledge", { method: "POST", body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Error");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge"] });
      resetForm();
      toast({ title: editId ? "Entrada actualizada" : "Entrada creada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await tenantFetch(`/api/tenant-panel/knowledge/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge"] });
      toast({ title: "Entrada eliminada" });
    },
  });

  const startEdit = (e: KnowledgeEntry) => {
    setEditId(e.id);
    setQuestion(e.question);
    setAnswer(e.answer);
    setKeywords((e.keywords || []).join(", "));
    setKbCategory(e.category);
    setKbStatus(e.status);
    setShowForm(true);
  };

  const categoryLabels: Record<string, string> = { faq: "FAQ", troubleshooting: "Solucion", product_info: "Producto", policy: "Politica", general: "General" };
  const statusLabels: Record<string, string> = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white/90 mb-1" data-testid="text-knowledge-title">Base de Conocimiento</h2>
          <p className="text-sm text-white/40">Entradas de conocimiento para el bot de IA.</p>
        </div>
        <Button data-testid="button-add-knowledge" onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#10b981] border-[#10b981]">
          <Plus className="w-4 h-4 mr-1" />Nueva Entrada
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4" data-testid="knowledge-form">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">{editId ? "Editar Entrada" : "Nueva Entrada"}</h3>
            <button data-testid="button-close-knowledge-form" onClick={resetForm}><X className="w-4 h-4 text-white/40" /></button>
          </div>
          <Input data-testid="input-kb-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pregunta" className="bg-white/[0.04] border-white/[0.08]" />
          <Textarea data-testid="textarea-kb-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Respuesta" className="bg-white/[0.04] border-white/[0.08] resize-none" rows={3} />
          <Input data-testid="input-kb-keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Palabras clave (separadas por coma)" className="bg-white/[0.04] border-white/[0.08]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={kbCategory} onValueChange={setKbCategory}>
              <SelectTrigger data-testid="select-kb-category" className="bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="troubleshooting">Solucion de problemas</SelectItem>
                <SelectItem value="product_info">Info de producto</SelectItem>
                <SelectItem value="policy">Politica</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kbStatus} onValueChange={setKbStatus}>
              <SelectTrigger data-testid="select-kb-status" className="bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button data-testid="button-save-knowledge" onClick={() => saveMutation.mutate()} disabled={!question.trim() || !answer.trim() || saveMutation.isPending} className="bg-[#10b981] border-[#10b981]">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            {editId ? "Actualizar" : "Crear"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
      ) : entries.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-8" data-testid="text-no-knowledge">No hay entradas</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} data-testid={`knowledge-${e.id}`} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">{e.question}</p>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{e.answer}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">{categoryLabels[e.category] || e.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${e.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : e.status === "rejected" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{statusLabels[e.status] || e.status}</span>
                    {e.keywords && e.keywords.length > 0 && e.keywords.map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#10b981]/70">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button data-testid={`button-edit-knowledge-${e.id}`} size="icon" variant="ghost" onClick={() => startEdit(e)}>
                    <Pencil className="w-4 h-4 text-white/40" />
                  </Button>
                  <Button data-testid={`button-delete-knowledge-${e.id}`} size="icon" variant="ghost" onClick={() => deleteMutation.mutate(e.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface KnowledgePageItem {
  id: number;
  tenantId: number;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function EntrenarBotTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<TenantSettings>({
    queryKey: ["/api/tenant-panel/settings"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/settings");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery<KnowledgePageItem[]>({
    queryKey: ["/api/tenant-panel/knowledge-pages"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/knowledge-pages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [botContext, setBotContext] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState<"text" | "url" | null>(null);
  const [rawText, setRawText] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState("");
  const [beautifying, setBeautifying] = useState(false);
  const [addingInfo, setAddingInfo] = useState(false);
  const [showAddInfo, setShowAddInfo] = useState(false);
  const [newInfoText, setNewInfoText] = useState("");
  const [activePage, setActivePage] = useState<number | "main">("main");
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState("");
  const [editingPageContent, setEditingPageContent] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [showNewPage, setShowNewPage] = useState(false);

  useEffect(() => {
    if (settings && !hasLoaded) {
      setBotContext(settings.botContext || "");
      setHasLoaded(true);
    }
  }, [settings, hasLoaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/settings", {
        method: "PATCH",
        body: JSON.stringify({ botContext }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/settings"] });
      toast({ title: "Entrenamiento guardado", description: "El bot usará esta información en sus respuestas" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    },
  });

  const createPageMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const res = await tenantFetch("/api/tenant-panel/knowledge-pages", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: (newPage: KnowledgePageItem) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge-pages"] });
      setShowNewPage(false);
      setNewPageTitle("");
      setActivePage(newPage.id);
      setEditingPageId(newPage.id);
      setEditingPageTitle(newPage.title);
      setEditingPageContent(newPage.content);
      toast({ title: "Página creada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la página", variant: "destructive" });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: number; title: string; content: string }) => {
      const res = await tenantFetch(`/api/tenant-panel/knowledge-pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge-pages"] });
      toast({ title: "Página guardada", description: "El bot usará esta información" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await tenantFetch(`/api/tenant-panel/knowledge-pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/knowledge-pages"] });
      setActivePage("main");
      setEditingPageId(null);
      toast({ title: "Página eliminada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    },
  });

  const handleAnalyzeText = async () => {
    if (!rawText.trim() || rawText.trim().length < 20) {
      toast({ title: "Texto muy corto", description: "Pega al menos un párrafo con información de tu negocio", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setAnalyzedResult("");
    try {
      const res = await tenantFetch("/api/tenant-panel/analyze-text", {
        method: "POST",
        body: JSON.stringify({ text: rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setAnalyzedResult(data.organized);
      toast({ title: "Análisis completado", description: "Revisa el resultado y elige cómo aplicarlo" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo analizar", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!scrapeUrl.trim()) {
      toast({ title: "URL requerida", description: "Ingresa la URL de tu página web", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setAnalyzedResult("");
    try {
      const res = await tenantFetch("/api/tenant-panel/analyze-url", {
        method: "POST",
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setAnalyzedResult(data.organized);
      toast({ title: "Análisis web completado", description: "Se extrajo la información de tu sitio web" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo analizar la URL", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyToCurrentPage = (text: string, mode: "replace" | "append") => {
    if (activePage === "main") {
      if (mode === "replace") {
        setBotContext(text);
      } else {
        setBotContext((prev) => prev ? prev + "\n\n" + text : text);
      }
    } else if (editingPageId) {
      if (mode === "replace") {
        setEditingPageContent(text);
      } else {
        setEditingPageContent((prev) => prev ? prev + "\n\n" + text : text);
      }
    }
    setAnalyzedResult("");
    setAnalyzeMode(null);
    setRawText("");
    setScrapeUrl("");
    toast({ title: mode === "replace" ? "Reemplazado" : "Agregado", description: "Recuerda guardar los cambios." });
  };

  const handleBeautify = async () => {
    const text = activePage === "main" ? botContext : editingPageContent;
    if (!text.trim() || text.trim().length < 30) {
      toast({ title: "Texto muy corto", description: "Necesitas al menos un párrafo de contenido para embellecer", variant: "destructive" });
      return;
    }
    setBeautifying(true);
    try {
      const res = await tenantFetch("/api/tenant-panel/beautify-text", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (activePage === "main") {
        setBotContext(data.beautified);
      } else {
        setEditingPageContent(data.beautified);
      }
      toast({ title: "Texto embellecido", description: "Se mejoró la redacción. Revisa y guarda los cambios." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo embellecer el texto", variant: "destructive" });
    } finally {
      setBeautifying(false);
    }
  };

  const handleAddInfo = async () => {
    if (!newInfoText.trim()) {
      toast({ title: "Sin información", description: "Pega o escribe la información que deseas agregar", variant: "destructive" });
      return;
    }
    const existingText = activePage === "main" ? botContext : editingPageContent;
    setAddingInfo(true);
    try {
      const res = await tenantFetch("/api/tenant-panel/add-info", {
        method: "POST",
        body: JSON.stringify({ existingText, newText: newInfoText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (activePage === "main") {
        setBotContext(data.merged);
      } else {
        setEditingPageContent(data.merged);
      }
      setNewInfoText("");
      setShowAddInfo(false);
      toast({ title: "Información agregada", description: "Se fusionó la nueva información con la existente. Revisa y guarda los cambios." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo agregar la información", variant: "destructive" });
    } finally {
      setAddingInfo(false);
    }
  };

  const selectPage = (page: KnowledgePageItem) => {
    setActivePage(page.id);
    setEditingPageId(page.id);
    setEditingPageTitle(page.title);
    setEditingPageContent(page.content);
  };

  const { data: kbEntries = [] } = useQuery<KBEntry[]>({
    queryKey: ["/api/tenant-panel/knowledge"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/knowledge");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading || pagesLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>;

  const approvedCount = kbEntries.filter(k => k.status === "approved").length;
  const currentText = activePage === "main" ? botContext : editingPageContent;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold text-white/90 mb-1 flex items-center gap-2" data-testid="text-entrenar-title">
          <Bot className="w-5 h-5 text-[#10b981]" />
          Entrenar Bot
        </h2>
        <p className="text-sm text-white/40">Organiza la información de tu negocio en páginas. Cada página es un bloque independiente que el bot usará para responder.</p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Páginas de conocimiento</p>
          <button
            onClick={() => setShowNewPage(true)}
            className="flex items-center gap-1 text-xs text-[#10b981] hover:text-[#10b981]/80 transition-colors"
            data-testid="button-add-page"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva página
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActivePage("main"); setEditingPageId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePage === "main" ? "bg-[#10b981] text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"}`}
            data-testid="tab-main-page"
          >
            Principal
          </button>
          {pages.map((page, i) => (
            <button
              key={page.id}
              onClick={() => selectPage(page)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePage === page.id ? "bg-[#10b981] text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"}`}
              data-testid={`tab-page-${page.id}`}
            >
              Pág. {i + 1}: {page.title.length > 15 ? page.title.slice(0, 15) + "..." : page.title}
            </button>
          ))}
        </div>
        {showNewPage && (
          <div className="flex gap-2 mt-3 animate-in fade-in duration-200">
            <Input
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Nombre de la página (ej: Horarios, Precios, Políticas...)"
              className="bg-white/[0.04] border-white/[0.08] text-sm flex-1"
              data-testid="input-new-page-title"
            />
            <Button
              onClick={() => {
                if (!newPageTitle.trim()) return;
                createPageMutation.mutate({ title: newPageTitle.trim(), content: "" });
              }}
              disabled={!newPageTitle.trim() || createPageMutation.isPending}
              className="bg-[#10b981] border-[#10b981]"
              data-testid="button-create-page"
            >
              {createPageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => { setShowNewPage(false); setNewPageTitle(""); }}
              variant="ghost"
              className="text-white/40"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#10b981]" />
          <p className="text-sm font-medium text-white/80">Entrenamiento inteligente con IA</p>
          <span className="text-[10px] text-white/30 ml-auto">Aplicará a: {activePage === "main" ? "Página Principal" : editingPageTitle}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            data-testid="button-analyze-text-mode"
            onClick={() => { setAnalyzeMode(analyzeMode === "text" ? null : "text"); setAnalyzedResult(""); }}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${analyzeMode === "text" ? "border-[#10b981]/50 bg-[#10b981]/10" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${analyzeMode === "text" ? "bg-[#10b981]/20" : "bg-white/[0.05]"}`}>
              <FileUp className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Pegar texto</p>
              <p className="text-[11px] text-white/40">Copia y pega info de tu negocio</p>
            </div>
          </button>
          <button
            data-testid="button-analyze-url-mode"
            onClick={() => { setAnalyzeMode(analyzeMode === "url" ? null : "url"); setAnalyzedResult(""); }}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${analyzeMode === "url" ? "border-[#10b981]/50 bg-[#10b981]/10" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${analyzeMode === "url" ? "bg-[#10b981]/20" : "bg-white/[0.05]"}`}>
              <Globe className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Analizar sitio web</p>
              <p className="text-[11px] text-white/40">Extrae info desde tu página</p>
            </div>
          </button>
        </div>

        {analyzeMode === "text" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Textarea
              data-testid="textarea-raw-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Pega aquí toda la información de tu negocio (copiada de tu web, documentos, redes sociales, etc.)... La IA la organizará automáticamente."
              className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[200px] text-sm"
              rows={10}
            />
            <Button
              data-testid="button-analyze-text"
              onClick={handleAnalyzeText}
              disabled={analyzing || !rawText.trim()}
              className="bg-[#10b981] border-[#10b981] w-full sm:w-auto"
            >
              {analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {analyzing ? "Analizando con IA..." : "Analizar y organizar"}
            </Button>
          </div>
        )}

        {analyzeMode === "url" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
              <Input
                data-testid="input-scrape-url"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="https://tusitio.com"
                className="bg-white/[0.04] border-white/[0.08] flex-1"
              />
              <Button
                data-testid="button-analyze-url"
                onClick={handleAnalyzeUrl}
                disabled={analyzing || !scrapeUrl.trim()}
                className="bg-[#10b981] border-[#10b981]"
              >
                {analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Globe className="w-4 h-4 mr-1" />}
                {analyzing ? "Analizando..." : "Analizar web"}
              </Button>
            </div>
            <p className="text-[11px] text-white/30">La IA visitará tu página, extraerá toda la información del negocio y la organizará automáticamente. Puede tardar hasta 30 segundos.</p>
          </div>
        )}

        {analyzing && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[#10b981]/20 bg-[#10b981]/5">
            <Loader2 className="w-5 h-5 text-[#10b981] animate-spin" />
            <div>
              <p className="text-sm text-white/70">Analizando con inteligencia artificial...</p>
              <p className="text-[11px] text-white/40">Esto puede tardar unos segundos</p>
            </div>
          </div>
        )}

        {analyzedResult && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#10b981]" />
              <p className="text-sm font-medium text-white/80">Resultado del análisis</p>
            </div>
            <div className="rounded-lg border border-[#10b981]/20 bg-black/20 p-3 max-h-[300px] overflow-y-auto chat-scrollbar">
              <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{analyzedResult}</pre>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-apply-replace"
                onClick={() => applyToCurrentPage(analyzedResult, "replace")}
                className="bg-[#10b981] border-[#10b981]"
              >
                <Replace className="w-4 h-4 mr-1" />
                Reemplazar contenido
              </Button>
              <Button
                data-testid="button-apply-append"
                onClick={() => applyToCurrentPage(analyzedResult, "append")}
                variant="outline"
                className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Agregar sin borrar
              </Button>
              <Button
                data-testid="button-discard-analysis"
                onClick={() => { setAnalyzedResult(""); setAnalyzeMode(null); setRawText(""); setScrapeUrl(""); }}
                variant="ghost"
                className="text-white/40 hover:text-white/60"
              >
                <X className="w-4 h-4 mr-1" />
                Descartar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        {activePage === "main" ? (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">Página Principal</label>
              <span className="text-[10px] text-white/30">{botContext.length} caracteres</span>
            </div>
            <Textarea
              data-testid="textarea-bot-context"
              value={botContext}
              onChange={(e) => setBotContext(e.target.value)}
              placeholder="Aquí aparecerá la información organizada de tu negocio después de usar el análisis con IA, o puedes escribirla manualmente..."
              className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[300px] text-sm font-mono"
              rows={18}
            />
            {showAddInfo && activePage === "main" && (
              <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#10b981]">Pega la nueva información aquí:</p>
                  <button onClick={() => { setShowAddInfo(false); setNewInfoText(""); }} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <Textarea
                  data-testid="textarea-add-info"
                  value={newInfoText}
                  onChange={(e) => setNewInfoText(e.target.value)}
                  placeholder="Pega aquí la información nueva que quieras agregar (horarios, productos, servicios, etc.)..."
                  className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[120px] text-sm font-mono"
                  rows={6}
                />
                <Button
                  data-testid="button-merge-info"
                  onClick={handleAddInfo}
                  disabled={addingInfo || !newInfoText.trim()}
                  className="bg-[#10b981] border-[#10b981] w-full"
                >
                  {addingInfo ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  {addingInfo ? "Fusionando con IA..." : "Fusionar con información existente"}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-add-info"
                onClick={() => setShowAddInfo(!showAddInfo)}
                disabled={addingInfo}
                variant="outline"
                className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Agregar información
              </Button>
              <Button
                data-testid="button-beautify-text"
                onClick={handleBeautify}
                disabled={beautifying || !botContext.trim() || botContext.trim().length < 30}
                variant="outline"
                className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 w-full sm:w-auto"
              >
                {beautifying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {beautifying ? "Embelleciendo..." : "Embellecer textos"}
              </Button>
              <Button
                data-testid="button-save-training"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !botContext.trim()}
                className="bg-[#10b981] border-[#10b981] w-full sm:w-auto"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Guardar Página Principal
              </Button>
            </div>
          </>
        ) : editingPageId ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingPageTitle}
                  onChange={(e) => setEditingPageTitle(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-sm font-medium max-w-[300px]"
                  data-testid="input-page-title"
                />
              </div>
              <span className="text-[10px] text-white/30 ml-2">{editingPageContent.length} caracteres</span>
            </div>
            <Textarea
              value={editingPageContent}
              onChange={(e) => setEditingPageContent(e.target.value)}
              placeholder="Escribe o pega la información para esta página..."
              className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[300px] text-sm font-mono"
              rows={18}
              data-testid="textarea-page-content"
            />
            {showAddInfo && activePage !== "main" && (
              <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#10b981]">Pega la nueva información aquí:</p>
                  <button onClick={() => { setShowAddInfo(false); setNewInfoText(""); }} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <Textarea
                  data-testid="textarea-add-info-page"
                  value={newInfoText}
                  onChange={(e) => setNewInfoText(e.target.value)}
                  placeholder="Pega aquí la información nueva que quieras agregar..."
                  className="bg-white/[0.04] border-white/[0.08] resize-none min-h-[120px] text-sm font-mono"
                  rows={6}
                />
                <Button
                  data-testid="button-merge-info-page"
                  onClick={handleAddInfo}
                  disabled={addingInfo || !newInfoText.trim()}
                  className="bg-[#10b981] border-[#10b981] w-full"
                >
                  {addingInfo ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  {addingInfo ? "Fusionando con IA..." : "Fusionar con información existente"}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-add-info-page"
                onClick={() => setShowAddInfo(!showAddInfo)}
                disabled={addingInfo}
                variant="outline"
                className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Agregar información
              </Button>
              <Button
                data-testid="button-beautify-text"
                onClick={handleBeautify}
                disabled={beautifying || !editingPageContent.trim() || editingPageContent.trim().length < 30}
                variant="outline"
                className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 w-full sm:w-auto"
              >
                {beautifying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {beautifying ? "Embelleciendo..." : "Embellecer textos"}
              </Button>
              <Button
                onClick={() => updatePageMutation.mutate({ id: editingPageId, title: editingPageTitle, content: editingPageContent })}
                disabled={updatePageMutation.isPending}
                className="bg-[#10b981] border-[#10b981] w-full sm:w-auto"
                data-testid="button-save-page"
              >
                {updatePageMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Guardar Página
              </Button>
              <Button
                onClick={() => { if (confirm("¿Eliminar esta página? Esta acción no se puede deshacer.")) deletePageMutation.mutate(editingPageId); }}
                disabled={deletePageMutation.isPending}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto"
                data-testid="button-delete-page"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <CatalogQuickEdit />

      {approvedCount > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-medium text-white/80">Correcciones aprendidas</p>
            <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-400" data-testid="badge-corrections-count">{approvedCount}</Badge>
          </div>
          <p className="text-xs text-white/40">
            Tu bot tiene {approvedCount} correcciones guardadas desde el chat. Puedes verlas y editarlas en la pestaña "Conocimiento".
          </p>
        </div>
      )}
    </div>
  );
}

function CatalogQuickEdit() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newBadge, setNewBadge] = useState("");

  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ["/api/tenant-panel/products"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/products");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await tenantFetch(`/api/tenant-panel/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/products"] });
      setEditingId(null);
      toast({ title: "Producto actualizado" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await tenantFetch("/api/tenant-panel/products", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/products"] });
      setShowAddForm(false);
      setNewName("");
      setNewPrice("");
      setNewBadge("");
      toast({ title: "Producto agregado al catálogo" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await tenantFetch(`/api/tenant-panel/products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/products"] });
      toast({ title: "Producto eliminado" });
    },
  });

  const startEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price || "");
    setEditBadge(p.badgeLabel || "");
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    updateMutation.mutate({
      id: editingId!,
      data: { name: editName.trim(), price: editPrice.trim() || null, badgeLabel: editBadge.trim() || null },
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName.trim(),
      price: newPrice.trim() || null,
      badgeLabel: newBadge.trim() || null,
      category: "other",
      availability: "available",
    });
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const badgeSuggestions = ["Nuevo", "Popular", "Oferta", "Destacado", "Más vendido", "Exclusivo"];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#10b981]" />
          <p className="text-sm font-medium text-white/80">Catálogo del widget</p>
          <Badge variant="outline" className="text-[10px] border-white/10 text-white/40" data-testid="badge-catalog-count">{products.length}</Badge>
        </div>
        <Button
          data-testid="button-add-catalog-product"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#10b981] border-[#10b981] text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agregar
        </Button>
      </div>
      <p className="text-xs text-white/40">
        Estos productos aparecen en el catálogo del chat. Puedes personalizar nombre, precio y etiqueta.
      </p>

      {showAddForm && (
        <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-medium text-[#10b981]">Nuevo producto</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              data-testid="input-new-catalog-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del producto"
              className="bg-white/[0.04] border-white/[0.08] text-sm"
            />
            <Input
              data-testid="input-new-catalog-price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Precio (ej: $19.990)"
              className="bg-white/[0.04] border-white/[0.08] text-sm"
            />
            <Input
              data-testid="input-new-catalog-badge"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              placeholder="Etiqueta (ej: Nuevo)"
              className="bg-white/[0.04] border-white/[0.08] text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-white/30">Sugerencias:</span>
            {badgeSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => setNewBadge(s)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${newBadge === s ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              data-testid="button-save-new-catalog-product"
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
              className="bg-[#10b981] border-[#10b981] text-xs"
            >
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAddForm(false); setNewName(""); setNewPrice(""); setNewBadge(""); }}
              className="text-white/40 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {products.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <Input
            data-testid="input-search-catalog"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-9 bg-white/[0.04] border-white/[0.08] text-sm"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-white/30 text-sm">
          {products.length === 0 ? "No hay productos en el catálogo. Agrega uno para que aparezca en el chat." : "Sin resultados"}
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto chat-scrollbar">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]" data-testid={`catalog-item-${p.id}`}>
              {editingId === p.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      data-testid={`input-edit-name-${p.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre"
                      className="bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                    <Input
                      data-testid={`input-edit-price-${p.id}`}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Precio"
                      className="bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                    <Input
                      data-testid={`input-edit-badge-${p.id}`}
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      placeholder="Etiqueta"
                      className="bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/30">Sugerencias:</span>
                    {badgeSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditBadge(s)}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${editBadge === s ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending} className="bg-[#10b981] border-[#10b981] text-xs" data-testid={`button-save-edit-${p.id}`}>
                      {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-white/40 text-xs">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80 font-medium truncate">{p.name}</span>
                      {p.badgeLabel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 font-medium shrink-0">{p.badgeLabel}</span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">{p.price || "Sin precio"}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(p)} className="text-white/40 hover:text-white/70 h-7 w-7 p-0" data-testid={`button-edit-catalog-${p.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="text-red-400/40 hover:text-red-400 h-7 w-7 p-0" data-testid={`button-delete-catalog-${p.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AjustesTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<TenantSettings>({
    queryKey: ["/api/tenant-panel/settings"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/settings");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const [aiEnabled, setAiEnabled] = useState(true);
  const [bhEnabled, setBhEnabled] = useState(false);
  const [bhStart, setBhStart] = useState("09:00");
  const [bhEnd, setBhEnd] = useState("18:00");
  const [bhDays, setBhDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bhMessage, setBhMessage] = useState("Estamos fuera del horario de atención. Te responderemos pronto.");

  useEffect(() => {
    if (settings) {
      setAiEnabled(settings.aiEnabled === 1);
      if (settings.businessHoursConfig) {
        try {
          const bh = typeof settings.businessHoursConfig === "string" ? JSON.parse(settings.businessHoursConfig) : settings.businessHoursConfig;
          if (bh && bh.enabled) {
            setBhEnabled(true);
            setBhStart(bh.start || "09:00");
            setBhEnd(bh.end || "18:00");
            setBhDays(bh.days || [1, 2, 3, 4, 5]);
            setBhMessage(bh.message || "");
          }
        } catch {}
      }
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        aiEnabled: aiEnabled ? 1 : 0,
        businessHoursConfig: bhEnabled ? JSON.stringify({ enabled: true, start: bhStart, end: bhEnd, days: bhDays, message: bhMessage }) : null,
      };
      const res = await tenantFetch("/api/tenant-panel/settings", { method: "PATCH", body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/settings"] });
      toast({ title: "Ajustes guardados" });
    },
  });

  const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

  const toggleDay = (day: number) => {
    setBhDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold text-white/90 mb-1" data-testid="text-ajustes-title">Ajustes</h2>
        <p className="text-sm text-white/40">Configuración general del panel.</p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Inteligencia Artificial</p>
            <p className="text-xs text-white/40 mt-0.5">Habilitar respuestas automaticas del bot con IA</p>
          </div>
          <Switch data-testid="switch-ai-enabled" checked={aiEnabled} onCheckedChange={setAiEnabled} />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Horario de Atención</p>
            <p className="text-xs text-white/40 mt-0.5">Define cuando esta disponible tu equipo</p>
          </div>
          <Switch data-testid="switch-bh-enabled" checked={bhEnabled} onCheckedChange={setBhEnabled} />
        </div>

        {bhEnabled && (
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Hora inicio</label>
                <Input data-testid="input-bh-start" type="time" value={bhStart} onChange={(e) => setBhStart(e.target.value)} className="bg-white/[0.04] border-white/[0.08]" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Hora fin</label>
                <Input data-testid="input-bh-end" type="time" value={bhEnd} onChange={(e) => setBhEnd(e.target.value)} className="bg-white/[0.04] border-white/[0.08]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Dias activos</label>
              <div className="flex items-center gap-1 flex-wrap">
                {dayLabels.map((label, i) => (
                  <button
                    key={i}
                    data-testid={`button-day-${i}`}
                    onClick={() => toggleDay(i)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${bhDays.includes(i) ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" : "bg-white/[0.04] text-white/40 border border-white/[0.06]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Mensaje fuera de horario</label>
              <Textarea data-testid="textarea-bh-message" value={bhMessage} onChange={(e) => setBhMessage(e.target.value)} className="bg-white/[0.04] border-white/[0.08] resize-none" rows={2} />
            </div>
          </div>
        )}
      </div>

      <Button data-testid="button-save-settings" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#10b981] border-[#10b981]">
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
        Guardar Ajustes
      </Button>
    </div>
  );
}

interface AgentItem {
  id: number;
  tenantId: number;
  email: string;
  displayName: string;
  role: string;
  color: string;
  active: number;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = { owner: "Propietario", admin: "Administrador", ejecutivo: "Ejecutivo" };
const ROLE_ICONS: Record<string, any> = { owner: Crown, admin: Shield, ejecutivo: UserCog };
const AGENT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#84cc16", "#e11d48"];

function EquipoTab({ currentRole }: { currentRole: string }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ displayName: "", email: "", password: "", role: "ejecutivo", color: "#10b981" });
  const [showPassword, setShowPassword] = useState(false);

  const { data: agents = [], isLoading } = useQuery<AgentItem[]>({
    queryKey: ["/api/tenant-panel/agents"],
    queryFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/agents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await tenantFetch("/api/tenant-panel/agents", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/agents"] });
      setShowForm(false);
      setFormData({ displayName: "", email: "", password: "", role: "ejecutivo", color: "#10b981" });
      toast({ title: "Ejecutivo creado", description: "El nuevo miembro del equipo ya puede iniciar sesión" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await tenantFetch(`/api/tenant-panel/agents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/agents"] });
      setEditingId(null);
      toast({ title: "Ejecutivo actualizado" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await tenantFetch(`/api/tenant-panel/agents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/agents"] });
      toast({ title: "Ejecutivo eliminado" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const generatePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#10b981] animate-spin" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white" data-testid="text-equipo-title">Equipo</h2>
          <p className="text-xs text-white/40 mt-1">Gestiona los ejecutivos que pueden acceder al panel de soporte</p>
        </div>
        {!showForm && (
          <Button data-testid="button-add-agent" onClick={() => setShowForm(true)} className="bg-[#10b981] hover:bg-[#10b981]/80 text-sm gap-1.5">
            <Plus className="w-4 h-4" />
            Agregar Ejecutivo
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4" data-testid="agent-form">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nuevo Ejecutivo</h3>
            <button onClick={() => { setShowForm(false); setFormData({ displayName: "", email: "", password: "", role: "ejecutivo", color: "#10b981" }); }} className="text-white/40 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Nombre para mostrar *</label>
              <Input data-testid="input-agent-name" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Ej: Maria Lopez" className="bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Email *</label>
              <Input data-testid="input-agent-email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="maria@empresa.cl" className="bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Contraseña *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input data-testid="input-agent-password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Minimo 6 caracteres" className="bg-white/[0.04] border-white/[0.08] pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="border-white/[0.08] text-white/50 hover:text-white/70 text-xs shrink-0" data-testid="button-generate-password">
                  Generar
                </Button>
              </div>
              {showPassword && formData.password && (
                <button type="button" onClick={() => { navigator.clipboard.writeText(formData.password); toast({ title: "Contraseña copiada" }); }} className="flex items-center gap-1 mt-1 text-[10px] text-[#10b981]/70 hover:text-[#10b981]">
                  <Copy className="w-3 h-3" />
                  Copiar contraseña
                </button>
              )}
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Rol</label>
              <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}>
                <SelectTrigger data-testid="select-agent-role" className="bg-white/[0.04] border-white/[0.08]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ejecutivo">Ejecutivo — Solo chats y atajos</SelectItem>
                  {currentRole === "owner" && <SelectItem value="admin">Administrador — Todo excepto eliminar propietario</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Color del ejecutivo</label>
            <div className="flex flex-wrap gap-2">
              {AGENT_COLORS.map((c) => (
                <button key={c} data-testid={`color-${c}`} onClick={() => setFormData(prev => ({ ...prev, color: c }))} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? "border-white scale-110" : "border-transparent hover:border-white/30"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button data-testid="button-save-agent" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.displayName || !formData.email || !formData.password} className="bg-[#10b981] hover:bg-[#10b981]/80">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Crear Ejecutivo
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setFormData({ displayName: "", email: "", password: "", role: "ejecutivo", color: "#10b981" }); }} className="border-white/[0.08] text-white/50">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-xs font-medium text-white/50">{agents.length} miembro(s) del equipo</span>
        </div>

        {agents.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">Aun no hay ejecutivos</p>
            <p className="text-xs text-white/25 mt-1">Agrega miembros a tu equipo para que puedan atender chats</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {agents.map((agent) => {
              const RoleIcon = ROLE_ICONS[agent.role] || UserCog;
              const isEditing = editingId === agent.id;

              return (
                <div key={agent.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors" data-testid={`agent-row-${agent.id}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: agent.color }}>
                    {agent.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{agent.displayName}</span>
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: agent.role === "owner" ? "#f59e0b20" : agent.role === "admin" ? "#3b82f620" : "#10b98120", color: agent.role === "owner" ? "#f59e0b" : agent.role === "admin" ? "#3b82f6" : "#10b981" }}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[agent.role] || agent.role}
                      </span>
                      {agent.active !== 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">Desactivado</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 truncate">{agent.email}</p>
                    {agent.lastLoginAt && (
                      <p className="text-[10px] text-white/20 mt-0.5">Último acceso: {formatDateTime(agent.lastLoginAt)}</p>
                    )}
                  </div>

                  {agent.role !== "owner" && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <EditAgentInline
                          agent={agent}
                          currentRole={currentRole}
                          onSave={(data) => { updateMutation.mutate({ id: agent.id, data }); }}
                          onCancel={() => setEditingId(null)}
                          saving={updateMutation.isPending}
                        />
                      ) : (
                        <>
                          <button data-testid={`button-toggle-agent-${agent.id}`} onClick={() => updateMutation.mutate({ id: agent.id, data: { active: agent.active === 1 ? 0 : 1 } })} className={`p-1.5 rounded-md transition-colors ${agent.active === 1 ? "text-green-400/50 hover:text-green-400 hover:bg-green-500/10" : "text-red-400/50 hover:text-red-400 hover:bg-red-500/10"}`} title={agent.active === 1 ? "Desactivar" : "Activar"}>
                            {agent.active === 1 ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                          </button>
                          <button data-testid={`button-edit-agent-${agent.id}`} onClick={() => setEditingId(agent.id)} className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05]">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button data-testid={`button-delete-agent-${agent.id}`} onClick={() => { if (window.confirm(`Eliminar a ${agent.displayName}? Esta acción no se puede deshacer.`)) deleteMutation.mutate(agent.id); }} className="p-1.5 rounded-md text-red-400/30 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {agent.role === "owner" && (
                    <div className="shrink-0">
                      <span className="text-[10px] text-white/20 italic">No editable</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white/70 mb-2">Permisos por rol</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/60 font-medium">Propietario</span>
              <span className="text-white/30"> — Acceso total. Puede crear/eliminar ejecutivos y administradores. No puede ser eliminado.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/60 font-medium">Administrador</span>
              <span className="text-white/30"> — Puede gestionar chats, productos, conocimiento, entrenar el bot y crear ejecutivos. No puede modificar al propietario.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <UserCog className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/60 font-medium">Ejecutivo</span>
              <span className="text-white/30"> — Puede ver y responder chats, usar atajos, etiquetas y consultar la base de conocimiento. No puede gestionar equipo ni ajustes.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditAgentInline({ agent, currentRole, onSave, onCancel, saving }: { agent: AgentItem; currentRole: string; onSave: (data: any) => void; onCancel: () => void; saving: boolean }) {
  const [name, setName] = useState(agent.displayName);
  const [color, setColor] = useState(agent.color);
  const [role, setRole] = useState(agent.role);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs" data-testid="edit-agent-form">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="bg-white/[0.04] border-white/[0.08] text-sm h-8" data-testid="input-edit-agent-name" />
      <div className="relative">
        <Input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña (dejar vacio para mantener)" className="bg-white/[0.04] border-white/[0.08] text-sm h-8 pr-8" data-testid="input-edit-agent-password" />
        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50">
          {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>
      {currentRole === "owner" && (
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="bg-white/[0.04] border-white/[0.08] h-8 text-sm" data-testid="select-edit-agent-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      )}
      <div className="flex flex-wrap gap-1.5">
        {AGENT_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border ${color === c ? "border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => { const data: any = { displayName: name, color, role }; if (newPassword.length >= 6) data.password = newPassword; onSave(data); }} disabled={saving || !name} className="bg-[#10b981] h-7 text-xs" data-testid="button-save-edit-agent">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="border-white/[0.08] text-white/50 h-7 text-xs" data-testid="button-cancel-edit-agent">
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function TenantPanel() {
  const { tenant, isLoading, token, agentProfile, role, isAgent } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("chats");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.title = "FoxBot Panel - Soporte";
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute("content", "FoxBot Panel");
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute("href", "/manifest-panel.json");
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const canAccessTab = (item: typeof SIDEBAR_ITEMS[0]) => {
    if (!item.minRole) return true;
    if (role === "owner") return true;
    if (role === "admin" && (item.minRole === "admin" || item.minRole === "owner")) return true;
    return false;
  };

  const visibleTabs = SIDEBAR_ITEMS.filter(canAccessTab);

  if (isLoading || !tenant || !token) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex flex-col items-center gap-4">
          <img src={logoSinFondo} alt="FoxBot" className="w-16 h-16 rounded-xl" />
          <Loader2 className="w-6 h-6 text-[#10b981] animate-spin" />
          <p className="text-white/40 text-sm" data-testid="text-loading-panel">Cargando panel...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("tenant_token");
    window.location.href = "/login";
  };

  const currentName = isAgent ? (agentProfile?.displayName || "Ejecutivo") : tenant.companyName;
  const currentEmail = isAgent ? (agentProfile?.email || "") : tenant.email;
  const currentColor = isAgent ? (agentProfile?.color || "#10b981") : (tenant.widgetColor || "#10b981");
  const RoleIcon = ROLE_ICONS[role] || UserCog;

  return (
    <div className="h-screen flex" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }} data-testid="tenant-panel">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} data-testid="sidebar-overlay" />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`} data-testid="sidebar">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: currentColor }}>
              {currentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate" data-testid="text-company-name">{currentName}</p>
              <div className="flex items-center gap-1.5">
                <RoleIcon className="w-3 h-3" style={{ color: role === "owner" ? "#f59e0b" : role === "admin" ? "#3b82f6" : "#10b981" }} />
                <span className="text-[10px] truncate" style={{ color: role === "owner" ? "#f59e0b" : role === "admin" ? "#3b82f6" : "#10b981" }}>{ROLE_LABELS[role]}</span>
              </div>
              <p className="text-[10px] text-white/25 truncate">{currentEmail}</p>
            </div>
            <button className="md:hidden ml-auto" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar">
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleTabs.map((item) => (
            <button
              key={item.id}
              data-testid={`sidebar-tab-${item.id}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === item.id ? "bg-[#10b981]/15 text-[#10b981]" : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06] space-y-1">
          {!isInstalled && (deferredPrompt ? (
            <button
              data-testid="button-install-app"
              onClick={handleInstall}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 transition-colors font-semibold border border-[#10b981]/20"
            >
              <Download className="w-4 h-4" />
              Instalar App
            </button>
          ) : /iPad|iPhone|iPod/.test(navigator.userAgent) ? (
            <div className="px-3 py-2.5 rounded-lg text-[11px] text-white/50 bg-[#10b981]/5 border border-[#10b981]/15 leading-relaxed" data-testid="text-ios-install-hint">
              <div className="flex items-center gap-1.5 mb-1 text-[#10b981] font-semibold text-xs">
                <Download className="w-3.5 h-3.5" />
                Instalar como App
              </div>
              Toca el botón <strong className="text-white/70">Compartir</strong> (↑) de Safari y luego <strong className="text-white/70">"Agregar a Inicio"</strong>
            </div>
          ) : null)}
          {!isAgent && (
            <a
              href="/dashboard"
              data-testid="link-back-dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </a>
          )}
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0">
          <button data-testid="button-open-sidebar" onClick={() => setSidebarOpen(true)} className="md:hidden">
            <Menu className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-sm font-semibold text-white/70" data-testid="text-active-tab-title">
            {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
          </h1>
          {isAgent && (
            <span className="ml-auto text-[10px] text-white/25">{tenant.companyName}</span>
          )}
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "chats" && <ChatsTab token={token} tenant={tenant} />}
          {activeTab === "atajos" && <AtajosTab />}
          {activeTab === "etiquetas" && <EtiquetasTab />}
          {activeTab === "productos" && canAccessTab({ id: "productos", label: "", icon: null, minRole: "admin" }) && <ProductosTab />}
          {activeTab === "conocimiento" && <ConocimientoTab />}
          {activeTab === "entrenar" && canAccessTab({ id: "entrenar", label: "", icon: null, minRole: "admin" }) && <EntrenarBotTab />}
          {activeTab === "guías" && <GuidesPanel />}
          {activeTab === "equipo" && canAccessTab({ id: "equipo", label: "", icon: null, minRole: "admin" }) && <EquipoTab currentRole={role} />}
          {activeTab === "ajustes" && canAccessTab({ id: "ajustes", label: "", icon: null, minRole: "admin" }) && <AjustesTab />}
        </main>
      </div>
    </div>
  );
}
