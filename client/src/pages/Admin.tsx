import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Virtuoso } from "react-virtuoso";
import {
  Search, MessageSquare, Mail, Clock, User, Headphones, ArrowLeft, X, Lock, LogOut,
  Plus, Tag, CheckCircle, Circle, Pencil, Trash2, Zap, Save, XCircle, Gamepad2,
  Send, ShieldCheck, ShieldOff, ShieldAlert, ImagePlus, Loader2, Package, Star, Users, Bell, BellOff, Key,
  UserPlus, UserMinus, Check, ArrowRightLeft, Settings, FileText, BookOpen
} from "lucide-react";
import { GuidesPanel } from "./Guides";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

interface SessionSummary {
  sessionId: string;
  userName: string;
  userEmail: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string | null;
  firstMessage: string | null;
  status: string;
  tags: string[];
  problemType: string | null;
  gameName: string | null;
  adminActive: boolean;
  contactRequested?: boolean;
  assignedTo: number | null;
  assignedToName: string | null;
  assignedToColor: string | null;
  blockedAt: string | null;
  lastMessageContent: string | null;
  lastMessageSender: string | null;
  lastAutoEmailAt: string | null;
  lastManualEmailAt: string | null;
}

interface BrowseProduct {
  id: number;
  name: string;
  platform: string;
  price: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  availability: string;
  description: string | null;
  category: string;
}

interface SearchResult {
  sessionId: string;
  userName: string;
  userEmail: string;
  messages: Message[];
}

interface CannedResponse {
  id: number;
  shortcut: string;
  content: string;
}

interface RatingData {
  id: number;
  sessionId: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string | null;
  timestamp: string;
}

const PREDEFINED_TAGS: string[] = ["Venta", "Soporte", "Urgente", "Resuelto", "Pendiente", "Reembolso", "Entrega", "Seguimiento", "VIP", "Reclamo"];

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Venta": { bg: "rgba(34,197,94,0.15)", text: "#22c55e", border: "rgba(34,197,94,0.3)" },
  "Soporte": { bg: "rgba(59,130,246,0.15)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  "Urgente": { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  "Resuelto": { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  "Pendiente": { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  "Reembolso": { bg: "rgba(168,85,247,0.15)", text: "#a855f7", border: "rgba(168,85,247,0.3)" },
  "Entrega": { bg: "rgba(6,182,212,0.15)", text: "#06b6d4", border: "rgba(6,182,212,0.3)" },
  "Seguimiento": { bg: "rgba(249,115,22,0.15)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  "VIP": { bg: "rgba(234,179,8,0.15)", text: "#eab308", border: "rgba(234,179,8,0.3)" },
  "Reclamo": { bg: "rgba(244,63,94,0.15)", text: "#f43f5e", border: "rgba(244,63,94,0.3)" },
};

const CUSTOM_TAG_COLORS = [
  { bg: "rgba(139,92,246,0.15)", text: "#8b5cf6", border: "rgba(139,92,246,0.3)" },
  { bg: "rgba(236,72,153,0.15)", text: "#ec4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(20,184,166,0.15)", text: "#14b8a6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(99,102,241,0.15)", text: "#6366f1", border: "rgba(99,102,241,0.3)" },
  { bg: "rgba(251,146,60,0.15)", text: "#fb923c", border: "rgba(251,146,60,0.3)" },
];

function getTagColor(tag: string) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return CUSTOM_TAG_COLORS[Math.abs(hash) % CUSTOM_TAG_COLORS.length];
}

function getAuthToken(): string {
  try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
}

function setAuthToken(token: string) {
  try { localStorage.setItem("admin_token", token); } catch {}
}

function clearAuthToken() {
  try { localStorage.removeItem("admin_token"); localStorage.removeItem("admin_user"); } catch {}
}

function getStoredUser(): { id: number; email: string; role: string; displayName: string } | null {
  try {
    const stored = localStorage.getItem("admin_user");
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function setStoredUser(user: { id: number; email: string; role: string; displayName: string }) {
  try { localStorage.setItem("admin_user", JSON.stringify(user)); } catch {}
}

function adminFetch(url: string, options?: RequestInit) {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: string | Date | null) {
  if (!date) return "";
  return `${formatDate(date)} ${formatTime(date)}`;
}

function invalidateSessionLists() {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey as string[];
      return key[0] === "/api/admin/sessions" && key.length <= 2;
    }
  });
}

function parseAdminQuickReplies(content: string): string {
  const marker = "{{QUICK_REPLIES:";
  const idx = content.indexOf(marker);
  if (idx !== -1) return content.substring(0, idx).trim();
  return content.replace(/\[BTN:[^|]+\|URL:[^\]]+\]/g, "").trim();
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[#10b981]/40 text-white rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

function AdminLogin({ onLogin }: { onLogin: (user: { id: number; email: string; role: string; displayName: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
        setStoredUser(data.user);
        onLogin(data.user);
      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <img src={logoSinFondo} alt="FoxBot" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-xl font-bold text-white mb-1">FoxBot Admin</h1>
          <p className="text-sm text-white/40">Inicia sesion para acceder al panel</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            data-testid="input-admin-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Correo electronico"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#10b981] focus-visible:border-[#10b981]"
            autoFocus
          />
          <Input
            data-testid="input-admin-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#10b981] focus-visible:border-[#10b981]"
          />
          {error && (
            <p data-testid="text-login-error" className="text-sm text-red-400">{error}</p>
          )}
          <Button
            data-testid="button-admin-login"
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-[#10b981] border-[#10b981] text-white"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
  '#F4511E', '#6D4C41', '#757575', '#546E7A'
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

const SessionCard = memo(function SessionCard({ session, onClick, isSelected, rating, localUnread, isRecentlyUpdated, onDelete, isAdmin }: { session: SessionSummary; onClick: () => void; isSelected: boolean; rating?: RatingData; localUnread?: number; isRecentlyUpdated?: boolean; onDelete?: (sessionId: string) => void; isAdmin?: boolean }) {
  const totalUnread = (session.unreadCount || 0) + (localUnread || 0);
  const agentColor = session.assignedToColor;
  const hasAgent = !!agentColor;
  const [showPreview, setShowPreview] = useState(false);
  const cardStyle: React.CSSProperties = hasAgent
    ? isSelected
      ? { backgroundColor: `${agentColor}40`, borderColor: `${agentColor}70` }
      : { backgroundColor: `${agentColor}30`, borderColor: `${agentColor}55` }
    : {};
  return (
    <div className="relative">
    <button
      data-testid={`session-card-${session.sessionId}`}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md border transition-all ${
        isSelected
          ? hasAgent ? "" : "bg-[#10b981]/15 border-[#10b981]/40"
          : hasAgent
            ? ""
            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
      } ${isRecentlyUpdated ? 'ring-2 ring-red-500/70 ring-offset-1 ring-offset-transparent' : ''}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (hasAgent && !isSelected) {
          e.currentTarget.style.backgroundColor = `${agentColor}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasAgent && !isSelected) {
          e.currentTarget.style.backgroundColor = `${agentColor}30`;
        }
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative flex-shrink-0">
          <div
            data-testid={`avatar-${session.sessionId}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: getAvatarColor(session.userName || session.userEmail || session.sessionId) }}
          >
            {getInitial(session.userName || session.userEmail)}
          </div>
          <span
            data-testid={`status-dot-${session.sessionId}`}
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${
              session.status === "active" ? "bg-green-500" : "bg-white/30"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.userName || "Sin nombre"}</p>
          <p className="text-[11px] text-white/40 truncate">{session.userEmail || "Sin correo"}</p>
          {session.lastMessageContent && (
            <p className="text-[11px] text-white/40 truncate mt-0.5" data-testid={`last-msg-preview-${session.sessionId}`}>
              {session.lastMessageSender === 'admin' ? 'Agente: ' : session.lastMessageSender === 'bot' ? 'Bot: ' : ''}{session.lastMessageContent.replace(/\{\{QUICK_REPLIES:.*?\}\}/g, '').substring(0, 80)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {totalUnread > 0 && (
            <span
              data-testid={`badge-unread-${session.sessionId}`}
              className="flex items-center justify-center min-w-[26px] h-[26px] px-2 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/50 animate-bounce"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              data-testid={`preview-btn-${session.sessionId}`}
              onClick={(e) => { e.stopPropagation(); setShowPreview(!showPreview); }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[#10b981]/20 border border-[#10b981]/30 hover:bg-[#10b981]/40 transition-colors"
              title="Ver formulario pre-chat"
            >
              <FileText className="w-3.5 h-3.5 text-[#34d399]" />
            </button>
            {isAdmin && onDelete && (
              <button
                data-testid={`delete-btn-${session.sessionId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Eliminar el chat de ${session.userName || session.userEmail}? Esta accion no se puede deshacer.`)) {
                    onDelete(session.sessionId);
                  }
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 transition-colors"
                title="Eliminar este chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
      {(session.problemType || session.gameName) && (
        <div className="flex items-center gap-2 pl-10 mb-1 flex-wrap">
          {session.problemType && (
            <span className="text-[10px] font-medium text-orange-300 bg-orange-500/15 px-1.5 py-0.5 rounded border border-orange-500/30">{session.problemType}</span>
          )}
          {session.gameName && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/55">
              <Gamepad2 className="w-2.5 h-2.5" />
              {session.gameName}
            </span>
          )}
        </div>
      )}
      {session.tags && session.tags.length > 0 && (
        <div className="flex items-center gap-1 pl-10 mb-1 flex-wrap">
          {session.tags.map((tag) => {
            const tc = getTagColor(tag);
            return (
              <span
                key={tag}
                data-testid={`session-tag-${session.sessionId}-${tag}`}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-white/30 pl-10 flex-wrap">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {session.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(session.lastMessage)}
        </span>
        {session.adminActive ? (
          <span data-testid={`badge-ejecutivo-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Ejecutivo
          </span>
        ) : session.contactRequested ? (
          <span data-testid={`badge-solicita-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Solicita Ejecutivo
          </span>
        ) : (
          <span data-testid={`badge-bot-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Bot
          </span>
        )}
        {session.assignedToName && (
          <span 
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold truncate max-w-[100px]"
            style={{ 
              backgroundColor: `${session.assignedToColor || '#10b981'}25`,
              color: session.assignedToColor || '#10b981',
              border: `1px solid ${session.assignedToColor || '#10b981'}40`,
            }}
          >
            {session.assignedToName}
          </span>
        )}
        {rating && (
          <span data-testid={`session-rating-${session.sessionId}`} className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-2.5 h-2.5 ${s <= rating.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
            ))}
          </span>
        )}
        {session.lastAutoEmailAt && (
          <span data-testid={`badge-auto-email-${session.sessionId}`} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" title={`Correo automatico: ${new Date(session.lastAutoEmailAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}`}>
            <Mail className="w-2.5 h-2.5" />
            Auto
          </span>
        )}
        {session.lastManualEmailAt && (
          <span data-testid={`badge-manual-email-${session.sessionId}`} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30" title={`Correo manual: ${new Date(session.lastManualEmailAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}`}>
            <Mail className="w-2.5 h-2.5" />
            Correo
          </span>
        )}
      </div>
    </button>
    {showPreview && (
      <div
        data-testid={`preview-popup-${session.sessionId}`}
        className="mt-1 border border-white/[0.12] rounded-lg shadow-xl shadow-black/60 overflow-hidden"
        style={{ backgroundColor: "#1a1a2e", opacity: 1 }}
      >
        <div className="border-b border-white/[0.06] px-4 py-2 flex items-center justify-between" style={{ backgroundColor: "#1f1f38" }}>
          <span className="text-xs font-medium text-white/50">Formulario pre-chat</span>
          <button onClick={(e) => { e.stopPropagation(); setShowPreview(false); }} className="text-white/30 hover:text-white/60">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <div>
            <p className="text-[10px] text-white/40">Nombre:</p>
            <p className="text-[13px] text-white/90 font-medium">{session.userName || "No proporcionado"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">E-mail:</p>
            <p className="text-[13px] text-[#34d399] font-medium break-all">{session.userEmail || "No proporcionado"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">En que necesitas ayuda?</p>
            <p className="text-[13px] text-white/90 font-medium">{session.problemType ? ({
              compra: "Quiero comprar un producto",
              codigo_verificacion: "Necesito un nuevo codigo de verificacion",
              candado_juego: "Me aparece un candado en mi juego",
              estado_pedido: "Quiero saber el estado de mi pedido",
              problema_plus: "Tengo problemas con mi plus",
              problema_cuenta: "Problemas con mi cuenta",
              otro: "Otro",
            } as Record<string, string>)[session.problemType] || session.problemType : "No especificado"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">Necesitas ayuda con un juego en especifico, cual?:</p>
            <p className="text-[13px] text-white/90 font-medium">{session.gameName || "No especificado"}</p>
          </div>
        </div>
        {isAdmin && onDelete && (
          <div className="px-4 py-2 border-t border-white/[0.06]">
            <button
              data-testid={`delete-session-${session.sessionId}`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`¿Eliminar el chat de ${session.userName || session.userEmail}? Esta accion no se puede deshacer.`)) {
                  onDelete(session.sessionId);
                  setShowPreview(false);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar este chat
            </button>
          </div>
        )}
      </div>
    )}
    </div>
  );
});

function TagsEditor({ sessionId, tags }: { sessionId: string; tags: string[] }) {
  const [showInput, setShowInput] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: sessionsData } = useQuery<any[]>({
    queryKey: ["/api/admin/sessions"],
  });
  const allUsedTags = useMemo(() => {
    if (!sessionsData) return [];
    const tagSet = new Set<string>();
    sessionsData.forEach((s: any) => s.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [sessionsData]);

  const { data: customTagsFromDB = [] } = useQuery<string[]>({
    queryKey: ["/api/admin/tags"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/tags");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const tagsMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/tags`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          invalidateSessionLists();
        }
        throw new Error(data.message || "Error al actualizar tags");
      }
      return res.json();
    },
    onMutate: async (newTags) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions"] });
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["/api/admin/sessions"] })
        .filter(([key]) => (key as string[]).length <= 2);
      queries.forEach(([key, old]) => {
        if (!old || !Array.isArray(old)) return;
        queryClient.setQueryData(key, old.map((s: any) =>
          s.sessionId === sessionId ? { ...s, tags: newTags } : s
        ));
      });
      return { queries };
    },
    onError: (_err, _val, context) => {
      context?.queries.forEach(([key, old]) => {
        if (old) queryClient.setQueryData(key, old);
      });
    },
    onSettled: () => {
      invalidateSessionLists();
    },
  });

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    tagsMutation.mutate([...tags, trimmed]);
    setCustomTag("");
    setShowInput(false);
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    tagsMutation.mutate(tags.filter((t) => t !== tag));
  };

  const allSuggestions = Array.from(new Set([...PREDEFINED_TAGS, ...customTagsFromDB, ...allUsedTags]));
  const availableSuggestions = allSuggestions.filter((t) => !tags.includes(t));

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => {
        const tc = getTagColor(tag);
        return (
          <span
            key={tag}
            data-testid={`tag-badge-${tag}`}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
          >
            {tag}
            <button
              data-testid={`button-remove-tag-${tag}`}
              onClick={() => removeTag(tag)}
              className="ml-0.5 opacity-60 hover:opacity-100"
              style={{ color: tc.text }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        );
      })}
      {showInput ? (
        <div className="relative">
          <div className="flex items-center gap-1">
            <Input
              data-testid="input-add-tag"
              value={customTag}
              onChange={(e) => { setCustomTag(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customTag.trim()) { addTag(customTag); }
                if (e.key === "Escape") { setShowInput(false); setCustomTag(""); setShowSuggestions(false); }
              }}
              placeholder="Escribe una etiqueta..."
              className="h-6 w-36 text-[11px] bg-white/5 border-white/10 text-white placeholder:text-white/25 px-1.5 focus-visible:ring-[#10b981]"
              autoFocus
              onFocus={() => setShowSuggestions(true)}
            />
            <button
              data-testid="button-submit-tag"
              onClick={() => { if (customTag.trim()) addTag(customTag); }}
              className="w-6 h-6 rounded bg-[#10b981]/20 flex items-center justify-center text-[#34d399] hover:bg-[#10b981]/30"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => { setShowInput(false); setCustomTag(""); setShowSuggestions(false); }}
              className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {showSuggestions && availableSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md py-1 z-50 min-w-[160px] max-h-[200px] overflow-y-auto">
              {availableSuggestions
                .filter((s) => !customTag || s.toLowerCase().includes(customTag.toLowerCase()))
                .slice(0, 15)
                .map((suggestion) => {
                  const tc = getTagColor(suggestion);
                  return (
                    <button
                      key={suggestion}
                      data-testid={`button-suggestion-${suggestion}`}
                      onClick={() => addTag(suggestion)}
                      className="w-full text-left text-[11px] hover:bg-white/[0.06] px-2 py-1.5 flex items-center gap-2"
                    >
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                      >
                        {suggestion}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <button
          data-testid="button-add-tag"
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.1]"
        >
          <Plus className="w-3 h-3" />
          <span>Etiqueta</span>
        </button>
      )}
    </div>
  );
}

function ChatViewer({ sessionId, searchQuery, sessions, adminUser }: { sessionId: string; searchQuery: string; sessions: SessionSummary[]; adminUser: { id: number; email: string; displayName: string; role: string; color?: string } | null }) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [debouncedProductQuery, setDebouncedProductQuery] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [correctingMessageId, setCorrectingMessageId] = useState<number | null>(null);
  const [correctingQuestion, setCorrectingQuestion] = useState("");
  const [correctingAnswer, setCorrectingAnswer] = useState("");
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      if (!chatContainerRef.current) return;
      const keyboardOpen = vv.height < window.innerHeight * 0.75;
      if (keyboardOpen) {
        const rect = chatContainerRef.current.getBoundingClientRect();
        const availableHeight = vv.height - Math.max(rect.top, 0);
        chatContainerRef.current.style.height = `${Math.max(availableHeight, 200)}px`;
        setTimeout(() => {
          if (replyTextareaRef.current && document.activeElement === replyTextareaRef.current) {
            replyTextareaRef.current.scrollIntoView({ block: "nearest" });
          }
        }, 100);
      } else {
        chatContainerRef.current.style.height = "";
      }
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  const currentSession = sessions.find((s) => s.sessionId === sessionId);
  const [adminActiveOverride, setAdminActiveOverride] = useState<boolean | null>(null);
  const isAdminActive = adminActiveOverride !== null ? adminActiveOverride : (currentSession?.adminActive ?? false);
  const isLockedByOther = !!(currentSession?.assignedTo && currentSession.assignedTo !== adminUser?.id);

  useEffect(() => {
    if (adminActiveOverride !== null && currentSession?.adminActive === adminActiveOverride) {
      setAdminActiveOverride(null);
    }
  }, [currentSession?.adminActive, adminActiveOverride]);

  useEffect(() => {
    setAdminActiveOverride(null);
  }, [sessionId]);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/admin/sessions", sessionId, "messages"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      invalidateSessionLists();
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: isAdminActive ? 5000 : 10000,
    staleTime: 3000,
  });

  const { data: sessionRating } = useQuery<RatingData>({
    queryKey: ["/api/admin/sessions", sessionId, "rating"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/rating`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!sessionId,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          invalidateSessionLists();
        }
        throw new Error(data.message || "Error al actualizar estado");
      }
      return res.json();
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions"] });
      const queries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
        .filter(([key]) => (key as string[]).length <= 2);
      queries.forEach(([key, old]) => {
        if (!old || !Array.isArray(old)) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, status: newStatus } : s
        ));
      });
      return { queries };
    },
    onError: (_err, _val, context) => {
      context?.queries.forEach(([key, old]) => {
        if (old) queryClient.setQueryData(key, old);
      });
    },
    onSuccess: (serverData) => {
      const allQueries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
        .filter(([key]) => (key as string[]).length <= 2);
      allQueries.forEach(([key, old]) => {
        if (!old || !Array.isArray(old)) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, ...serverData } : s
        ));
      });
    },
    onSettled: () => {
      setTimeout(() => invalidateSessionLists(), 500);
    },
  });

  const adminActiveMutation = useMutation({
    mutationFn: async (adminActive: boolean) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/admin-active`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ adminActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          invalidateSessionLists();
        }
        throw new Error(data.message || "Error al cambiar modo admin");
      }
      return res.json();
    },
    onMutate: async (adminActive) => {
      const prevOverride = adminActiveOverride;
      const prevServerValue = currentSession?.adminActive ?? false;
      setAdminActiveOverride(adminActive);
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions"] });
      const queries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] });
      queries.forEach(([key, old]) => {
        if (!old) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, adminActive } : s
        ));
      });
      return { queries, prevOverride, prevServerValue };
    },
    onError: (err, _val, context) => {
      setAdminActiveOverride(context?.prevServerValue ?? null);
      context?.queries.forEach(([key, old]) => {
        if (old) queryClient.setQueryData(key, old);
      });
      toast({ title: "Error", description: (err as Error).message || "Error al cambiar modo admin", variant: "destructive" });
    },
    onSuccess: (serverData) => {
      const allQueries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
        .filter(([key]) => (key as string[]).length <= 2);
      allQueries.forEach(([key, old]) => {
        if (!old || !Array.isArray(old)) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, ...serverData } : s
        ));
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      invalidateSessionLists();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { content?: string; imageUrl?: string }) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/reply`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.locked) {
          invalidateSessionLists();
        }
        throw new Error(errData.message || "Error al enviar respuesta");
      }
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      const prev = queryClient.getQueryData<Message[]>(["/api/admin/sessions", sessionId, "messages"]);
      const tempId = -Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        sessionId,
        userEmail: "",
        userName: "Soporte",
        sender: "support",
        content: data.content || (data.imageUrl ? "Imagen enviada" : ""),
        imageUrl: data.imageUrl || null,
        adminName: adminUser?.displayName || null,
        adminColor: adminUser?.color || "#10b981",
        timestamp: new Date(),
      };
      queryClient.setQueryData<Message[]>(
        ["/api/admin/sessions", sessionId, "messages"],
        (old) => [...(old || []), optimisticMsg]
      );
      return { prev, tempId };
    },
    onError: (err, _data, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["/api/admin/sessions", sessionId, "messages"], context.prev);
      }
      toast({ title: "Error", description: (err as Error).message || "Error al enviar respuesta", variant: "destructive" });
    },
    onSuccess: (serverMsg, _data, context) => {
      setReplyText("");
      queryClient.setQueryData<Message[]>(
        ["/api/admin/sessions", sessionId, "messages"],
        (old) => {
          if (!old) return [serverMsg];
          const cleaned = old.filter(m => m.id !== context?.tempId && m.id !== serverMsg.id);
          return [...cleaned, serverMsg];
        }
      );
      invalidateSessionLists();
      setTimeout(() => replyTextareaRef.current?.focus(), 100);
    },
  });

  const sendRatingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/send-rating`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          invalidateSessionLists();
        }
        throw new Error(data.message || "Error al enviar encuesta");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "rating"] });
      invalidateSessionLists();
    },
  });

  const correctBotMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; sourceSessionId: string }) => {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "faq",
          question: data.question,
          answer: data.answer,
          keywords: data.question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2),
          confidence: 95,
          status: "approved",
          sourceSessionId: data.sourceSessionId,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar correccion");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Correccion guardada", description: "El bot aprendera de esta correccion." });
      setCorrectingMessageId(null);
      setCorrectingQuestion("");
      setCorrectingAnswer("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/send-email`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al enviar correo");
      }
      return res.json();
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (action: "claim" | "unclaim") => {
      const endpoint = action === "claim" ? "claim" : "unclaim";
      const res = await fetch(`/api/admin/sessions/${sessionId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          invalidateSessionLists();
        }
        throw new Error(data.message || "Error");
      }
      return { action, data: await res.json() };
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions"] });
      const queries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] });
      queries.forEach(([key, old]) => {
        if (!old) return;
        queryClient.setQueryData(key, old.map(s => {
          if (s.sessionId !== sessionId) return s;
          if (action === "claim") {
            return { ...s, assignedTo: adminUser?.id ?? null, assignedToName: adminUser?.displayName ?? null, assignedToColor: adminUser?.color ?? '#10b981' };
          }
          return { ...s, assignedTo: null, assignedToName: null, assignedToColor: null };
        }));
      });
      return { queries };
    },
    onError: (err, _action, context) => {
      context?.queries.forEach(([key, old]) => {
        if (old) queryClient.setQueryData(key, old);
      });
      toast({ title: "Error", description: (err as Error).message || "Error en la operacion", variant: "destructive" });
    },
    onSuccess: (result) => {
      const allQueries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
        .filter(([key]) => (key as string[]).length <= 2);
      allQueries.forEach(([key, old]) => {
        if (!old || !Array.isArray(old)) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, ...result.data } : s
        ));
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
    },
    onSettled: () => {
      setTimeout(() => invalidateSessionLists(), 500);
    },
  });

  const { data: adminUsersList = [] } = useQuery<{ id: number; displayName: string; color?: string; role: string }[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [showTransferMenu, setShowTransferMenu] = useState(false);

  const transferMutation = useMutation({
    mutationFn: async (targetAgentId: number) => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/transfer`, {
        method: "PATCH",
        body: JSON.stringify({ targetAgentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al transferir");
      }
      return res.json();
    },
    onSuccess: (data) => {
      invalidateSessionLists();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      setShowTransferMenu(false);
    },
  });

  useEffect(() => {
    if (!showTransferMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-testid="button-transfer-session"]') && !target.closest('.transfer-dropdown')) {
        setShowTransferMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTransferMenu]);

  const isBlocked = !!currentSession?.blockedAt;

  const blockMutation = useMutation({
    mutationFn: async (action: "block" | "unblock") => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/${action}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      invalidateSessionLists();
    },
  });

  const { uploadFile: adminUploadFile, isUploading: adminIsUploading } = useUpload({
    onSuccess: (response) => {
      replyMutation.mutate({ imageUrl: response.objectPath });
    },
  });

  const handleAdminImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    if (file.size > 50 * 1024 * 1024) return;
    await adminUploadFile(file);
    if (adminFileInputRef.current) adminFileInputRef.current.value = "";
  }, [adminUploadFile]);

  const { data: cannedResponses = [] } = useQuery<CannedResponse[]>({
    queryKey: ["/api/admin/canned-responses"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/canned-responses");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdminActive,
  });

  const filteredCanned = cannedResponses.filter((r) =>
    !slashFilter || r.shortcut.toLowerCase().includes(slashFilter.toLowerCase()) || r.content.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const handleReplyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    if (val === "/") {
      setShowSlashMenu(true);
      setSlashFilter("");
      setSlashSelectedIndex(0);
    } else if (val.startsWith("/") && val.length > 1) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1));
      setSlashSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
      setSlashFilter("");
      setSlashSelectedIndex(0);
    }
  };

  const selectCannedResponse = (r: CannedResponse) => {
    setReplyText(r.content);
    setShowSlashMenu(false);
    setSlashFilter("");
    setSlashSelectedIndex(0);
    setTimeout(() => replyTextareaRef.current?.focus(), 50);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductQuery(productQuery), 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  const { data: browseProducts = [] } = useQuery<BrowseProduct[]>({
    queryKey: ["/api/products/browse", debouncedProductQuery],
    queryFn: async () => {
      if (!debouncedProductQuery || debouncedProductQuery.length < 2) return [];
      const res = await fetch(`/api/products/browse?q=${encodeURIComponent(debouncedProductQuery)}&limit=20`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || data;
    },
    enabled: showProductSearch && debouncedProductQuery.length >= 2,
  });

  const handleProductSend = (product: BrowseProduct) => {
    const btnJson = product.productUrl ? JSON.stringify([{ label: "Ir a comprar", url: product.productUrl }]) : "";
    const content = `Te recomiendo este producto: ${product.name}. Precio: ${product.price || "Consultar"}. Entrega digital inmediata a tu correo.${btnJson ? `{{QUICK_REPLIES:${btnJson}}}` : ""}`;
    replyMutation.mutate({ content }, {
      onSuccess: () => {
        setShowProductSearch(false);
        setProductQuery("");
        setDebouncedProductQuery("");
      },
    });
  };

  const handleReplySend = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ content: replyText.trim() });
    if (replyTextareaRef.current) replyTextareaRef.current.style.height = "auto";
  };

  const activeSearch = showLocalSearch ? localSearch : "";

  const filteredMessages = activeSearch && activeSearch.length >= 2
    ? messages.filter(m => m.content.toLowerCase().includes(activeSearch.toLowerCase()))
    : messages;

  const userName = currentSession?.userName || messages.find(m => m.sender === "user")?.userName || "";
  const userEmail = currentSession?.userEmail || messages.find(m => m.sender === "user")?.userEmail || "";
  const sessionStatus = currentSession?.status || "active";
  const sessionTags = currentSession?.tags || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={chatContainerRef} className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex-shrink-0 z-30 bg-[#111] border-b border-white/[0.06] sticky top-0 shadow-md">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#10b981]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#34d399]" />
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${
                  sessionStatus === "active" ? "bg-green-500" : "bg-white/30"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{userName || "Usuario"}</p>
              <p className="text-[10px] sm:text-[11px] text-white/40 truncate">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {currentSession?.assignedTo === adminUser?.id && (
              <div className="relative">
                <Button
                  data-testid="button-transfer-session"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTransferMenu(!showTransferMenu)}
                  className="text-amber-400 h-8 w-8"
                  disabled={transferMutation.isPending}
                  title="Transferir"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
                {showTransferMenu && (
                  <div className="transfer-dropdown absolute top-full right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-md shadow-xl z-50 min-w-[180px] py-1">
                    <p className="text-[10px] text-white/40 px-3 py-1 border-b border-white/[0.06]">Transferir a:</p>
                    {adminUsersList
                      .filter(u => u.id !== adminUser?.id)
                      .map(agent => (
                        <button
                          key={agent.id}
                          data-testid={`transfer-to-${agent.id}`}
                          onClick={() => {
                            if (confirm(`¿Transferir este chat a ${agent.displayName}?`)) {
                              transferMutation.mutate(agent.id);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color || '#10b981' }} />
                          <span>{agent.displayName}</span>
                          <span className="text-[10px] text-white/30 ml-auto">{agent.role === "admin" ? "Admin" : "Ejecutivo"}</span>
                        </button>
                      ))}
                    {adminUsersList.filter(u => u.id !== adminUser?.id).length === 0 && (
                      <p className="text-[10px] text-white/30 px-3 py-2">No hay otros agentes disponibles</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentSession?.assignedTo === adminUser?.id ? (
              <Button
                data-testid="button-exit-chat"
                variant="ghost"
                size="sm"
                onClick={() => claimMutation.mutate("unclaim")}
                disabled={claimMutation.isPending}
                className="text-[10px] sm:text-xs px-2 h-8 flex-shrink-0 text-orange-400"
              >
                <ShieldOff className="w-3.5 h-3.5 mr-1" />
                Salir
              </Button>
            ) : !currentSession?.assignedTo ? (
              <Button
                data-testid="button-enter-chat"
                variant="ghost"
                size="sm"
                onClick={() => adminActiveMutation.mutate(true)}
                disabled={adminActiveMutation.isPending}
                className="text-[10px] sm:text-xs px-2 h-8 flex-shrink-0 text-emerald-400"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Entrar
              </Button>
            ) : null}

          </div>
        </div>

        <div className="flex items-center justify-between px-3 sm:px-4 py-1 border-t border-white/[0.04] gap-2">
          <Select
            value={sessionStatus}
            onValueChange={(val) => statusMutation.mutate(val)}
          >
            <SelectTrigger
              data-testid="select-session-status"
              className="h-7 w-[90px] bg-transparent border-white/10 text-[10px] sm:text-xs text-white/70 flex-shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="active" className="text-xs">Activo</SelectItem>
              <SelectItem value="closed" className="text-xs">Cerrar</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5">
            <Button
              data-testid="button-send-rating"
              variant="ghost"
              size="icon"
              onClick={() => { if (confirm("¿Enviar encuesta de satisfaccion?")) sendRatingMutation.mutate(); }}
              disabled={sendRatingMutation.isPending || !!sessionRating}
              title="Enviar encuesta"
              className={`h-7 w-7 flex-shrink-0 ${sessionRating ? "text-yellow-400" : "text-white/40"}`}
            >
              <Star className={`w-3.5 h-3.5 ${sessionRating ? "fill-yellow-400" : ""}`} />
            </Button>

            <Button
              data-testid="button-manual-email"
              variant="ghost"
              size="icon"
              onClick={() => { if (confirm("¿Enviar notificacion por correo ahora?")) sendEmailMutation.mutate(); }}
              disabled={sendEmailMutation.isPending}
              title="Notificar por correo"
              className="h-7 w-7 text-[#34d399] flex-shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
            </Button>

            <Button
              data-testid="button-local-search"
              variant="ghost"
              size="icon"
              onClick={() => setShowLocalSearch(!showLocalSearch)}
              title="Buscar en chat"
              className={`h-7 w-7 flex-shrink-0 ${showLocalSearch ? "text-[#34d399]" : "text-white/40"}`}
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {showLocalSearch && (
          <div className="px-3 sm:px-4 py-1.5 border-t border-white/[0.06] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <input
              data-testid="input-local-search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar en el chat..."
              className="flex-1 bg-transparent text-xs text-white outline-none"
              autoFocus
            />
            <button onClick={() => { setShowLocalSearch(false); setLocalSearch(""); }} className="text-white/30 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

        {currentSession?.assignedTo === adminUser?.id && (
          <div className="mt-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-emerald-300">Chat asignado a ti — El bot esta pausado. Tus respuestas se envian directamente al usuario.</span>
          </div>
        )}

        {isLockedByOther && (
          <div className="mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-[11px] text-red-300">Chat asignado a {currentSession?.assignedToName}. No puedes realizar acciones en este chat.</span>
          </div>
        )}

        <div className={`mt-2 pl-12 ${isLockedByOther ? "pointer-events-none opacity-50" : ""}`}>
          <TagsEditor sessionId={sessionId} tags={sessionTags} />
        </div>
        {sessionRating && (
          <div data-testid="session-rating-display" className="mt-2 px-4 py-2 bg-yellow-500/5 border-t border-yellow-500/10 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-white/40">Calificacion:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= sessionRating.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
              ))}
            </div>
            {sessionRating.comment && (
              <span className="text-[11px] text-white/50 italic truncate max-w-[200px]">"{sessionRating.comment}"</span>
            )}
          </div>
        )}
        {(currentSession?.lastAutoEmailAt || currentSession?.lastManualEmailAt) && (
          <div data-testid="email-history-section" className="mt-2 px-4 py-2 bg-cyan-500/5 border-t border-cyan-500/10 flex flex-col gap-1">
            {currentSession.lastAutoEmailAt && (
              <div data-testid="auto-email-log" className="flex items-center gap-1.5 text-[11px] text-cyan-400/80">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span>Correo automatico enviado: {new Date(currentSession.lastAutoEmailAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}</span>
              </div>
            )}
            {currentSession.lastManualEmailAt && (
              <div data-testid="manual-email-log" className="flex items-center gap-1.5 text-[11px] text-[#34d399]/80">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span>Correo manual enviado: {new Date(currentSession.lastManualEmailAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}</span>
              </div>
            )}
          </div>
        )}

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-3" style={{ contain: "content", WebkitOverflowScrolling: "touch" } as any}>
        {!activeSearch && currentSession && (
          <div data-testid="client-info-card" className="mx-auto w-full max-w-md">
            <div className="bg-[#1a1a2e] border border-white/[0.08] rounded-lg overflow-hidden">
              <div className="bg-white/[0.04] border-b border-white/[0.06] px-4 py-2 text-center">
                <span className="text-xs font-medium text-white/50">Formulario pre-chat</span>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div>
                  <p className="text-[11px] text-white/40 mb-0.5">Nombre:</p>
                  <p className="text-sm text-white/90 font-medium">{userName || "No proporcionado"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/40 mb-0.5">E-mail:</p>
                  <p className="text-sm text-[#34d399] font-medium break-all">{userEmail || "No proporcionado"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/40 mb-0.5">En que necesitas ayuda?</p>
                  <p className="text-sm text-white/90 font-medium">
                    {currentSession.problemType && (({
                      compra: "Quiero comprar un producto",
                      codigo_verificacion: "Necesito un nuevo codigo de verificacion",
                      candado_juego: "Me aparece un candado en mi juego",
                      estado_pedido: "Quiero saber el estado de mi pedido",
                      problema_plus: "Tengo problemas con mi plus",
                      problema_cuenta: "Problemas con mi cuenta",
                      otro: "Otro",
                    } as Record<string, string>)[currentSession.problemType] || currentSession.problemType)}
                    {!currentSession.problemType && "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/40 mb-0.5">Necesitas ayuda con un juego en especifico, cual?:</p>
                  <p className="text-sm text-white/90 font-medium">{currentSession.gameName || "No especificado"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {filteredMessages.length === 0 && activeSearch ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/30">No se encontraron mensajes con "{activeSearch}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const hasImage = !!(msg as any).imageUrl;
            const imageUrl = (msg as any).imageUrl;
            const isImageOnly = hasImage && (!msg.content || msg.content === "Imagen enviada" || msg.content === "Video enviado");
            const msgAdminName = (msg as any).adminName;
            const msgAdminColor = (msg as any).adminColor || "#10b981";
            return (
              <div
                key={msg.id}
                data-testid={`admin-message-${msg.id}`}
              >
                {!isUser && msgAdminName && (
                  <div className="flex items-center gap-1 ml-8 mb-0.5">
                    <span className="text-[10px] font-semibold" style={{ color: msgAdminColor }}>
                      {msgAdminName}
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border"
                      style={{
                        backgroundColor: `${msgAdminName ? msgAdminColor : '#10b981'}20`,
                        borderColor: `${msgAdminName ? msgAdminColor : '#10b981'}30`,
                      }}
                    >
                      <Headphones className="w-3 h-3" style={{ color: msgAdminName ? msgAdminColor : '#10b981' }} />
                    </div>
                  )}
                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white/50" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[75%]">
                    <div
                      className={`rounded-md overflow-hidden ${
                        isUser
                          ? "bg-[#10b981] text-white rounded-br-none"
                          : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
                      }`}
                      style={!isUser && msgAdminName ? { boxShadow: `inset 3px 0 0 ${msgAdminColor}60` } : undefined}
                    >
                      {hasImage && (
                        (() => {
                          const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(imageUrl || "");
                          if (isVideo) {
                            return (
                              <div className="p-1.5">
                                <video
                                  src={imageUrl}
                                  controls
                                  data-testid={`admin-message-video-${msg.id}`}
                                  className="max-w-full max-h-48 rounded-md"
                                  preload="metadata"
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="block p-1.5 cursor-pointer" onClick={() => setLightboxImage(imageUrl)}>
                              <img
                                src={imageUrl}
                                alt="Imagen compartida"
                                data-testid={`admin-message-image-${msg.id}`}
                                className="max-w-full max-h-48 object-contain cursor-pointer rounded-md"
                                loading="lazy"
                              />
                            </div>
                          );
                        })()
                      )}
                      {!isImageOnly && (
                        <div className="px-3 py-2 text-sm leading-relaxed break-words">
                          {activeSearch ? highlightText(parseAdminQuickReplies(msg.content), activeSearch) : parseAdminQuickReplies(msg.content)}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-white/25">
                        {formatDateTime(msg.timestamp)}
                      </span>
                      {!isUser && !msgAdminName && msg.content && !msg.content.startsWith("{{") && !msg.content.includes("se ha unido") && !msg.content.includes("ha salido") && (
                        <button
                          data-testid={`button-correct-bot-${msg.id}`}
                          onClick={() => {
                            const prevUserMsg = messages.slice(0, messages.indexOf(msg)).reverse().find(m => m.sender === "user");
                            setCorrectingMessageId(msg.id);
                            setCorrectingQuestion(prevUserMsg?.content || "");
                            const originalContent = (msg.content || "").replace(/\{\{QUICK_REPLIES:[\s\S]*?\}\}/g, "").trim();
                            setCorrectingAnswer(originalContent);
                          }}
                          className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors"
                          title="Corregir respuesta del bot"
                        >
                          Corregir bot
                        </button>
                      )}
                    </div>
                    {correctingMessageId === msg.id && (
                      <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
                        <p className="text-xs text-amber-300/80 font-medium">Corregir respuesta del bot</p>
                        <div>
                          <label className="text-[11px] text-white/40 block mb-1">Pregunta del usuario:</label>
                          <textarea
                            data-testid="input-correct-question"
                            value={correctingQuestion}
                            onChange={(e) => setCorrectingQuestion(e.target.value)}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-y min-h-[40px]"
                            placeholder="¿Que pregunto el usuario?"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-white/40 block mb-1">Respuesta correcta:</label>
                          <textarea
                            data-testid="input-correct-answer"
                            value={correctingAnswer}
                            onChange={(e) => setCorrectingAnswer(e.target.value)}
                            rows={6}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-y min-h-[120px]"
                            placeholder="¿Que deberia responder el bot?"
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            data-testid="button-cancel-correction"
                            size="sm"
                            variant="ghost"
                            onClick={() => { setCorrectingMessageId(null); setCorrectingQuestion(""); setCorrectingAnswer(""); }}
                            className="text-xs text-white/50"
                          >
                            Cancelar
                          </Button>
                          <Button
                            data-testid="button-save-correction"
                            size="sm"
                            onClick={() => correctBotMutation.mutate({ question: correctingQuestion, answer: correctingAnswer, sourceSessionId: sessionId })}
                            disabled={!correctingQuestion.trim() || !correctingAnswer.trim() || correctBotMutation.isPending}
                            className="text-xs bg-amber-600 text-white"
                          >
                            {correctBotMutation.isPending ? "Guardando..." : "Guardar y ensenar al bot"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isLockedByOther ? (
        <div className="flex-shrink-0 px-3 py-3 text-center border-t border-white/[0.06]">
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs text-red-300/70">
              Chat asignado a {currentSession?.assignedToName}. Solo el agente asignado puede responder.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 z-30 bg-[#111] relative">
          {showSlashMenu && (
            <div data-testid="slash-command-menu" className="absolute bottom-full left-0 right-0 bg-[#1a1a2e] border border-white/10 rounded-t-md max-h-48 overflow-y-auto z-20">
              <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wide">Respuestas rapidas</div>
              {filteredCanned.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-white/30">No se encontraron atajos</div>
              ) : (
                filteredCanned.map((r, idx) => (
                  <button
                    key={r.id}
                    data-testid={`slash-option-${r.id}`}
                    onClick={() => selectCannedResponse(r)}
                    className={`w-full text-left px-3 py-2 transition-colors border-b border-white/[0.04] last:border-0 ${idx === slashSelectedIndex ? "bg-[#10b981]/15" : "hover:bg-white/[0.06]"}`}
                  >
                    <span className="text-xs font-mono text-[#34d399]">/{r.shortcut}</span>
                    <p className="text-xs text-white/50 truncate mt-0.5">{r.content}</p>
                  </button>
                ))
              )}
            </div>
          )}
          {showProductSearch && (
            <div data-testid="product-search-panel" className="absolute bottom-full left-0 right-0 bg-[#1a1a2e] border border-white/10 rounded-t-md max-h-72 flex flex-col z-10">
              <div className="p-2 border-b border-white/[0.06] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  data-testid="input-product-search-chat"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                  autoFocus
                />
                <button
                  data-testid="button-close-product-search"
                  onClick={() => { setShowProductSearch(false); setProductQuery(""); setDebouncedProductQuery(""); }}
                  className="text-white/30 hover:text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {debouncedProductQuery.length < 2 ? (
                  <div className="p-4 text-center text-xs text-white/30">Escribe al menos 2 caracteres para buscar</div>
                ) : browseProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/30">No se encontraron productos</div>
                ) : (
                  browseProducts.map((p) => (
                    <button
                      key={p.id}
                      data-testid={`product-send-${p.id}`}
                      onClick={() => handleProductSend(p)}
                      disabled={replyMutation.isPending}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white truncate">{p.name}</span>
                        <span className="text-[10px] bg-[#34d399]/15 text-[#34d399] px-1.5 py-0.5 rounded flex-shrink-0">{getPlatformLabel(p.platform)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.price && <span className="text-xs text-green-400">{p.price}</span>}
                        <span className={`text-[10px] ${p.availability === "available" ? "text-green-400/60" : "text-red-400/60"}`}>
                          {getAvailabilityLabel(p.availability)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-white/[0.06] bg-[#111] sticky bottom-0 safe-area-bottom">
              <div className="flex items-end gap-2">
                <input
                  ref={adminFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleAdminImageSelect}
                  className="hidden"
                  data-testid="input-admin-image-file"
                />
                <Button
                  data-testid="button-admin-attach-image"
                  size="icon"
                  variant="ghost"
                  onClick={() => adminFileInputRef.current?.click()}
                  disabled={adminIsUploading}
                  className="text-white/40 flex-shrink-0"
                >
                  {adminIsUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#34d399]" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  data-testid="button-admin-product-search"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                  className={`flex-shrink-0 ${showProductSearch ? "text-[#34d399]" : "text-white/40"}`}
                >
                  <Package className="w-4 h-4" />
                </Button>
                <textarea
                  ref={replyTextareaRef}
                  data-testid="input-admin-reply"
                  value={replyText}
                  onChange={(e) => {
                    handleReplyInputChange(e);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && showSlashMenu) { setShowSlashMenu(false); setSlashFilter(""); setSlashSelectedIndex(0); return; }
                    if (showSlashMenu && filteredCanned.length > 0) {
                      if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelectedIndex((prev) => (prev + 1) % filteredCanned.length); return; }
                      if (e.key === "ArrowUp") { e.preventDefault(); setSlashSelectedIndex((prev) => (prev - 1 + filteredCanned.length) % filteredCanned.length); return; }
                    }
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (showSlashMenu) { if (filteredCanned.length > 0) selectCannedResponse(filteredCanned[slashSelectedIndex]); } else { handleReplySend(); (e.target as HTMLTextAreaElement).style.height = "auto"; } }
                  }}
                  placeholder="Escribe tu respuesta... (/ para atajos)"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#10b981]/30 rounded-md px-3 py-2 resize-none overflow-y-auto"
                  style={{ maxHeight: "120px" }}
                />
                <Button
                  data-testid="button-admin-send"
                  size="icon"
                  onClick={handleReplySend}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="bg-[#10b981] text-white flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="admin-image-lightbox-overlay"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            className="absolute top-4 right-4 z-[10000] w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            data-testid="button-admin-close-lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage || ""}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            data-testid="admin-lightbox-image"
          />
        </div>
      )}
    </div>
  );
}

interface AdminProduct {
  id: number;
  wcProductId: number | null;
  name: string;
  searchAliases: string[];
  platform: string;
  price: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  availability: string;
  description: string | null;
  category: string;
  accountType: string;
  wcLastSync: string | null;
}

interface WCSyncStatus {
  lastSync: string | null;
  productCount: number;
  wcProductCount: number;
  storeUrl: string;
  configured: boolean;
}

interface WCSyncResult {
  total: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
  details: string[];
}

const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "ps4", label: "PS4" },
  { value: "ps5", label: "PS5" },
  { value: "xbox_one", label: "Xbox One" },
  { value: "xbox_series", label: "Xbox Series" },
  { value: "pc", label: "PC" },
  { value: "nintendo", label: "Nintendo" },
];

const CATEGORY_OPTIONS = [
  { value: "game", label: "Juego" },
  { value: "subscription", label: "Suscripcion" },
  { value: "card", label: "Tarjeta" },
  { value: "bundle", label: "Bundle" },
  { value: "console", label: "Consola" },
  { value: "accessory", label: "Accesorio" },
  { value: "other", label: "Otro" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "out_of_stock", label: "Agotado" },
  { value: "preorder", label: "Pre-orden" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "no_aplica", label: "No aplica" },
  { value: "primaria", label: "Primaria" },
  { value: "secundaria", label: "Secundaria" },
];

function getAvailabilityColor(avail: string) {
  if (avail === "available") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (avail === "out_of_stock") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

function getAvailabilityLabel(avail: string) {
  const opt = AVAILABILITY_OPTIONS.find(o => o.value === avail);
  return opt?.label || avail;
}

function getPlatformLabel(platform: string) {
  const opt = PLATFORM_OPTIONS.find(o => o.value === platform);
  return opt?.label || platform;
}

function getCategoryLabel(category: string) {
  const opt = CATEGORY_OPTIONS.find(o => o.value === category);
  return opt?.label || category;
}

function getAccountTypeLabel(accountType: string) {
  const opt = ACCOUNT_TYPE_OPTIONS.find(o => o.value === accountType);
  return opt?.label || accountType;
}

function getAccountTypeColor(accountType: string) {
  if (accountType === "primaria") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  if (accountType === "secundaria") return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  return "";
}

function WCSyncSection() {
  const [syncResult, setSyncResult] = useState<WCSyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: wcStatus } = useQuery<WCSyncStatus>({
    queryKey: ["/api/admin/wc/status"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/wc/status");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/wc/sync", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error en sincronizacion");
      }
      return res.json() as Promise<WCSyncResult>;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      setShowDetails(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wc/status"] });
    },
    onError: (err: Error) => {
      setSyncResult({ total: 0, created: 0, updated: 0, errors: 1, skipped: 0, details: [err.message] });
      setShowDetails(true);
    },
  });

  if (!wcStatus?.configured) return null;

  return (
    <div className="flex items-center gap-2">
      {syncResult && showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDetails(false)}>
          <div
            data-testid="wc-sync-results"
            className="bg-[#1a1a2e] border border-white/10 rounded-md p-4 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Resultado de Sincronizacion</h3>
              <button data-testid="button-close-sync-result" onClick={() => setShowDetails(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-white/5 rounded p-2">
                <span className="text-white/40">Total WC:</span>
                <span className="text-white ml-1 font-medium">{syncResult.total}</span>
              </div>
              <div className="bg-green-500/10 rounded p-2">
                <span className="text-green-400/60">Creados:</span>
                <span className="text-green-400 ml-1 font-medium">{syncResult.created}</span>
              </div>
              <div className="bg-blue-500/10 rounded p-2">
                <span className="text-blue-400/60">Actualizados:</span>
                <span className="text-blue-400 ml-1 font-medium">{syncResult.updated}</span>
              </div>
              <div className="bg-red-500/10 rounded p-2">
                <span className="text-red-400/60">Errores:</span>
                <span className="text-red-400 ml-1 font-medium">{syncResult.errors}</span>
              </div>
            </div>
            {syncResult.details.length > 0 && (
              <div className="text-xs text-white/50 space-y-1 max-h-48 overflow-y-auto">
                {syncResult.details.map((d, i) => (
                  <div key={i} className={`${d.startsWith("Error") ? "text-red-400/70" : "text-white/40"}`}>{d}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {wcStatus.wcProductCount > 0 && (
        <span className="text-[10px] text-white/30 hidden sm:inline">
          WC: {wcStatus.wcProductCount}/{wcStatus.productCount}
        </span>
      )}
      <Button
        data-testid="button-wc-sync"
        size="sm"
        variant="outline"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="text-xs border-[#10b981]/40 text-[#34d399]"
      >
        {syncMutation.isPending ? (
          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
        ) : (
          <Package className="w-3.5 h-3.5 mr-1" />
        )}
        {syncMutation.isPending ? "Sincronizando..." : "Sync WooCommerce"}
      </Button>
    </div>
  );
}

function ProductsPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    searchAliases: "",
    platform: "all",
    price: "",
    productUrl: "",
    imageUrl: "",
    description: "",
    category: "game",
    availability: "available",
    accountType: "no_aplica",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      searchAliases: "",
      platform: "all",
      price: "",
      productUrl: "",
      imageUrl: "",
      description: "",
      category: "game",
      availability: "available",
      accountType: "no_aplica",
    });
  };

  const { data: productsList = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/products");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear producto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setIsAdding(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
  });

  const startEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      searchAliases: (p.searchAliases || []).join(", "),
      platform: p.platform,
      price: p.price || "",
      productUrl: p.productUrl || "",
      imageUrl: p.imageUrl || "",
      description: p.description || "",
      category: p.category,
      availability: p.availability,
      accountType: p.accountType || "no_aplica",
    });
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    searchAliases: formData.searchAliases.split(",").map(s => s.trim()).filter(Boolean),
    platform: formData.platform,
    price: formData.price.trim() || null,
    productUrl: formData.productUrl.trim() || null,
    imageUrl: formData.imageUrl.trim() || null,
    description: formData.description.trim() || null,
    category: formData.category,
    availability: formData.availability,
    accountType: formData.accountType,
  });

  const handleSubmitNew = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(buildPayload());
  };

  const handleSubmitEdit = (id: number) => {
    if (!formData.name.trim()) return;
    updateMutation.mutate({ id, data: buildPayload() });
  };

  const renderForm = (onSubmit: () => void, isPending: boolean, submitLabel: string) => (
    <div className="flex flex-col gap-2">
      <Input
        data-testid="input-product-name"
        value={formData.name}
        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
        placeholder="Nombre del producto"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
        autoFocus
      />
      <Input
        data-testid="input-product-aliases"
        value={formData.searchAliases}
        onChange={(e) => setFormData(f => ({ ...f, searchAliases: e.target.value }))}
        placeholder="Aliases de busqueda (separados por coma)"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
      />
      <div className="grid grid-cols-3 gap-2">
        <Select value={formData.platform} onValueChange={(v) => setFormData(f => ({ ...f, platform: v }))}>
          <SelectTrigger data-testid="select-product-platform" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
          <SelectTrigger data-testid="select-product-category" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formData.accountType} onValueChange={(v) => setFormData(f => ({ ...f, accountType: v }))}>
          <SelectTrigger data-testid="select-product-account-type" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Tipo de Cuenta" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          data-testid="input-product-price"
          value={formData.price}
          onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
          placeholder="Precio (ej: $29.99 USD)"
          className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
        />
        <Select value={formData.availability} onValueChange={(v) => setFormData(f => ({ ...f, availability: v }))}>
          <SelectTrigger data-testid="select-product-availability" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        data-testid="input-product-url"
        value={formData.productUrl}
        onChange={(e) => setFormData(f => ({ ...f, productUrl: e.target.value }))}
        placeholder="URL del producto"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
      />
      <Input
        data-testid="input-product-description"
        value={formData.description}
        onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
        placeholder="Descripcion corta"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
      />
      <div className="flex items-center gap-1 justify-end flex-wrap">
        <Button
          data-testid="button-cancel-product"
          variant="ghost"
          size="sm"
          onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
          className="text-white/40 text-xs"
        >
          Cancelar
        </Button>
        <Button
          data-testid="button-save-product"
          size="sm"
          onClick={onSubmit}
          disabled={!formData.name.trim() || isPending}
          className="bg-[#10b981] text-white text-xs"
        >
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Catalogo de Productos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <WCSyncSection />
          <Button
            data-testid="button-add-product"
            size="sm"
            onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
            className="bg-[#10b981] text-white text-xs"
            disabled={isAdding}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#10b981]/30 bg-[#10b981]/5">
            {renderForm(handleSubmitNew, createMutation.isPending, "Crear Producto")}
          </div>
        )}

        {productsList.length === 0 && !isAdding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Package className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No hay productos en el catalogo</p>
            <p className="text-xs text-white/20 mt-1">Agrega productos para que el bot responda con precios y links</p>
          </div>
        ) : (
          productsList.map((p) => (
            <div
              key={p.id}
              data-testid={`product-card-${p.id}`}
              className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03]"
            >
              {editingId === p.id ? (
                renderForm(() => handleSubmitEdit(p.id), updateMutation.isPending, "Guardar")
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span data-testid={`text-product-name-${p.id}`} className="text-sm font-medium text-white">{p.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getAvailabilityColor(p.availability)}`}>
                        {getAvailabilityLabel(p.availability)}
                      </span>
                      {p.wcProductId && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400/60 px-1 py-0.5 rounded border border-blue-500/20">WC</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] bg-[#34d399]/15 text-[#34d399] px-1.5 py-0.5 rounded">
                        {getPlatformLabel(p.platform)}
                      </span>
                      <span className="text-[10px] bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">
                        {getCategoryLabel(p.category)}
                      </span>
                      {p.accountType && p.accountType !== "no_aplica" && (
                        <span data-testid={`text-product-account-type-${p.id}`} className={`text-[10px] px-1.5 py-0.5 rounded border ${getAccountTypeColor(p.accountType)}`}>
                          {getAccountTypeLabel(p.accountType)}
                        </span>
                      )}
                      {p.price && (
                        <span data-testid={`text-product-price-${p.id}`} className="text-xs text-green-400 font-medium">{p.price}</span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-white/40 mb-1 truncate">{p.description}</p>
                    )}
                    {p.productUrl && (
                      <a
                        data-testid={`link-product-url-${p.id}`}
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#34d399] hover:underline truncate block"
                      >
                        {p.productUrl}
                      </a>
                    )}
                    {p.searchAliases && p.searchAliases.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] text-white/25">Aliases:</span>
                        {p.searchAliases.map((alias, i) => (
                          <span key={i} className="text-[10px] text-white/30 bg-white/[0.04] px-1 py-0.5 rounded">{alias}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      data-testid={`button-edit-product-${p.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(p)}
                      className="text-white/30"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-testid={`button-delete-product-${p.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${p.name}"?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CannedResponsesPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editShortcut, setEditShortcut] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: responses = [], isLoading } = useQuery<CannedResponse[]>({
    queryKey: ["/api/admin/canned-responses"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/canned-responses");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { shortcut: string; content: string }) => {
      const res = await fetch("/api/admin/canned-responses", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
      setIsAdding(false);
      setNewShortcut("");
      setNewContent("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { shortcut?: string; content?: string } }) => {
      const res = await fetch(`/api/admin/canned-responses/${id}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/canned-responses/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
    },
  });

  const startEdit = (r: CannedResponse) => {
    setEditingId(r.id);
    setEditShortcut(r.shortcut);
    setEditContent(r.content);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Respuestas Rapidas</h2>
        <Button
          data-testid="button-add-canned-response"
          size="sm"
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="bg-[#10b981] text-white text-xs"
          disabled={isAdding}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#10b981]/30 bg-[#10b981]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-shortcut"
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                placeholder="Atajo (ej: saludo)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
                autoFocus
              />
              <Input
                data-testid="input-new-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Contenido del mensaje..."
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
              />
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Button
                  data-testid="button-cancel-add"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewShortcut(""); setNewContent(""); }}
                  className="text-white/40 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-save-new-canned"
                  size="sm"
                  onClick={() => createMutation.mutate({ shortcut: newShortcut.trim(), content: newContent.trim() })}
                  disabled={!newShortcut.trim() || !newContent.trim() || createMutation.isPending}
                  className="bg-[#10b981] text-white text-xs"
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {responses.length === 0 && !isAdding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Zap className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No hay respuestas rapidas</p>
            <p className="text-xs text-white/20 mt-1">Crea atajos para responder mas rapido</p>
          </div>
        ) : (
          responses.map((r) => (
            <div
              key={r.id}
              data-testid={`canned-response-${r.id}`}
              className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03]"
            >
              {editingId === r.id ? (
                <div className="flex flex-col gap-2">
                  <Input
                    data-testid="input-edit-shortcut"
                    value={editShortcut}
                    onChange={(e) => setEditShortcut(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#10b981]"
                  />
                  <Input
                    data-testid="input-edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#10b981]"
                  />
                  <div className="flex items-center gap-1 justify-end flex-wrap">
                    <Button
                      data-testid="button-cancel-edit"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="text-white/40 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      data-testid="button-save-edit"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: r.id, data: { shortcut: editShortcut.trim(), content: editContent.trim() } })}
                      disabled={!editShortcut.trim() || !editContent.trim() || updateMutation.isPending}
                      className="bg-[#10b981] text-white text-xs"
                    >
                      {updateMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[#34d399] bg-[#34d399]/10 px-1.5 py-0.5 rounded">/{r.shortcut}</span>
                    </div>
                    <p className="text-sm text-white/60 truncate">{r.content}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      data-testid={`button-edit-canned-${r.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(r)}
                      className="text-white/30"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-testid={`button-delete-canned-${r.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

let _adminAudioCtx: AudioContext | null = null;
let _adminNeedsUnlock = true;

function getOrCreateAdminAudioCtx(): AudioContext {
  if (!_adminAudioCtx || _adminAudioCtx.state === "closed") {
    _adminAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _adminNeedsUnlock = true;
  }
  return _adminAudioCtx;
}

function tryResumeAdminAudio() {
  try {
    const ctx = getOrCreateAdminAudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if (_adminNeedsUnlock) {
      const s = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      s.connect(g);
      g.connect(ctx.destination);
      s.start(ctx.currentTime);
      s.stop(ctx.currentTime + 0.001);
      _adminNeedsUnlock = false;
    }
  } catch {}
}

if (typeof window !== "undefined") {
  const gestureEvents = ["touchstart", "touchend", "click", "keydown"];
  const onGesture = () => tryResumeAdminAudio();
  gestureEvents.forEach(e => document.addEventListener(e, onGesture, { capture: true, passive: true }));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      _adminNeedsUnlock = true;
    }
  });
}

function playNotificationSound() {
  try {
    const ctx = getOrCreateAdminAudioCtx();
    const doPlay = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.setValueAtTime(600, t + 0.1);
      osc.frequency.setValueAtTime(800, t + 0.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(doPlay).catch(() => {});
    } else {
      doPlay();
    }
  } catch {}
}

let _notificationSelectCallback: ((sessionId: string) => void) | null = null;

function showForegroundNotification(title: string, body: string, sessionId: string, currentSessionRef?: React.RefObject<string | null>) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const isViewingThis = currentSessionRef?.current === sessionId;
    if (!document.hidden && isViewingThis) return;
    const n = new Notification(title, {
      body,
      icon: "/favicon-fox.png",
      tag: "foxbot-msg-" + sessionId,
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      if (_notificationSelectCallback) {
        _notificationSelectCallback(sessionId);
      }
      n.close();
    };
  } catch {}
}

interface KnowledgeEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  confidence: number;
  status: string;
  sourceSessionId: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function KnowledgePanel() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ sessionsProcessed: number; entriesCreated: number } | null>(null);

  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);
  if (searchQuery) queryParams.set("query", searchQuery);
  const queryString = queryParams.toString();

  const { data: entries = [], isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/admin/knowledge", queryString],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/knowledge${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/knowledge/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
    },
  });

  const handleExtract = async () => {
    setExtracting(true);
    setExtractResult(null);
    try {
      const res = await adminFetch("/api/admin/knowledge/extract", {
        method: "POST",
        body: JSON.stringify({ limit: 10 }),
      });
      if (!res.ok) throw new Error("Error");
      const result = await res.json();
      setExtractResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
    } catch (error) {
      console.error("Error extracting:", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleApprove = (id: number) => {
    updateMutation.mutate({ id, data: { status: "approved" } });
  };

  const handleReject = (id: number) => {
    updateMutation.mutate({ id, data: { status: "rejected" } });
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setEditQuestion(entry.question);
    setEditAnswer(entry.answer);
    setEditCategory(entry.category);
    setEditKeywords(entry.keywords.join(", "));
  };

  const saveEdit = () => {
    if (!editingEntry) return;
    updateMutation.mutate({
      id: editingEntry.id,
      data: {
        question: editQuestion,
        answer: editAnswer,
        category: editCategory,
        keywords: editKeywords.split(",").map(k => k.trim()).filter(Boolean),
      },
    });
  };

  const categoryLabels: Record<string, string> = {
    faq: "FAQ",
    troubleshooting: "Solucion",
    product_info: "Producto",
    policy: "Politica",
    general: "General",
  };

  const categoryColors: Record<string, { bg: string; text: string }> = {
    faq: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    troubleshooting: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    product_info: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    policy: { bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
    general: { bg: "rgba(107,114,128,0.15)", text: "#6b7280" },
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    approved: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    rejected: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#34d399]" />
            Base de Conocimiento
          </h2>
          <Button
            data-testid="button-extract-knowledge"
            onClick={handleExtract}
            disabled={extracting}
            size="sm"
            className="bg-[#10b981] hover:bg-[#7c3aed] text-white text-xs"
          >
            {extracting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Aprender de conversaciones
              </>
            )}
          </Button>
        </div>

        {extractResult && (
          <div className="text-xs p-2 rounded bg-[#10b981]/10 border border-[#10b981]/20 text-white/80">
            Procesadas {extractResult.sessionsProcessed} conversaciones. Se extrajeron {extractResult.entriesCreated} nuevas entradas de conocimiento.
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              data-testid="input-knowledge-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conocimiento..."
              className="pl-9 bg-white/5 border-white/10 text-white text-xs placeholder:text-white/25 focus-visible:ring-[#10b981] h-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-knowledge-status" className="w-[120px] bg-white/5 border-white/10 text-white text-xs h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all" className="text-white text-xs">Todos</SelectItem>
              <SelectItem value="pending" className="text-white text-xs">Pendientes</SelectItem>
              <SelectItem value="approved" className="text-white text-xs">Aprobados</SelectItem>
              <SelectItem value="rejected" className="text-white text-xs">Rechazados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger data-testid="select-knowledge-category" className="w-[120px] bg-white/5 border-white/10 text-white text-xs h-8">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all" className="text-white text-xs">Todas</SelectItem>
              <SelectItem value="faq" className="text-white text-xs">FAQ</SelectItem>
              <SelectItem value="troubleshooting" className="text-white text-xs">Solucion</SelectItem>
              <SelectItem value="product_info" className="text-white text-xs">Producto</SelectItem>
              <SelectItem value="policy" className="text-white text-xs">Politica</SelectItem>
              <SelectItem value="general" className="text-white text-xs">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#34d399] animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <Zap className="w-8 h-8 mb-2" />
            <p className="text-sm">No hay entradas de conocimiento</p>
            <p className="text-xs mt-1">Haz clic en "Aprender de conversaciones" para comenzar</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              data-testid={`knowledge-entry-${entry.id}`}
              className="bg-white/[0.03] border border-white/[0.06] rounded-md p-3 space-y-2"
            >
              {editingEntry?.id === entry.id ? (
                <div className="space-y-2">
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="faq" className="text-white text-xs">FAQ</SelectItem>
                      <SelectItem value="troubleshooting" className="text-white text-xs">Solucion</SelectItem>
                      <SelectItem value="product_info" className="text-white text-xs">Producto</SelectItem>
                      <SelectItem value="policy" className="text-white text-xs">Politica</SelectItem>
                      <SelectItem value="general" className="text-white text-xs">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    data-testid="input-edit-question"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    placeholder="Pregunta"
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                  <textarea
                    data-testid="input-edit-answer"
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    placeholder="Respuesta"
                    className="w-full bg-white/5 border border-white/10 rounded-md text-white text-xs p-2 min-h-[80px] resize-y focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                  <Input
                    data-testid="input-edit-keywords"
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="Palabras clave (separadas por coma)"
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      data-testid="button-save-edit"
                      onClick={saveEdit}
                      disabled={updateMutation.isPending}
                      size="sm"
                      className="bg-[#10b981] hover:bg-[#7c3aed] text-white text-xs"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      data-testid="button-cancel-edit"
                      onClick={() => setEditingEntry(null)}
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/60 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: categoryColors[entry.category]?.bg || categoryColors.general.bg,
                          color: categoryColors[entry.category]?.text || categoryColors.general.text,
                        }}
                      >
                        {categoryLabels[entry.category] || entry.category}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: statusColors[entry.status]?.bg || statusColors.pending.bg,
                          color: statusColors[entry.status]?.text || statusColors.pending.text,
                        }}
                      >
                        {statusLabels[entry.status] || entry.status}
                      </span>
                      {entry.usageCount > 0 && (
                        <span className="text-[10px] text-white/30">
                          Usado {entry.usageCount}x
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.status === "pending" && (
                        <>
                          <button
                            data-testid={`button-approve-${entry.id}`}
                            onClick={() => handleApprove(entry.id)}
                            className="p-1 text-green-400/60 hover:text-green-400 transition-colors"
                            title="Aprobar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            data-testid={`button-reject-${entry.id}`}
                            onClick={() => handleReject(entry.id)}
                            className="p-1 text-red-400/60 hover:text-red-400 transition-colors"
                            title="Rechazar"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        data-testid={`button-edit-${entry.id}`}
                        onClick={() => startEdit(entry)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`button-delete-${entry.id}`}
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="p-1 text-white/30 hover:text-red-400/60 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/80 font-medium">{entry.question}</p>
                    <p className="text-xs text-white/50 mt-1 line-clamp-3">{entry.answer}</p>
                  </div>
                  {entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] text-white/20">
                    {formatDateTime(entry.createdAt)}
                    {entry.confidence && ` | Confianza: ${entry.confidence}%`}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { data: aiSetting, isLoading } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "ai_enabled"],
    queryFn: async () => {
      const res = await adminFetch("/api/settings/ai_enabled");
      if (!res.ok) throw new Error("Error al obtener configuracion");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await adminFetch("/api/settings/ai_enabled", {
        method: "PUT",
        body: JSON.stringify({ value: enabled ? "true" : "false" }),
      });
      if (!res.ok) throw new Error("Error al guardar configuracion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "ai_enabled"] });
    },
  });

  const aiEnabled = aiSetting?.value !== "false";

  const { data: bhEnabledSetting, isLoading: bhEnabledLoading } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "business_hours_enabled"],
    queryFn: async () => {
      const res = await adminFetch("/api/settings/business_hours_enabled");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });
  const { data: bhStartSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "business_hours_start"],
    queryFn: async () => {
      const res = await adminFetch("/api/settings/business_hours_start");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });
  const { data: bhEndSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "business_hours_end"],
    queryFn: async () => {
      const res = await adminFetch("/api/settings/business_hours_end");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });
  const { data: bhTicketSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "business_hours_ticket_url"],
    queryFn: async () => {
      const res = await adminFetch("/api/settings/business_hours_ticket_url");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const [bhStart, setBhStart] = useState("12");
  const [bhEnd, setBhEnd] = useState("21");
  const [bhTicketUrl, setBhTicketUrl] = useState("https://foxbot.zohodesk.com/portal/es/newticket");
  const [bhInitialized, setBhInitialized] = useState(false);

  useEffect(() => {
    if (!bhInitialized && bhStartSetting !== undefined && bhEndSetting !== undefined && bhTicketSetting !== undefined) {
      setBhStart(bhStartSetting?.value || "12");
      setBhEnd(bhEndSetting?.value || "21");
      setBhTicketUrl(bhTicketSetting?.value || "https://foxbot.zohodesk.com/portal/es/newticket");
      setBhInitialized(true);
    }
  }, [bhStartSetting, bhEndSetting, bhTicketSetting, bhInitialized]);

  const bhEnabled = bhEnabledSetting?.value !== "false";

  const bhToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await adminFetch("/api/settings/business_hours_enabled", {
        method: "PUT",
        body: JSON.stringify({ value: enabled ? "true" : "false" }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "business_hours_enabled"] });
    },
  });

  const [bhSaveStatus, setBhSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const saveBhSettings = async () => {
    const startVal = Math.max(0, Math.min(23, parseInt(bhStart) || 0));
    const endVal = Math.max(0, Math.min(23, parseInt(bhEnd) || 23));
    setBhStart(String(startVal));
    setBhEnd(String(endVal));
    setBhSaveStatus("saving");
    try {
      const updates = [
        adminFetch("/api/settings/business_hours_start", { method: "PUT", body: JSON.stringify({ value: String(startVal) }) }),
        adminFetch("/api/settings/business_hours_end", { method: "PUT", body: JSON.stringify({ value: String(endVal) }) }),
        adminFetch("/api/settings/business_hours_ticket_url", { method: "PUT", body: JSON.stringify({ value: bhTicketUrl }) }),
      ];
      const results = await Promise.all(updates);
      if (results.some(r => !r.ok)) throw new Error("Error");
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "business_hours_start"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "business_hours_end"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "business_hours_ticket_url"] });
      setBhSaveStatus("success");
      setTimeout(() => setBhSaveStatus("idle"), 3000);
    } catch {
      setBhSaveStatus("error");
      setTimeout(() => setBhSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Configuracion</h2>
      <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4 max-w-lg">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#34d399]" />
          Configuracion de IA
        </h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80">Respuestas con IA</p>
            <p className="text-xs text-white/40 mt-0.5">
              Cuando esta activado, el bot utiliza inteligencia artificial para generar respuestas mas naturales y contextuales. Si se desactiva, solo se usaran respuestas predefinidas.
            </p>
          </div>
          <div className="flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white/30" />
            ) : (
              <Switch
                data-testid="switch-ai-toggle"
                checked={aiEnabled}
                disabled={toggleMutation.isPending}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              />
            )}
          </div>
        </div>
        {toggleMutation.isError && (
          <p data-testid="text-settings-error" className="text-xs text-red-400 mt-2">Error al guardar la configuracion</p>
        )}
        {toggleMutation.isSuccess && (
          <p data-testid="text-settings-success" className="text-xs text-emerald-400 mt-2">Configuracion guardada</p>
        )}
      </div>

      <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4 max-w-lg mt-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#34d399]" />
          Horario de Atencion
        </h3>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80">Activar horario de atencion</p>
            <p className="text-xs text-white/40 mt-0.5">
              Cuando esta activado, el bot solo responde dentro del horario configurado. Fuera de horario, se sugiere crear un ticket de soporte.
            </p>
          </div>
          <div className="flex-shrink-0">
            {bhEnabledLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white/30" />
            ) : (
              <Switch
                data-testid="switch-business-hours-toggle"
                checked={bhEnabled}
                disabled={bhToggleMutation.isPending}
                onCheckedChange={(checked) => bhToggleMutation.mutate(checked)}
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-white/50 mb-1 block">Hora inicio (Chile)</label>
              <Input
                data-testid="input-business-hours-start"
                type="number"
                min={0}
                max={23}
                value={bhStart}
                onChange={(e) => setBhStart(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#10b981]"
              />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-white/50 mb-1 block">Hora fin (Chile)</label>
              <Input
                data-testid="input-business-hours-end"
                type="number"
                min={0}
                max={23}
                value={bhEnd}
                onChange={(e) => setBhEnd(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#10b981]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">URL de ticket de soporte</label>
            <Input
              data-testid="input-business-hours-ticket-url"
              type="url"
              value={bhTicketUrl}
              onChange={(e) => setBhTicketUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              data-testid="button-save-business-hours"
              onClick={saveBhSettings}
              disabled={bhSaveStatus === "saving"}
              className="bg-[#10b981] text-white"
            >
              {bhSaveStatus === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Guardar horario
            </Button>
            {bhSaveStatus === "success" && (
              <p data-testid="text-bh-save-success" className="text-xs text-emerald-400">Horario guardado</p>
            )}
            {bhSaveStatus === "error" && (
              <p data-testid="text-bh-save-error" className="text-xs text-red-400">Error al guardar</p>
            )}
          </div>
        </div>
        {bhToggleMutation.isError && (
          <p data-testid="text-bh-toggle-error" className="text-xs text-red-400 mt-2">Error al cambiar el estado</p>
        )}
      </div>

      <ProfanityWordsSection />
    </div>
  );
}

function ProfanityWordsSection() {
  const [newWord, setNewWord] = useState("");
  const [customExpanded, setCustomExpanded] = useState(true);
  const [builtinExpanded, setBuiltinExpanded] = useState(false);

  const { data: profanityData, isLoading } = useQuery<{ builtin: string[]; custom: string[] }>({
    queryKey: ["/api/admin/profanity-words"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/profanity-words");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (word: string) => {
      const res = await adminFetch("/api/admin/profanity-words", {
        method: "POST",
        body: JSON.stringify({ word }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al agregar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profanity-words"] });
      setNewWord("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (word: string) => {
      const res = await adminFetch(`/api/admin/profanity-words/${encodeURIComponent(word)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profanity-words"] });
    },
  });

  const handleAdd = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  const customWords = profanityData?.custom || [];
  const builtinWords = profanityData?.builtin || [];

  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4 max-w-lg mt-4">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#34d399]" />
        Filtro de Palabras
      </h3>
      <p className="text-xs text-white/40 mb-3">
        Administra las palabras que se filtran en el chat. Las palabras integradas vienen incluidas por defecto.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <Input
          data-testid="input-profanity-word"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Nueva palabra..."
          className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
        />
        <Button
          data-testid="button-add-profanity-word"
          onClick={handleAdd}
          disabled={!newWord.trim() || addMutation.isPending}
          className="bg-[#10b981] text-white"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          Agregar
        </Button>
      </div>

      {addMutation.isError && (
        <p data-testid="text-profanity-add-error" className="text-xs text-red-400 mb-3">{(addMutation.error as Error).message}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <button
              data-testid="button-toggle-custom-words"
              onClick={() => setCustomExpanded(!customExpanded)}
              className="flex items-center gap-1 text-sm font-medium text-white/80 w-full text-left mb-2"
            >
              <span className={`transition-transform ${customExpanded ? "rotate-90" : ""}`}>&#9654;</span>
              Palabras personalizadas ({customWords.length})
            </button>
            {customExpanded && (
              <div className="flex flex-wrap gap-1.5" data-testid="container-custom-words">
                {customWords.length === 0 ? (
                  <p className="text-xs text-white/30">No hay palabras personalizadas</p>
                ) : (
                  customWords.map((word) => (
                    <span key={word} className="inline-flex items-center gap-0.5">
                      <Badge data-testid={`badge-custom-word-${word}`} variant="default" className="text-xs">
                        {word}
                      </Badge>
                      <Button
                        data-testid={`button-delete-word-${word}`}
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(word)}
                        disabled={deleteMutation.isPending}
                        className="text-white/40"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <button
              data-testid="button-toggle-builtin-words"
              onClick={() => setBuiltinExpanded(!builtinExpanded)}
              className="flex items-center gap-1 text-sm font-medium text-white/80 w-full text-left mb-2"
            >
              <span className={`transition-transform ${builtinExpanded ? "rotate-90" : ""}`}>&#9654;</span>
              Palabras integradas ({builtinWords.length})
            </button>
            {builtinExpanded && (
              <div className="flex flex-wrap gap-1.5" data-testid="container-builtin-words">
                {builtinWords.map((word, idx) => (
                  <Badge key={`${word}-${idx}`} data-testid={`badge-builtin-word-${word}`} variant="secondary" className="text-xs opacity-70">
                    {word}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagsPanel() {
  const [newTag, setNewTag] = useState("");

  const { data: sessionsData } = useQuery<any[]>({
    queryKey: ["/api/admin/sessions"],
  });

  const { data: customTagsFromDB = [] } = useQuery<string[]>({
    queryKey: ["/api/admin/tags"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/tags");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const allUsedTags = useMemo(() => {
    if (!sessionsData) return [];
    const tagSet = new Set<string>();
    sessionsData.forEach((s: any) => s.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [sessionsData]);

  const allTags = useMemo(() => {
    return Array.from(new Set([...PREDEFINED_TAGS, ...customTagsFromDB, ...allUsedTags])).sort();
  }, [customTagsFromDB, allUsedTags]);

  const tagUsageCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (sessionsData) {
      sessionsData.forEach((s: any) => {
        s.tags?.forEach((t: string) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
    }
    return counts;
  }, [sessionsData]);

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await adminFetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setNewTag("");
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await adminFetch(`/api/admin/tags/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
    },
  });

  const handleCreate = () => {
    const trimmed = newTag.trim();
    if (trimmed && !allTags.includes(trimmed)) {
      createTagMutation.mutate(trimmed);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Etiquetas</h2>
          <p className="text-xs text-white/40 mt-1">Gestiona las etiquetas para organizar tus conversaciones</p>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-3">Crear nueva etiqueta</h3>
          <div className="flex items-center gap-2">
            <Input
              data-testid="input-new-tag-name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Nombre de la etiqueta..."
              className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
            />
            <Button
              data-testid="button-create-tag"
              onClick={handleCreate}
              disabled={!newTag.trim() || allTags.includes(newTag.trim()) || createTagMutation.isPending}
              className="bg-[#10b981] hover:bg-[#7C4DFF] text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear
            </Button>
          </div>
          {newTag.trim() && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/40">Vista previa:</span>
              {(() => {
                const tc = getTagColor(newTag.trim());
                return (
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                  >
                    {newTag.trim()}
                  </span>
                );
              })()}
              {allTags.includes(newTag.trim()) && (
                <span className="text-[11px] text-amber-400">Ya existe</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white mb-3">Etiquetas disponibles ({allTags.length})</h3>
          <div className="grid gap-2">
            {allTags.map((tag) => {
              const tc = getTagColor(tag);
              const count = tagUsageCount[tag] || 0;
              const isPredefined = PREDEFINED_TAGS.includes(tag);
              const isCustomDB = customTagsFromDB.includes(tag);
              return (
                <div
                  key={tag}
                  data-testid={`tag-manage-${tag}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                    >
                      {tag}
                    </span>
                    <span className="text-[11px] text-white/30 truncate">
                      {count > 0 ? `Usada en ${count} ${count === 1 ? "chat" : "chats"}` : "Sin usar"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-white/20">
                      {isPredefined ? "Predefinida" : "Personalizada"}
                    </span>
                    {isCustomDB && !isPredefined && count === 0 && (
                      <button
                        data-testid={`button-delete-tag-${tag}`}
                        onClick={() => deleteTagMutation.mutate(tag)}
                        className="w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {allTags.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              No hay etiquetas creadas. Crea una nueva etiqueta arriba.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersPanel({ adminUser }: { adminUser: { id: number; email: string; role: string; displayName: string; color?: string } | null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#10b981");
  const [newRole, setNewRole] = useState("ejecutivo");

  const { data: users = [], isLoading } = useQuery<{ id: number; email: string; displayName: string; role: string; color?: string; createdAt: string }[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; color: string; role: string }) => {
      const res = await adminFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAdding(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewColor("#10b981");
      setNewRole("ejecutivo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Gestion de Usuarios</h2>
        {adminUser?.role !== "ejecutivo" && (
          <Button
            data-testid="button-add-user"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="bg-[#10b981] text-white text-xs"
            disabled={isAdding}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Crear Usuario
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#10b981]/30 bg-[#10b981]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-user-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del usuario"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
                autoFocus
              />
              <Input
                data-testid="input-new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Correo electronico"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
              />
              <Input
                data-testid="input-new-user-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Contraseña (min. 6 caracteres)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60 whitespace-nowrap">Color del agente:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["#10b981", "#00BCD4", "#4CAF50", "#FF9800", "#E91E63", "#2196F3", "#FF5722", "#9C27B0"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      data-testid={`color-option-${c.slice(1)}`}
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${newColor === c ? "border-white" : "border-transparent opacity-50"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60 whitespace-nowrap">Rol:</label>
                <div className="flex items-center gap-1.5">
                  {(adminUser?.role === "superadmin" || adminUser?.role === "admin" ? ["admin", "ejecutivo"] : ["ejecutivo"]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      data-testid={`role-option-${r}`}
                      onClick={() => setNewRole(r)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${newRole === r ? "bg-[#10b981] text-white" : "bg-white/[0.06] text-white/50"}`}
                    >
                      {r === "admin" ? "Admin" : "Ejecutivo"}
                    </button>
                  ))}
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-xs text-red-400">{(createMutation.error as Error).message}</p>
              )}
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Button
                  data-testid="button-cancel-user"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewEmail(""); setNewPassword(""); setNewName(""); setNewColor("#10b981"); setNewRole("ejecutivo"); }}
                  className="text-white/40 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-save-user"
                  size="sm"
                  onClick={() => createMutation.mutate({ email: newEmail.trim(), password: newPassword, displayName: newName.trim(), color: newColor, role: newRole })}
                  disabled={!newEmail.trim() || !newPassword.trim() || newPassword.length < 6 || !newName.trim() || createMutation.isPending}
                  className="bg-[#10b981] text-white text-xs"
                >
                  {createMutation.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            data-testid={`user-card-${u.id}`}
            className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03] flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: u.color || "#10b981" }} />
                <span className="text-sm font-medium text-white">{u.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  u.role === "superadmin" ? "bg-[#34d399]/15 text-[#34d399]" 
                    : u.role === "admin" ? "bg-blue-500/15 text-blue-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {u.role === "superadmin" ? "Superadmin" : u.role === "admin" ? "Admin" : "Ejecutivo"}
                </span>
              </div>
              <p className="text-xs text-white/40">{u.email}</p>
            </div>
            {u.role !== "superadmin" && adminUser?.role !== "ejecutivo" && u.id !== adminUser?.id && (
              <Button
                data-testid={`button-delete-user-${u.id}`}
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm(`¿Eliminar usuario "${u.displayName}"?`)) {
                    deleteMutation.mutate(u.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-white/30 hover:text-red-400 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changeMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cambiar contraseña");
      return data;
    },
    onSuccess: (data) => {
      if (data.token) setAuthToken(data.token);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    changeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold text-white">Cambiar Contraseña</h3>
          <button data-testid="button-close-password-modal" onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Contraseña actualizada correctamente</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              data-testid="input-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
              placeholder="Contraseña actual"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
              autoFocus
            />
            <Input
              data-testid="input-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="Nueva contraseña (min. 6 caracteres)"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
            />
            <Input
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Confirmar nueva contraseña"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981]"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              data-testid="button-change-password"
              type="submit"
              disabled={!currentPassword || !newPassword || !confirmPassword || changeMutation.isPending}
              className="w-full bg-[#10b981] text-white text-sm"
            >
              {changeMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

interface TenantRow {
  id: number;
  name: string;
  email: string;
  companyName: string;
  plan: string;
  createdAt: string;
  sessionsCount: number;
  messagesCount: number;
}

interface PaymentRow {
  id: number;
  tenantId: number;
  commerceOrder: string;
  targetPlan: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

function TenantsPanel() {
  const { toast } = useToast();
  const [paymentsView, setPaymentsView] = useState(false);

  const { data: tenantsList = [], isLoading: tenantsLoading } = useQuery<TenantRow[]>({
    queryKey: ["/api/admin/tenants"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/admin/tenants", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: paymentsList = [], isLoading: paymentsLoading } = useQuery<PaymentRow[]>({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/admin/payments", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: paymentsView,
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ tenantId, plan }: { tenantId: number; plan: string }) => {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Error al cambiar plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      toast({ title: "Plan actualizado", description: "El plan del tenant ha sido actualizado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el plan.", variant: "destructive" });
    },
  });

  const planLabels: Record<string, string> = { free: "Fox Free", basic: "Fox Pro", pro: "Fox Enterprise" };
  const planColors: Record<string, string> = {
    free: "bg-white/10 text-white/60",
    basic: "bg-[#34d399]/20 text-[#34d399]",
    pro: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {paymentsView ? "Historial de Pagos" : "Gestión de Tenants"}
        </h2>
        <button
          data-testid="button-toggle-payments"
          onClick={() => setPaymentsView(!paymentsView)}
          className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-md transition-colors"
        >
          {paymentsView ? "Ver Tenants" : "Ver Pagos"}
        </button>
      </div>

      {!paymentsView ? (
        tenantsLoading ? (
          <div className="text-white/40 text-sm">Cargando tenants...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Empresa</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Sesiones</th>
                  <th className="pb-2 pr-4">Mensajes</th>
                  <th className="pb-2 pr-4">Registrado</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenantsList.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]" data-testid={`row-tenant-${t.id}`}>
                    <td className="py-2.5 pr-4 text-white/50">{t.id}</td>
                    <td className="py-2.5 pr-4 text-white font-medium">{t.companyName}</td>
                    <td className="py-2.5 pr-4 text-white/60">{t.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[t.plan] || planColors.free}`}>
                        {planLabels[t.plan] || t.plan}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white/60">{t.sessionsCount}</td>
                    <td className="py-2.5 pr-4 text-white/60">{t.messagesCount}</td>
                    <td className="py-2.5 pr-4 text-white/40 text-xs">
                      {new Date(t.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="py-2.5">
                      <Select
                        value={t.plan}
                        onValueChange={(val) => changePlanMutation.mutate({ tenantId: t.id, plan: val })}
                      >
                        <SelectTrigger className="h-7 w-28 bg-white/5 border-white/10 text-white text-xs" data-testid={`select-plan-${t.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Fox Free</SelectItem>
                          <SelectItem value="basic">Fox Pro</SelectItem>
                          <SelectItem value="pro">Fox Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenantsList.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No hay tenants registrados aún.</p>
            )}
          </div>
        )
      ) : (
        paymentsLoading ? (
          <div className="text-white/40 text-sm">Cargando pagos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-2 pr-4">Orden</th>
                  <th className="pb-2 pr-4">Tenant</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Monto</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]" data-testid={`row-payment-${p.id}`}>
                    <td className="py-2.5 pr-4 text-white/50 text-xs font-mono">{p.commerceOrder.slice(0, 25)}...</td>
                    <td className="py-2.5 pr-4 text-white/60">{p.tenantId}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[p.targetPlan] || planColors.free}`}>
                        {planLabels[p.targetPlan] || p.targetPlan}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white/80">${p.amount.toLocaleString("es-CL")}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === "paid" ? "bg-green-500/20 text-green-400" :
                        p.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {p.status === "paid" ? "Pagado" : p.status === "rejected" ? "Rechazado" : p.status === "cancelled" ? "Cancelado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white/40 text-xs">
                      {new Date(p.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="py-2.5 text-white/40 text-xs">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-CL") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentsList.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No hay pagos registrados aún.</p>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: number; email: string; role: string; displayName: string; color?: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [agentFilter, setAgentFilter] = useState<"all" | "bot" | "ejecutivo" | "solicita">("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pendientes" | "mis_chats">("all");
  const [adminTab, setAdminTab] = useState<"conversations" | "canned" | "products" | "users" | "settings" | "tags" | "knowledge" | "tenants" | "guides">("conversations");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("admin_sound") !== "false"; } catch { return true; }
  });
  const previousSessionCountRef = useRef<number>(0);
  const [localUnreads, setLocalUnreads] = useState<Record<string, number>>({});
  const [flashingSessions, setFlashingSessions] = useState<Record<string, boolean>>({});
  const selectedSessionRef = useRef<string | null>(null);
  const soundEnabledRef = useRef(true);
  const adminUserIdRef = useRef<number | null>(null);
  const [notifBannerVisible, setNotifBannerVisible] = useState(() => {
    try {
      if (typeof Notification === "undefined") return false;
      if (localStorage.getItem("notification_banner_dismissed") === "true") return false;
      return Notification.permission !== "granted";
    } catch { return false; }
  });

  useEffect(() => { selectedSessionRef.current = selectedSession; }, [selectedSession]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { adminUserIdRef.current = adminUser?.id ?? null; }, [adminUser]);

  useEffect(() => {
    _notificationSelectCallback = (sessionId: string) => {
      setSelectedSession(sessionId);
      setMobileView("chat");
    };
    return () => { _notificationSelectCallback = null; };
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (token && user) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Invalid");
        })
        .then(data => {
          setAdminUser(data);
          setAuthenticated(true);
        })
        .catch(() => { clearAuthToken(); });
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const token = getAuthToken();
    if (!token) return;

    const adminSocket = io(window.location.origin, {
      auth: { role: "admin" },
      transports: ["websocket", "polling"],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    adminSocket.on("connect", () => {
      adminSocket.emit("join_admin_room", { token });
    });

    adminSocket.on("session_updated", (data: any) => {
      if (data?.session && data?.sessionId) {
        const updatedSession = data.session;
        const isCurrentlySelected = selectedSessionRef.current === data.sessionId;
        const allQueries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
          .filter(([key]) => (key as string[]).length <= 2);
        allQueries.forEach(([key, old]) => {
          if (!old || !Array.isArray(old)) return;
          const queryStatusFilter = (key as string[])[1] || "all";
          const updatedList = old.map((s: any) =>
            s.sessionId === data.sessionId ? { ...s, ...updatedSession } : s
          );
          if (updatedSession.status && queryStatusFilter !== "all" && !isCurrentlySelected) {
            queryClient.setQueryData(key, updatedList.filter((s: any) => s.status === queryStatusFilter));
          } else {
            queryClient.setQueryData(key, updatedList);
          }
        });
      }
      invalidateSessionLists();
      if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", data.sessionId, "messages"] });
      }
    });

    adminSocket.on("sessions_cleared", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
    });

    adminSocket.on("session_deleted", (data: any) => {
      if (data?.sessionId) {
        if (selectedSessionRef.current === data.sessionId) {
          setSelectedSession(null);
          setMobileView("list");
        }
        invalidateSessionLists();
      }
    });

    adminSocket.on("auto_email_sent", (data: any) => {
      if (data?.sessionId) {
        invalidateSessionLists();
      }
    });

    adminSocket.on("manual_email_sent", (data: any) => {
      if (data?.sessionId) {
        invalidateSessionLists();
      }
    });

    adminSocket.on("admin_new_message", (data: any) => {
      if (data?.sessionId && data?.message) {
        queryClient.setQueryData<Message[]>(
          ["/api/admin/sessions", data.sessionId, "messages"],
          (old) => {
            if (!old) return undefined;
            if (old.some(m => m.id === data.message.id)) return old;
            return [...old, data.message];
          }
        );
        setLocalUnreads(prev => {
          if (selectedSessionRef.current === data.sessionId) return prev;
          return { ...prev, [data.sessionId]: (prev[data.sessionId] || 0) + 1 };
        });
        setFlashingSessions(prev => ({ ...prev, [data.sessionId]: true }));
        setTimeout(() => {
          setFlashingSessions(prev => {
            const next = { ...prev };
            delete next[data.sessionId];
            return next;
          });
        }, 3000);
        const shouldNotify = !data.assignedTo || data.assignedTo === adminUserIdRef.current;
        if (data.message?.sender === "user" && shouldNotify) {
          if (soundEnabledRef.current) {
            playNotificationSound();
          }
          showForegroundNotification(
            `Nuevo mensaje de ${data.message.userName || "Usuario"}`,
            (data.message.content || "").substring(0, 100),
            data.sessionId,
            selectedSessionRef
          );
        }
      } else if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", data.sessionId, "messages"] });
      }
      invalidateSessionLists();
    });

    return () => {
      adminSocket.disconnect();
    };
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    function clearBadge() {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_BADGE" });
      }
      if ("clearAppBadge" in navigator) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") clearBadge();
    }
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data?.sessionId) {
        const sid = event.data.sessionId;
        setSelectedSession(sid);
        setMobileView("chat");
        setAdminTab("conversations");
        setLocalUnreads(prev => {
          const next = { ...prev };
          delete next[sid];
          return next;
        });
      }
    }
    clearBadge();
    window.addEventListener("focus", clearBadge);
    document.addEventListener("visibilitychange", handleVisibility);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }
    return () => {
      window.removeEventListener("focus", clearBadge);
      document.removeEventListener("visibilitychange", handleVisibility);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [authenticated]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const { data: sessions = [], isLoading: sessionsLoading, isPlaceholderData } = useQuery<SessionSummary[]>({
    queryKey: ["/api/admin/sessions", statusFilter],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions?status=${statusFilter}`);
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    },
    enabled: authenticated,
    refetchInterval: 10000,
    staleTime: 5000,
    placeholderData: (prev) => prev,
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/admin/search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: authenticated && debouncedSearch.length >= 2,
  });

  const { data: allRatings = [] } = useQuery<RatingData[]>({
    queryKey: ["/api/admin/ratings"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/ratings");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: authenticated,
    refetchInterval: 30000,
  });

  const ratingsMap = useMemo(() => new Map(allRatings.map(r => [r.sessionId, r])), [allRatings]);
  const avgRating = useMemo(() => allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length : 0, [allRatings]);

  useEffect(() => {
    if (!authenticated) return;
    if (sessions.length > previousSessionCountRef.current && previousSessionCountRef.current > 0) {
      if (soundEnabled) {
        playNotificationSound();
      }
      showForegroundNotification(
        "Nuevo chat de soporte",
        "Se ha iniciado una nueva conversacion de soporte",
        "new-session",
        selectedSessionRef
      );
    }
    previousSessionCountRef.current = sessions.length;
  }, [sessions.length, authenticated, soundEnabled]);

  useEffect(() => {
    if (!authenticated) return;
    async function subscribePush() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
        const res = await fetch("/api/push/vapid-public-key");
        const { key } = await res.json();
        if (!key) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
        }
        const subJson = subscription.toJSON();
        await adminFetch("/api/admin/push-subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
      } catch (e) {
        console.log("Push subscription failed:", e);
      }
    }
    subscribePush();
  }, [authenticated]);

  const isSearching = debouncedSearch.length >= 2;
  const baseSessions = useMemo(() => isSearching
    ? searchResults.map((r) => ({
        sessionId: r.sessionId,
        userName: r.userName,
        userEmail: r.userEmail,
        messageCount: r.messages.length,
        unreadCount: 0,
        lastMessage: r.messages[0]?.timestamp ? String(r.messages[0].timestamp) : null,
        firstMessage: null,
        status: "active" as const,
        tags: [] as string[],
        problemType: null,
        gameName: null,
        adminActive: false,
        contactRequested: false,
        assignedTo: null,
        assignedToName: null,
        assignedToColor: null,
        lastMessageContent: r.messages[0]?.content || null,
        lastMessageSender: r.messages[0]?.sender || null,
        blockedAt: null,
        lastAutoEmailAt: null,
        lastManualEmailAt: null,
      }))
    : sessions, [isSearching, searchResults, sessions]);

  const displaySessions = useMemo(() => {
    let filtered = agentFilter === "all"
      ? baseSessions
      : baseSessions.filter((s) => {
          if (agentFilter === "ejecutivo") return s.adminActive;
          if (agentFilter === "solicita") return !s.adminActive && s.contactRequested;
          if (agentFilter === "bot") return !s.adminActive && !s.contactRequested;
          return true;
        });

    if (assignmentFilter === "pendientes") {
      filtered = filtered.filter(s => !s.assignedTo);
    } else if (assignmentFilter === "mis_chats") {
      filtered = filtered.filter(s => s.assignedTo === adminUser?.id);
    }

    return filtered;
  }, [baseSessions, agentFilter, assignmentFilter, adminUser?.id]);

  const selectSession = useCallback((sid: string) => {
    setSelectedSession(sid);
    setMobileView("chat");
    setLocalUnreads(prev => {
      const next = { ...prev };
      delete next[sid];
      return next;
    });
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setMobileView("list");
        }
        invalidateSessionLists();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Error al eliminar chat");
      }
    } catch {
      alert("Error de conexion");
    }
  }, [selectedSession]);

  const handleLogout = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await adminFetch("/api/admin/push-subscribe", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
      }
    } catch {}
    clearAuthToken();
    setAuthenticated(false);
    setAdminUser(null);
    setSelectedSession(null);
  };

  if (!authenticated) {
    return <AdminLogin onLogin={(user) => { setAdminUser(user); setAuthenticated(true); }} />;
  }

  const statusTabs = [
    { key: "all" as const, label: "Todos" },
    { key: "active" as const, label: "Activos" },
    { key: "closed" as const, label: "Cerrados" },
  ];

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif", position: "fixed" as const, inset: 0, height: "100dvh" }}>
      {notifBannerVisible && (
        <div
          data-testid="banner-notification-prompt"
          className="flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #3F51B5 100%)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 text-white flex-shrink-0" />
            <span className="text-sm text-white font-medium truncate">Activa las notificaciones para no perder ningun mensaje</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              data-testid="button-enable-notifications"
              size="sm"
              className="bg-white text-[#10b981] font-semibold border-white"
              onClick={async () => {
                try {
                  tryResumeAdminAudio();
                  const result = await Notification.requestPermission();
                  if (result === "granted" || result === "denied") {
                    setNotifBannerVisible(false);
                    localStorage.setItem("notification_banner_dismissed", "true");
                  }
                } catch {
                  setNotifBannerVisible(false);
                }
              }}
            >
              Activar Notificaciones
            </Button>
            <button
              data-testid="button-dismiss-notification-banner"
              onClick={() => {
                setNotifBannerVisible(false);
                localStorage.setItem("notification_banner_dismissed", "true");
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      <header className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/[0.06] flex items-center justify-between gap-2" style={{ background: "#10b981" }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {mobileView === "chat" && (
            <button
              data-testid="button-back-to-list"
              onClick={() => setMobileView("list")}
              className="md:hidden w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <img src="/favicon-fox.png" alt="FoxBot" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
          <div className="min-w-0">
            <h1 data-testid="text-admin-title" className="text-sm sm:text-base font-bold text-white leading-tight truncate">FoxBot Admin</h1>
            {adminUser && (
              <p className="text-[10px] sm:text-[11px] text-white/60 truncate">{adminUser.displayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {allRatings.length > 0 && (
            <span data-testid="text-avg-rating" className="text-xs sm:text-sm text-white/70 items-center gap-1 hidden sm:flex">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-white/40">({allRatings.length})</span>
            </span>
          )}
          <span className="text-xs sm:text-sm text-white/70 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span data-testid="text-session-count">{sessions.length}</span>
          </span>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-toggle-sound"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              try { localStorage.setItem("admin_sound", String(next)); } catch {}
            }}
            className="text-white/60 w-7 h-7 sm:w-9 sm:h-9"
            title={soundEnabled ? "Silenciar notificaciones" : "Activar sonido"}
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-change-password-trigger"
            onClick={() => setShowPasswordChange(true)}
            className="text-white/60 w-7 h-7 sm:w-9 sm:h-9 hidden sm:flex"
            title="Cambiar contraseña"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <button
            data-testid="button-admin-logout"
            onClick={handleLogout}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors flex-shrink-0"
            title="Cerrar sesion"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </button>
        </div>
      </header>

      {showPasswordChange && <PasswordChangeModal onClose={() => setShowPasswordChange(false)} />}

      <div className="border-b border-white/[0.06] flex items-center gap-0 px-1 sm:px-2 overflow-x-auto scrollbar-hide">
        <button
          data-testid="tab-conversations"
          onClick={() => setAdminTab("conversations")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
            adminTab === "conversations" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Chats
          {adminTab === "conversations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        <button
          data-testid="tab-canned-responses"
          onClick={() => setAdminTab("canned")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
            adminTab === "canned" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Atajos
          {adminTab === "canned" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        <button
          data-testid="tab-tags"
          onClick={() => setAdminTab("tags")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "tags" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Etiquetas
          {adminTab === "tags" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        <button
          data-testid="tab-products"
          onClick={() => setAdminTab("products")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "products" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Productos
          {adminTab === "products" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        <button
          data-testid="tab-knowledge"
          onClick={() => setAdminTab("knowledge")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "knowledge" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Conocimiento
          {adminTab === "knowledge" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        <button
          data-testid="tab-guides"
          onClick={() => setAdminTab("guides")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "guides" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Guias
          {adminTab === "guides" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
          )}
        </button>
        {adminUser?.role !== "ejecutivo" && (
          <button
            data-testid="tab-users"
            onClick={() => setAdminTab("users")}
            className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              adminTab === "users" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Usuarios
            {adminTab === "users" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
            )}
          </button>
        )}
        {adminUser?.role !== "ejecutivo" && (
          <button
            data-testid="tab-settings"
            onClick={() => setAdminTab("settings")}
            className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              adminTab === "settings" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Ajustes
            {adminTab === "settings" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
            )}
          </button>
        )}
        {adminUser?.role === "superadmin" && (
          <button
            data-testid="tab-tenants"
            onClick={() => setAdminTab("tenants")}
            className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              adminTab === "tenants" ? "text-[#34d399]" : "text-white/40 hover:text-white/60"
            }`}
          >
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Tenants
            {adminTab === "tenants" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34d399]" />
            )}
          </button>
        )}
      </div>

      {adminTab === "settings" ? (
        <SettingsPanel />
      ) : adminTab === "tags" ? (
        <TagsPanel />
      ) : adminTab === "users" ? (
        <UsersPanel adminUser={adminUser} />
      ) : adminTab === "products" ? (
        <ProductsPanel />
      ) : adminTab === "knowledge" ? (
        <KnowledgePanel />
      ) : adminTab === "canned" ? (
        <CannedResponsesPanel />
      ) : adminTab === "tenants" ? (
        <TenantsPanel />
      ) : adminTab === "guides" ? (
        <GuidesPanel />
      ) : (
        <div className="flex-1 flex min-h-0">
          <div className={`w-full md:w-80 lg:w-96 border-r border-white/[0.06] flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  data-testid="input-global-search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar en todos los chats..."
                  className="pl-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#10b981] focus-visible:border-[#10b981]"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isSearching && (
                <p className="text-[11px] text-white/30 mt-2 px-1">
                  {searchLoading ? "Buscando..." : `${searchResults.length} conversacion${searchResults.length !== 1 ? "es" : ""} encontrada${searchResults.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {!isSearching && (
              <div className="border-b border-white/[0.06] px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.key}
                      data-testid={`tab-filter-${tab.key}`}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        statusFilter === tab.key
                          ? "bg-[#10b981] text-white"
                          : "text-white/40 hover:text-white/60 bg-white/[0.03]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  {adminUser?.role !== "ejecutivo" && (
                    <button
                      data-testid="button-clear-all-chats"
                      onClick={async () => {
                        if (!window.confirm("¿Estas seguro de eliminar TODOS los chats? Esta accion no se puede deshacer.")) return;
                        try {
                          const res = await adminFetch("/api/admin/sessions/all", { method: "DELETE" });
                          if (res.ok) {
                            invalidateSessionLists();
                            alert("Todos los chats eliminados");
                          } else {
                            const data = await res.json();
                            alert(data.message || "Error al eliminar chats");
                          }
                        } catch {
                          alert("Error de conexion");
                        }
                      }}
                      className="ml-auto p-1 text-white/30 hover:text-red-400 transition-colors"
                      title="Vaciar chats"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { key: "all" as const, label: "Todos" },
                    { key: "bot" as const, label: "Bot" },
                    { key: "ejecutivo" as const, label: "Ejecutivo" },
                    { key: "solicita" as const, label: "Solicita Ejecutivo" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      data-testid={`tab-agent-${tab.key}`}
                      onClick={() => setAgentFilter(tab.key)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                        agentFilter === tab.key
                          ? tab.key === "bot" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : tab.key === "ejecutivo" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : tab.key === "solicita" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-[#10b981] text-white border border-transparent"
                          : "text-white/30 hover:text-white/50 bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { key: "all" as const, label: "Todos" },
                    { key: "pendientes" as const, label: "Pendientes" },
                    { key: "mis_chats" as const, label: "Mis Chats" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      data-testid={`tab-assign-${tab.key}`}
                      onClick={() => setAssignmentFilter(tab.key)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                        assignmentFilter === tab.key
                          ? tab.key === "pendientes" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : tab.key === "mis_chats" ? "bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30"
                            : "bg-[#10b981] text-white border border-transparent"
                          : "text-white/30 hover:text-white/50 bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {sessionsLoading && !isSearching ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displaySessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">
                    {isSearching ? "No se encontraron resultados" : "No hay conversaciones aun"}
                  </p>
                </div>
              ) : (
                <Virtuoso
                  data={displaySessions}
                  overscan={200}
                  style={{ height: "100%" }}
                  itemContent={(index, session) => (
                    <div className="px-2 pt-1.5">
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        onClick={() => selectSession(session.sessionId)}
                        isSelected={selectedSession === session.sessionId}
                        rating={ratingsMap.get(session.sessionId)}
                        localUnread={localUnreads[session.sessionId] || 0}
                        isRecentlyUpdated={!!flashingSessions[session.sessionId]}
                        onDelete={handleDeleteSession}
                        isAdmin={adminUser?.role !== "ejecutivo"}
                      />
                    </div>
                  )}
                />
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {selectedSession ? (
              <ChatViewer sessionId={selectedSession} searchQuery={debouncedSearch} sessions={sessions} adminUser={adminUser} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-[#34d399]/40" />
                </div>
                <p className="text-sm text-white/30 mb-1">Selecciona una conversacion</p>
                <p className="text-xs text-white/20">Haz clic en una sesion para ver el historial de chat</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
