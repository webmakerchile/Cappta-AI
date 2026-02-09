import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Search, MessageSquare, Mail, Clock, User, Headphones, ArrowLeft, X, Lock, LogOut,
  Plus, Tag, CheckCircle, Circle, Pencil, Trash2, Zap, Save, XCircle, Gamepad2,
  Send, ShieldCheck, ShieldOff, ImagePlus, Loader2, Package, Star, Users, Bell, BellOff, Key,
  UserPlus, UserMinus, Check
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
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

function parseAdminQuickReplies(content: string): string {
  const marker = "{{QUICK_REPLIES:";
  const idx = content.indexOf(marker);
  if (idx === -1) return content;
  return content.substring(0, idx).trim();
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[#6200EA]/40 text-white rounded-sm px-0.5">{part}</mark>
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
          <img src="/logo-192.webp" alt="CJM Digitales" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-xl font-bold text-white mb-1">Soporte CJM DIGITALES</h1>
          <p className="text-sm text-white/40">Inicia sesion para acceder al panel</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            data-testid="input-admin-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Correo electronico"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
            autoFocus
          />
          <Input
            data-testid="input-admin-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
          />
          {error && (
            <p data-testid="text-login-error" className="text-sm text-red-400">{error}</p>
          )}
          <Button
            data-testid="button-admin-login"
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-[#6200EA] border-[#6200EA] text-white"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function SessionCard({ session, onClick, isSelected, rating }: { session: SessionSummary; onClick: () => void; isSelected: boolean; rating?: RatingData }) {
  const agentColor = session.assignedToColor;
  const hasAgent = !!agentColor;
  const cardStyle: React.CSSProperties = hasAgent && !isSelected
    ? { backgroundColor: `${agentColor}20`, borderColor: `${agentColor}50` }
    : {};
  return (
    <button
      data-testid={`session-card-${session.sessionId}`}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md border transition-all ${
        isSelected
          ? "bg-[#6200EA]/15 border-[#6200EA]/40"
          : hasAgent
            ? ""
            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
      }`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (hasAgent && !isSelected) {
          e.currentTarget.style.backgroundColor = `${agentColor}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasAgent && !isSelected) {
          e.currentTarget.style.backgroundColor = `${agentColor}20`;
        }
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative w-7 h-7 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-[#6200EA]" />
          <span
            data-testid={`status-dot-${session.sessionId}`}
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${
              session.status === "active" ? "bg-green-500" : "bg-white/30"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.userName || "Sin nombre"}</p>
          <p className="text-[11px] text-white/40 truncate">{session.userEmail || "Sin correo"}</p>
        </div>
        {session.unreadCount > 0 && (
          <span
            data-testid={`badge-unread-${session.sessionId}`}
            className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#6200EA] text-white text-[11px] font-bold animate-pulse"
          >
            {session.unreadCount > 99 ? "99+" : session.unreadCount}
          </span>
        )}
      </div>
      {(session.problemType || session.gameName) && (
        <div className="flex items-center gap-2 pl-9 mb-1 flex-wrap">
          {session.problemType && (
            <span className="text-[10px] text-[#6200EA] bg-[#6200EA]/10 px-1.5 py-0.5 rounded">{session.problemType}</span>
          )}
          {session.gameName && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
              <Gamepad2 className="w-2.5 h-2.5" />
              {session.gameName}
            </span>
          )}
        </div>
      )}
      {session.tags && session.tags.length > 0 && (
        <div className="flex items-center gap-1 pl-9 mb-1 flex-wrap">
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
      <div className="flex items-center gap-2 text-[11px] text-white/30 pl-9 flex-wrap">
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
              backgroundColor: `${session.assignedToColor || '#6200EA'}25`,
              color: session.assignedToColor || '#6200EA',
              border: `1px solid ${session.assignedToColor || '#6200EA'}40`,
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
      </div>
    </button>
  );
}

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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
              className="h-6 w-36 text-[11px] bg-white/5 border-white/10 text-white placeholder:text-white/25 px-1.5 focus-visible:ring-[#6200EA]"
              autoFocus
              onFocus={() => setShowSuggestions(true)}
            />
            <button
              data-testid="button-submit-tag"
              onClick={() => { if (customTag.trim()) addTag(customTag); }}
              className="w-6 h-6 rounded bg-[#6200EA]/20 flex items-center justify-center text-[#6200EA] hover:bg-[#6200EA]/30"
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const currentSession = sessions.find((s) => s.sessionId === sessionId);
  const isAdminActive = currentSession?.adminActive ?? false;
  const isLockedByOther = !!(currentSession?.assignedTo && currentSession.assignedTo !== adminUser?.id);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/admin/sessions", sessionId, "messages"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: isAdminActive ? 3000 : false,
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
        }
        throw new Error(data.message || "Error al cambiar modo admin");
      }
      return res.json();
    },
    onMutate: async (adminActive) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/sessions"] });
      const queries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] });
      queries.forEach(([key, old]) => {
        if (!old) return;
        queryClient.setQueryData(key, old.map(s =>
          s.sessionId === sessionId ? { ...s, adminActive } : s
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
        adminColor: adminUser?.color || "#6200EA",
        timestamp: new Date(),
      };
      queryClient.setQueryData<Message[]>(
        ["/api/admin/sessions", sessionId, "messages"],
        (old) => [...(old || []), optimisticMsg]
      );
      return { prev, tempId };
    },
    onError: (_err, _data, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["/api/admin/sessions", sessionId, "messages"], context.prev);
      }
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      setTimeout(() => replyInputRef.current?.focus(), 100);
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
        }
        throw new Error(data.message || "Error al enviar encuesta");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "rating"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
            return { ...s, assignedTo: adminUser?.id ?? null, assignedToName: adminUser?.displayName ?? null, assignedToColor: adminUser?.color ?? '#6200EA' };
          }
          return { ...s, assignedTo: null, assignedToName: null, assignedToColor: null };
        }));
      });
      return { queries };
    },
    onError: (_err, _action, context) => {
      context?.queries.forEach(([key, old]) => {
        if (old) queryClient.setQueryData(key, old);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
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
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
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

  const handleReplyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setTimeout(() => replyInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    const content = `Te recomiendo este producto: ${product.name}. Precio: ${product.price || "Consultar"}. Entrega digital inmediata a tu correo.${product.productUrl ? ` [BTN:Ir a comprar|URL:${product.productUrl}]` : ""}`;
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
  };

  const activeSearch = showLocalSearch ? localSearch : searchQuery;

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
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-30 bg-[#111] px-3 sm:px-4 py-2 sm:py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6200EA]" />
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
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 flex-wrap justify-end">
            {currentSession?.assignedTo === adminUser?.id ? (
              <Button
                data-testid="button-unclaim-session"
                variant="ghost"
                size="sm"
                onClick={() => claimMutation.mutate("unclaim")}
                disabled={claimMutation.isPending}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 text-[#6200EA]"
              >
                <UserMinus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Liberar</span>
              </Button>
            ) : !currentSession?.assignedTo ? (
              <Button
                data-testid="button-claim-session"
                variant="ghost"
                size="sm"
                onClick={() => claimMutation.mutate("claim")}
                disabled={claimMutation.isPending}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 text-cyan-400"
              >
                <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Tomar Chat</span>
                <span className="sm:hidden">Tomar</span>
              </Button>
            ) : (
              <span className="text-[10px] text-white/30 px-1">
                Asignado a {currentSession.assignedToName}
              </span>
            )}
            <Button
              data-testid="button-admin-takeover"
              variant="ghost"
              size="sm"
              onClick={() => adminActiveMutation.mutate(!isAdminActive)}
              disabled={isLockedByOther || adminActiveMutation.isPending}
              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                isAdminActive
                  ? "text-orange-400"
                  : "text-emerald-400"
              }`}
            >
              {isAdminActive ? <ShieldOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" /> : <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />}
              <span className="hidden sm:inline">{adminActiveMutation.isPending ? "..." : isAdminActive ? "Salir del Chat" : "Entrar al Chat"}</span>
              <span className="sm:hidden">{adminActiveMutation.isPending ? "..." : isAdminActive ? "Salir" : "Entrar"}</span>
            </Button>
            <Button
              data-testid="button-toggle-session-status"
              variant="ghost"
              size="sm"
              onClick={() => statusMutation.mutate(sessionStatus === "active" ? "closed" : "active")}
              disabled={isLockedByOther || statusMutation.isPending}
              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                sessionStatus === "active"
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {statusMutation.isPending ? "..." : sessionStatus === "active" ? "Cerrar" : "Reabrir"}
            </Button>
            <Button
              data-testid="button-send-survey"
              variant="ghost"
              size="sm"
              onClick={() => sendRatingMutation.mutate()}
              disabled={isLockedByOther || !!sessionRating || sendRatingMutation.isPending}
              className="text-[10px] sm:text-xs text-yellow-400 px-1.5 sm:px-2"
            >
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">{sendRatingMutation.isPending ? "..." : sessionRating ? "Enviada" : "Encuesta"}</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-toggle-chat-search"
              onClick={() => { setShowLocalSearch(!showLocalSearch); setLocalSearch(""); }}
              className={showLocalSearch ? "text-[#6200EA]" : "text-white/40"}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {isAdminActive && (
          <div className="mt-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-emerald-300">Modo administrador activo — El bot esta pausado. Tus respuestas se envian directamente al usuario.</span>
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
      </div>

      {showLocalSearch && (
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <Input
            data-testid="input-admin-chat-search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar en esta conversacion..."
            className="bg-transparent border-0 text-white text-sm placeholder:text-white/25 focus-visible:ring-0 p-0 h-auto"
            autoFocus
          />
          {localSearch && (
            <span className="text-[11px] text-white/30 flex-shrink-0">
              {filteredMessages.length} resultado{filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={() => { setShowLocalSearch(false); setLocalSearch(""); }} className="text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {filteredMessages.length === 0 && activeSearch ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/30">No se encontraron mensajes con "{activeSearch}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const hasImage = !!(msg as any).imageUrl;
            const imageUrl = (msg as any).imageUrl;
            const isImageOnly = hasImage && (!msg.content || msg.content === "Imagen enviada");
            const msgAdminName = (msg as any).adminName;
            const msgAdminColor = (msg as any).adminColor || "#6200EA";
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
                        backgroundColor: `${msgAdminName ? msgAdminColor : '#6200EA'}20`,
                        borderColor: `${msgAdminName ? msgAdminColor : '#6200EA'}30`,
                      }}
                    >
                      <Headphones className="w-3 h-3" style={{ color: msgAdminName ? msgAdminColor : '#6200EA' }} />
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
                          ? "bg-[#6200EA] text-white rounded-br-none"
                          : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
                      }`}
                      style={!isUser && msgAdminName ? { boxShadow: `inset 3px 0 0 ${msgAdminColor}60` } : undefined}
                    >
                      {hasImage && (
                        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block p-1.5">
                          <img
                            src={imageUrl}
                            alt="Imagen compartida"
                            data-testid={`admin-message-image-${msg.id}`}
                            className="max-w-full max-h-48 object-contain cursor-pointer rounded-md"
                            loading="lazy"
                          />
                        </a>
                      )}
                      {!isImageOnly && (
                        <div className="px-3 py-2 text-sm leading-relaxed break-words">
                          {activeSearch ? highlightText(parseAdminQuickReplies(msg.content), activeSearch) : parseAdminQuickReplies(msg.content)}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-white/25 ${isUser ? "text-right" : "text-left"}`}>
                      {formatDateTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isLockedByOther ? (
        <div className="px-3 py-3 text-center border-t border-white/[0.06]">
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs text-red-300/70">
              Chat asignado a {currentSession?.assignedToName}. Solo el agente asignado puede responder.
            </p>
          </div>
        </div>
      ) : isAdminActive ? (
        <div className="sticky bottom-0 z-30 bg-[#111] relative">
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
                    className={`w-full text-left px-3 py-2 transition-colors border-b border-white/[0.04] last:border-0 ${idx === slashSelectedIndex ? "bg-[#6200EA]/15" : "hover:bg-white/[0.06]"}`}
                  >
                    <span className="text-xs font-mono text-[#6200EA]">/{r.shortcut}</span>
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
                        <span className="text-[10px] bg-[#6200EA]/15 text-[#6200EA] px-1.5 py-0.5 rounded flex-shrink-0">{getPlatformLabel(p.platform)}</span>
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
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
            <input
              ref={adminFileInputRef}
              type="file"
              accept="image/*"
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
                <Loader2 className="w-4 h-4 animate-spin text-[#6200EA]" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
            </Button>
            <Button
              data-testid="button-admin-product-search"
              size="icon"
              variant="ghost"
              onClick={() => setShowProductSearch(!showProductSearch)}
              className={`flex-shrink-0 ${showProductSearch ? "text-[#6200EA]" : "text-white/40"}`}
            >
              <Package className="w-4 h-4" />
            </Button>
            <Input
              ref={replyInputRef}
              data-testid="input-admin-reply"
              value={replyText}
              onChange={handleReplyInputChange}
              onKeyDown={(e) => {
                if (e.key === "Escape" && showSlashMenu) { setShowSlashMenu(false); setSlashFilter(""); setSlashSelectedIndex(0); return; }
                if (showSlashMenu && filteredCanned.length > 0) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelectedIndex((prev) => (prev + 1) % filteredCanned.length); return; }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSlashSelectedIndex((prev) => (prev - 1 + filteredCanned.length) % filteredCanned.length); return; }
                }
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (showSlashMenu) { if (filteredCanned.length > 0) selectCannedResponse(filteredCanned[slashSelectedIndex]); } else { handleReplySend(); } }
              }}
              placeholder="Escribe tu respuesta... (/ para atajos)"
              className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus-visible:ring-[#6200EA]/30"
              autoFocus
            />
            <Button
              data-testid="button-admin-send"
              size="icon"
              onClick={handleReplySend}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="bg-[#6200EA] text-white flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 z-30 bg-[#111] px-4 py-2 border-t border-white/[0.06] text-[11px] text-white/25 text-center">
          {messages.length} mensaje{messages.length !== 1 ? "s" : ""} en esta conversacion
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
        className="text-xs border-[#6200EA]/40 text-[#B388FF]"
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
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
        autoFocus
      />
      <Input
        data-testid="input-product-aliases"
        value={formData.searchAliases}
        onChange={(e) => setFormData(f => ({ ...f, searchAliases: e.target.value }))}
        placeholder="Aliases de busqueda (separados por coma)"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
      />
      <div className="grid grid-cols-2 gap-2">
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
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          data-testid="input-product-price"
          value={formData.price}
          onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
          placeholder="Precio (ej: $29.99 USD)"
          className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
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
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
      />
      <Input
        data-testid="input-product-description"
        value={formData.description}
        onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
        placeholder="Descripcion corta"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
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
          className="bg-[#6200EA] text-white text-xs"
        >
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
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
            className="bg-[#6200EA] text-white text-xs"
            disabled={isAdding}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
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
                      <span className="text-[10px] bg-[#6200EA]/15 text-[#6200EA] px-1.5 py-0.5 rounded">
                        {getPlatformLabel(p.platform)}
                      </span>
                      <span className="text-[10px] bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">
                        {getCategoryLabel(p.category)}
                      </span>
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
                        className="text-[11px] text-[#6200EA] hover:underline truncate block"
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
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
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
          className="bg-[#6200EA] text-white text-xs"
          disabled={isAdding}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-shortcut"
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                placeholder="Atajo (ej: saludo)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
                autoFocus
              />
              <Input
                data-testid="input-new-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Contenido del mensaje..."
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
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
                  className="bg-[#6200EA] text-white text-xs"
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
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#6200EA]"
                  />
                  <Input
                    data-testid="input-edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#6200EA]"
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
                      className="bg-[#6200EA] text-white text-xs"
                    >
                      {updateMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[#6200EA] bg-[#6200EA]/10 px-1.5 py-0.5 rounded">/{r.shortcut}</span>
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

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch {}
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
              className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
            />
            <Button
              data-testid="button-create-tag"
              onClick={handleCreate}
              disabled={!newTag.trim() || allTags.includes(newTag.trim()) || createTagMutation.isPending}
              className="bg-[#6200EA] hover:bg-[#7C4DFF] text-white"
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

function UsersPanel() {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6200EA");

  const { data: users = [], isLoading } = useQuery<{ id: number; email: string; displayName: string; role: string; color?: string; createdAt: string }[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; color: string }) => {
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
      setNewColor("#6200EA");
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
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Gestion de Usuarios</h2>
        <Button
          data-testid="button-add-user"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-[#6200EA] text-white text-xs"
          disabled={isAdding}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Crear Usuario
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-user-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del usuario"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
                autoFocus
              />
              <Input
                data-testid="input-new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Correo electronico"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              />
              <Input
                data-testid="input-new-user-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Contraseña (min. 6 caracteres)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60 whitespace-nowrap">Color del agente:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["#6200EA", "#00BCD4", "#4CAF50", "#FF9800", "#E91E63", "#2196F3", "#FF5722", "#9C27B0"].map((c) => (
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
              {createMutation.isError && (
                <p className="text-xs text-red-400">{(createMutation.error as Error).message}</p>
              )}
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Button
                  data-testid="button-cancel-user"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewEmail(""); setNewPassword(""); setNewName(""); setNewColor("#6200EA"); }}
                  className="text-white/40 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-save-user"
                  size="sm"
                  onClick={() => createMutation.mutate({ email: newEmail.trim(), password: newPassword, displayName: newName.trim(), color: newColor })}
                  disabled={!newEmail.trim() || !newPassword.trim() || newPassword.length < 6 || !newName.trim() || createMutation.isPending}
                  className="bg-[#6200EA] text-white text-xs"
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
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: u.color || "#6200EA" }} />
                <span className="text-sm font-medium text-white">{u.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  u.role === "superadmin" ? "bg-[#6200EA]/15 text-[#6200EA]" : "bg-white/[0.06] text-white/50"
                }`}>
                  {u.role === "superadmin" ? "Superadmin" : "Admin"}
                </span>
              </div>
              <p className="text-xs text-white/40">{u.email}</p>
            </div>
            {u.role !== "superadmin" && (
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
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              autoFocus
            />
            <Input
              data-testid="input-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="Nueva contraseña (min. 6 caracteres)"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
            />
            <Input
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Confirmar nueva contraseña"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              data-testid="button-change-password"
              type="submit"
              disabled={!currentPassword || !newPassword || !confirmPassword || changeMutation.isPending}
              className="w-full bg-[#6200EA] text-white text-sm"
            >
              {changeMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </form>
        )}
      </div>
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
  const [adminTab, setAdminTab] = useState<"conversations" | "canned" | "products" | "users" | "settings" | "tags">("conversations");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("admin_sound") !== "false"; } catch { return true; }
  });
  const previousSessionCountRef = useRef<number>(0);

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
        const allQueries = queryClient.getQueriesData<SessionSummary[]>({ queryKey: ["/api/admin/sessions"] })
          .filter(([key]) => (key as string[]).length <= 2);
        allQueries.forEach(([key, old]) => {
          if (!old || !Array.isArray(old)) return;
          queryClient.setQueryData(key, old.map((s: any) =>
            s.sessionId === data.sessionId ? { ...s, ...updatedSession } : s
          ));
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", data.sessionId, "messages"] });
      }
    });

    adminSocket.on("admin_new_message", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      if (data?.sessionId && data?.message) {
        queryClient.setQueryData<Message[]>(
          ["/api/admin/sessions", data.sessionId, "messages"],
          (old) => {
            if (!old) return undefined;
            if (old.some(m => m.id === data.message.id)) return old;
            return [...old, data.message];
          }
        );
      } else if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", data.sessionId, "messages"] });
      }
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
    clearBadge();
    window.addEventListener("focus", clearBadge);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", clearBadge);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [authenticated]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<SessionSummary[]>({
    queryKey: ["/api/admin/sessions", statusFilter],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions?status=${statusFilter}`);
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    },
    enabled: authenticated,
    refetchInterval: 10000,
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

  const ratingsMap = new Map(allRatings.map(r => [r.sessionId, r]));
  const avgRating = allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length : 0;

  useEffect(() => {
    if (!authenticated || !soundEnabled) return;
    if (sessions.length > previousSessionCountRef.current && previousSessionCountRef.current > 0) {
      playNotificationSound();
    }
    previousSessionCountRef.current = sessions.length;
  }, [sessions.length, authenticated, soundEnabled]);

  useEffect(() => {
    if (!authenticated) return;
    async function subscribePush() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const res = await fetch("/api/push/vapid-public-key");
        const { key } = await res.json();
        if (!key) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;
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

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
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
  const baseSessions = isSearching
    ? searchResults.map((r) => ({
        sessionId: r.sessionId,
        userName: r.userName,
        userEmail: r.userEmail,
        messageCount: r.messages.length,
        unreadCount: 0,
        lastMessage: r.messages[0]?.timestamp ? String(r.messages[0].timestamp) : null,
        firstMessage: null,
        status: "active",
        tags: [],
        problemType: null,
        gameName: null,
        adminActive: false,
        contactRequested: false,
        assignedTo: null,
        assignedToName: null,
        assignedToColor: null,
      }))
    : sessions;

  const displaySessions = (() => {
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
  })();

  const selectSession = useCallback((sid: string) => {
    setSelectedSession(sid);
    setMobileView("chat");
  }, []);

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
    <div className="flex flex-col" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif", height: "100dvh" }}>
      <header className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/[0.06] flex items-center justify-between gap-2" style={{ background: "#6200EA" }}>
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
          <img src="/logo-192.webp" alt="CJM" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
          <div className="min-w-0">
            <h1 data-testid="text-admin-title" className="text-sm sm:text-base font-bold text-white leading-tight truncate">Soporte CJM</h1>
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
            adminTab === "conversations" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Chats
          {adminTab === "conversations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        <button
          data-testid="tab-canned-responses"
          onClick={() => setAdminTab("canned")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
            adminTab === "canned" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Atajos
          {adminTab === "canned" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        <button
          data-testid="tab-tags"
          onClick={() => setAdminTab("tags")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "tags" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Etiquetas
          {adminTab === "tags" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        <button
          data-testid="tab-products"
          onClick={() => setAdminTab("products")}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
            adminTab === "products" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Productos
          {adminTab === "products" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        {adminUser?.role === "superadmin" && (
          <button
            data-testid="tab-users"
            onClick={() => setAdminTab("users")}
            className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              adminTab === "users" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Usuarios
            {adminTab === "users" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
            )}
          </button>
        )}
      </div>

      {adminTab === "tags" ? (
        <TagsPanel />
      ) : adminTab === "users" ? (
        <UsersPanel />
      ) : adminTab === "products" ? (
        <ProductsPanel />
      ) : adminTab === "canned" ? (
        <CannedResponsesPanel />
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
                  className="pl-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
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
                          ? "bg-[#6200EA] text-white"
                          : "text-white/40 hover:text-white/60 bg-white/[0.03]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
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
                            : "bg-[#6200EA] text-white border border-transparent"
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
                            : tab.key === "mis_chats" ? "bg-[#6200EA]/20 text-[#6200EA] border border-[#6200EA]/30"
                            : "bg-[#6200EA] text-white border border-transparent"
                          : "text-white/30 hover:text-white/50 bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
              {sessionsLoading && !isSearching ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displaySessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">
                    {isSearching ? "No se encontraron resultados" : "No hay conversaciones aun"}
                  </p>
                </div>
              ) : (
                displaySessions.map((session) => (
                  <SessionCard
                    key={session.sessionId}
                    session={session}
                    onClick={() => selectSession(session.sessionId)}
                    isSelected={selectedSession === session.sessionId}
                    rating={ratingsMap.get(session.sessionId)}
                  />
                ))
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {selectedSession ? (
              <ChatViewer sessionId={selectedSession} searchQuery={debouncedSearch} sessions={sessions} adminUser={adminUser} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-[#6200EA]/10 border border-[#6200EA]/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-[#6200EA]/40" />
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
